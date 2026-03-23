import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" })
const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Auth: get user from JWT
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) throw new Error("No authorization header")

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) throw new Error("Unauthorized")

    const body = await req.json()
    const { mode, price_id, plan_interval, establishment_id, success_url, cancel_url, promo_code } = body

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email, full_name")
      .eq("id", user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.full_name || undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id)
    }

    // ===== SUBSCRIPTION CHECKOUT =====
    if (mode === "subscription") {
      if (!price_id) {
        throw new Error("Missing price_id")
      }

      // If no establishment_id provided, auto-create one
      let finalEstablishmentId = establishment_id
      let establishmentName = "Mon établissement"

      if (!finalEstablishmentId) {
        const { data: newEst, error: estError } = await supabase
          .from("establishments")
          .insert({
            user_id: user.id,
            name: "Mon établissement",
            category: "autre",
            is_active: false,
            primary_color: "#2563eb",
            routing_question: "Comment s'est passée votre expérience ?",
            satisfaction_threshold: 4,
            ai_tone: "chaleureux et professionnel",
            ai_response_length: "medium",
            rating_format: "stars",
            secondary_color: "#1d4ed8",
            google_connection_status: "not_connected",
            total_google_reviews: 0,
          })
          .select()
          .single()
        if (estError || !newEst) {
          throw new Error("Failed to create establishment: " + (estError?.message || "unknown"))
        }
        finalEstablishmentId = newEst.id
        console.log(`Auto-created establishment ${finalEstablishmentId} for user ${user.id}`)
      } else {
        // Fetch existing establishment name
        const { data: est } = await supabase
          .from("establishments")
          .select("name")
          .eq("id", finalEstablishmentId)
          .single()
        if (est?.name) establishmentName = est.name
      }

      // === ANTI-TRIAL-ABUSE: Check if this customer ever had a subscription ===
      let trialDays: number | undefined = 7

      try {
        // Check Stripe for any past subscriptions (active, canceled, trialing, etc.)
        const existingSubs = await stripe.subscriptions.list({
          customer: customerId,
          limit: 1,
          status: "all",
        })

        if (existingSubs.data.length > 0) {
          // Customer already had a subscription — no trial
          trialDays = undefined
          console.log(`Customer ${customerId} already had a subscription — skipping trial`)
        } else {
          console.log(`Customer ${customerId} is new — granting 7-day trial`)
        }
      } catch (e) {
        // If check fails, grant trial anyway (fail-safe)
        console.log("Trial check failed, granting trial by default:", e)
      }

      // Determine price details based on the price_id
      // Live prices
      const priceMap: Record<string, { amount: number; interval: "month" | "year"; product: string; label: string }> = {
        // Live prices
        "price_1TCjEzLMRsVfhf6RMRE1sO8K": { amount: 2900, interval: "month", product: "prod_UB5PuRTzAQrb77", label: "Mensuel" },
        "price_1TCjGwLMRsVfhf6R06JFRqRr": { amount: 24900, interval: "year", product: "prod_UB5RZLGMlKBKeE", label: "Annuel" },
        // Test prices (fallback)
        "price_1TCJcSLMRsVfhf6RykLYqoSx": { amount: 2900, interval: "month", product: "prod_UB5PuRTzAQrb77", label: "Mensuel" },
        "price_1TCJdCLMRsVfhf6RCBzCAUP3": { amount: 24900, interval: "year", product: "prod_UB5RZLGMlKBKeE", label: "Annuel" },
      }

      const priceInfo = priceMap[price_id]

      // Build line_items: use the fixed price_id so that Stripe coupons apply correctly
      // The establishment name goes in the subscription description, not in the product name
      const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
        { price: price_id, quantity: 1 }
      ]

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: customerId,
        mode: "subscription",
        line_items: lineItems,
        metadata: {
          user_id: user.id,
          establishment_id: finalEstablishmentId,
          plan_interval: plan_interval || "monthly",
        },
        success_url: success_url || `${req.headers.get("origin")}/dashboard/settings?checkout=success`,
        cancel_url: cancel_url || `${req.headers.get("origin")}/dashboard/subscription?checkout=cancelled`,
        subscription_data: {
          description: `StarPulse · ${establishmentName}`,
          metadata: {
            user_id: user.id,
            establishment_id: finalEstablishmentId,
          },
          ...(trialDays ? { trial_period_days: trialDays } : {}),
        },
        allow_promotion_codes: true,
        billing_address_collection: "auto",
        locale: "fr",
      }

      // If a promo code was provided, try to apply it
      if (promo_code) {
        try {
          const promotionCodes = await stripe.promotionCodes.list({ code: promo_code, active: true, limit: 1 })
          if (promotionCodes.data.length > 0) {
            sessionParams.discounts = [{ promotion_code: promotionCodes.data[0].id }]
            delete sessionParams.allow_promotion_codes
          }
        } catch (e) {
          console.log("Promo code not found, using allow_promotion_codes instead")
        }
      }

      const session = await stripe.checkout.sessions.create(sessionParams)

      return new Response(JSON.stringify({ url: session.url, session_id: session.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }

    // ===== NFC ORDER (one-time payment) =====
    if (mode === "payment") {
      const { pack_type, quantity, unit_price, total_price, shipping_address, shipping_city, shipping_postal_code } = body

      if (!pack_type || !total_price) {
        throw new Error("Missing pack_type or total_price for NFC order")
      }

      // Create the order in DB first
      const { data: order, error: orderError } = await supabase
        .from("nfc_orders")
        .insert({
          user_id: user.id,
          establishment_id: establishment_id || null,
          pack_type,
          quantity: quantity || 1,
          unit_price: unit_price || total_price,
          total_price,
          shipping_address: shipping_address || null,
          shipping_city: shipping_city || null,
          shipping_postal_code: shipping_postal_code || null,
          status: "pending",
        })
        .select()
        .single()

      if (orderError) throw new Error(`Failed to create order: ${orderError.message}`)

      const packLabels: Record<string, string> = {
        single: "1 Tag NFC StarPulse",
        pack3: "Pack 3 Tags NFC StarPulse",
        pack5: "Pack 5 Tags NFC StarPulse",
        pack10: "Pack 10 Tags NFC StarPulse",
        pack25: "Pack 25 Tags NFC StarPulse",
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "payment",
        line_items: [{
          price_data: {
            currency: "eur",
            product_data: {
              name: packLabels[pack_type] || `Tags NFC StarPulse (${pack_type})`,
              description: "Tags NFC pré-encodés, prêts à l'emploi",
            },
            unit_amount: Math.round(total_price * 100),
          },
          quantity: 1,
        }],
        metadata: {
          user_id: user.id,
          pack_type,
          order_id: order.id,
        },
        shipping_address_collection: { allowed_countries: ["FR", "BE", "CH", "LU", "MC"] },
        success_url: success_url || `${req.headers.get("origin")}/dashboard?nfc_order=success`,
        cancel_url: cancel_url || `${req.headers.get("origin")}/dashboard?nfc_order=cancelled`,
        locale: "fr",
      })

      return new Response(JSON.stringify({ url: session.url, session_id: session.id, order_id: order.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }

    // ===== MANAGE BILLING (customer portal) =====
    if (mode === "portal") {
      if (!customerId) throw new Error("No Stripe customer found")

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: success_url || `${req.headers.get("origin")}/dashboard/settings`,
      })

      return new Response(JSON.stringify({ url: portalSession.url }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }

    throw new Error(`Unknown mode: ${mode}`)

  } catch (err) {
    console.error("Checkout error:", err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
