import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" })
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature" } })
  }

  const signature = req.headers.get("stripe-signature")
  if (!signature) {
    return new Response("No signature", { status: 400 })
  }

  const body = await req.text()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  console.log(`Processing event: ${event.type}`)

  try {
    switch (event.type) {
      // ===== CHECKOUT COMPLETED =====
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        // Subscription checkout
        if (session.mode === "subscription") {
          const userId = session.metadata?.user_id
          const establishmentId = session.metadata?.establishment_id
          const planInterval = session.metadata?.plan_interval || "monthly"

          if (!userId || !establishmentId) {
            console.error("Missing metadata in checkout session")
            break
          }

          // Update profile with stripe_customer_id
          await supabase
            .from("profiles")
            .update({ stripe_customer_id: session.customer as string })
            .eq("id", userId)

          // Retrieve the subscription from Stripe
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

          // Upsert subscription in DB
          const { error } = await supabase
            .from("subscriptions")
            .upsert({
              user_id: userId,
              establishment_id: establishmentId,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: session.customer as string,
              stripe_price_id: subscription.items.data[0]?.price?.id,
              stripe_checkout_session_id: session.id,
              plan: "essential",
              plan_interval: planInterval,
              billing_period: planInterval,
              price_monthly: planInterval === "yearly" ? 20.75 : 29.00,
              status: subscription.status === "trialing" ? "trialing" : "active",
              trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            }, {
              onConflict: "establishment_id",
            })

          if (error) console.error("Error upserting subscription:", error)
          else console.log(`Subscription created for user ${userId}, plan: ${planInterval}`)
        }

        // One-time payment (NFC tags)
        if (session.mode === "payment") {
          const userId = session.metadata?.user_id
          const packType = session.metadata?.pack_type
          const orderId = session.metadata?.order_id

          if (orderId) {
            await supabase
              .from("nfc_orders")
              .update({
                status: "paid",
                stripe_payment_intent_id: session.payment_intent as string,
                updated_at: new Date().toISOString(),
              })
              .eq("id", orderId)

            console.log(`NFC order ${orderId} marked as paid`)
          }
        }
        break
      }

      // ===== INVOICE PAID (recurring) =====
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          const { error } = await supabase
            .from("subscriptions")
            .update({
              status: "active",
              current_period_start: new Date(invoice.period_start * 1000).toISOString(),
              current_period_end: new Date(invoice.period_end * 1000).toISOString(),
            })
            .eq("stripe_subscription_id", invoice.subscription as string)

          if (error) console.error("Error updating subscription on invoice.paid:", error)
          else console.log(`Subscription ${invoice.subscription} renewed`)
        }
        break
      }

      // ===== INVOICE PAYMENT FAILED =====
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.subscription) {
          await supabase
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", invoice.subscription as string)

          console.log(`Subscription ${invoice.subscription} marked as past_due`)
        }
        break
      }

      // ===== SUBSCRIPTION UPDATED =====
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const cancelAtPeriodEnd = subscription.cancel_at_period_end

        await supabase
          .from("subscriptions")
          .update({
            status: subscription.status === "trialing" ? "trialing" : cancelAtPeriodEnd ? "canceling" : subscription.status,
            cancelled_at: cancelAtPeriodEnd ? new Date().toISOString() : null,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id)

        console.log(`Subscription ${subscription.id} updated, status: ${subscription.status}, cancel_at_period_end: ${cancelAtPeriodEnd}`)
        break
      }

      // ===== SUBSCRIPTION DELETED =====
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id)

        console.log(`Subscription ${subscription.id} cancelled`)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    console.error(`Error processing ${event.type}:`, err)
    return new Response(`Error: ${err.message}`, { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  })
})
