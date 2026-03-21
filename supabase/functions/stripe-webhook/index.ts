import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" })
const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Helper: calculate and create affiliate commission
async function processAffiliateCommission(userId: string, amountPaid: number, periodStart: number, periodEnd: number) {
  if (amountPaid <= 0) {
    console.log("Skipping commission: amount is 0 (trial)")
    return
  }

  // Find if this user was referred by someone
  const { data: referral } = await supabase
    .from("referrals")
    .select("id, affiliate_id, commission_end_date, status")
    .eq("referred_user_id", userId)
    .eq("status", "active")
    .single()

  if (!referral) {
    console.log(`No active referral found for user ${userId}`)
    return
  }

  // Check if commission period is still valid
  if (referral.commission_end_date && new Date(referral.commission_end_date) < new Date()) {
    console.log(`Commission period expired for referral ${referral.id}`)
    return
  }

  // Get affiliate's commission rate
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select("id, commission_rate")
    .eq("id", referral.affiliate_id)
    .single()

  if (!affiliate) return

  const commissionAmount = Math.round(amountPaid * affiliate.commission_rate * 100) / 100

  // Check if commission already exists for this period (avoid duplicates)
  const pStart = new Date(periodStart * 1000).toISOString().split("T")[0]
  const pEnd = new Date(periodEnd * 1000).toISOString().split("T")[0]

  const { data: existing } = await supabase
    .from("commissions")
    .select("id")
    .eq("referral_id", referral.id)
    .eq("period_start", pStart)
    .eq("period_end", pEnd)
    .single()

  if (existing) {
    console.log(`Commission already exists for referral ${referral.id}, period ${pStart} - ${pEnd}`)
    return
  }

  // Create commission
  const { error: commError } = await supabase
    .from("commissions")
    .insert({
      affiliate_id: affiliate.id,
      referral_id: referral.id,
      amount: commissionAmount,
      period_start: pStart,
      period_end: pEnd,
      status: "pending",
    })

  if (commError) {
    console.error("Error creating commission:", commError)
    return
  }

  // Update affiliate total_earned
  await supabase
    .from("affiliates")
    .update({ total_earned: affiliate.commission_rate }) // Will be replaced by RPC
    .eq("id", affiliate.id)

  // Use raw SQL to increment
  await supabase.rpc("increment_affiliate_earnings", {
    aff_id: affiliate.id,
    earn_amount: commissionAmount,
  })

  console.log(`Commission created: ${commissionAmount} EUR for affiliate ${affiliate.id} (referral ${referral.id})`)
}

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
    const cryptoProvider = Stripe.createSubtleCryptoProvider()
    event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret, undefined, cryptoProvider)
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

        if (session.mode === "subscription") {
          const userId = session.metadata?.user_id
          const establishmentId = session.metadata?.establishment_id
          const planInterval = session.metadata?.plan_interval || "monthly"

          if (!userId || !establishmentId) {
            console.error("Missing metadata in checkout session")
            break
          }

          await supabase
            .from("profiles")
            .update({ stripe_customer_id: session.customer as string })
            .eq("id", userId)

          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

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

          // Activate the establishment (in case it was created as a draft for multisite)
          await supabase
            .from("establishments")
            .update({ is_active: true })
            .eq("id", establishmentId)
          console.log(`Establishment ${establishmentId} activated`)

          // Link referral to establishment
          await supabase
            .from("referrals")
            .update({ referred_establishment_id: establishmentId })
            .eq("referred_user_id", userId)
            .is("referred_establishment_id", null)
        }

        if (session.mode === "payment") {
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

      // ===== INVOICE PAID =====
      case "invoice.payment_succeeded":
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

          // === AFFILIATE COMMISSION ===
          const { data: sub } = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", invoice.subscription as string)
            .single()

          if (sub) {
            const amountPaid = (invoice.amount_paid || 0) / 100
            await processAffiliateCommission(sub.user_id, amountPaid, invoice.period_start, invoice.period_end)
          }
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
        console.log(`Subscription ${subscription.id} updated`)
        break
      }

      // ===== SUBSCRIPTION DELETED =====
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await supabase
          .from("subscriptions")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
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
