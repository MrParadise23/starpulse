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
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) throw new Error("No authorization header")

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) throw new Error("Unauthorized")

    const { subscription_id, target_interval } = await req.json()
    if (!subscription_id || !target_interval) throw new Error("Missing subscription_id or target_interval")
    if (!["monthly", "yearly"].includes(target_interval)) throw new Error("Invalid target_interval")

    // Get the subscription from DB
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, establishment_id, user_id")
      .eq("id", subscription_id)
      .eq("user_id", user.id)
      .single()

    if (!sub?.stripe_subscription_id) throw new Error("Subscription not found")

    // Get establishment name for the new product
    const { data: est } = await supabase
      .from("establishments")
      .select("name")
      .eq("id", sub.establishment_id)
      .single()
    const estName = est?.name || "Mon établissement"

    // Retrieve the current Stripe subscription
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id)
    const currentItem = stripeSub.items.data[0]
    if (!currentItem) throw new Error("No subscription item found")

    // Determine new price details
    const isUpgrade = target_interval === "yearly"
    const newAmount = isUpgrade ? 24900 : 2900
    const newInterval = isUpgrade ? "year" : "month"
    const planLabel = isUpgrade ? "Annuel" : "Mensuel"

    // Create a new product with the establishment name
    const newProduct = await stripe.products.create({
      name: `StarPulse ${planLabel} · ${estName}`,
    })

    // Create a new price for this product
    const newPrice = await stripe.prices.create({
      product: newProduct.id,
      unit_amount: newAmount,
      currency: "eur",
      recurring: { interval: newInterval },
    })

    // Update the subscription item with the new price
    // If currently in trial: keep the trial, no proration (customer pays nothing until trial ends)
    // If active (monthly → yearly): prorate the remaining monthly period
    // If active (yearly → monthly): apply at next period
    const isTrialing = stripeSub.status === "trialing"

    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      items: [{
        id: currentItem.id,
        price: newPrice.id,
      }],
      proration_behavior: isTrialing ? "none" : (isUpgrade ? "create_prorations" : "none"),
      description: `StarPulse · ${estName}`,
    })

    // Update the subscription in DB
    await supabase
      .from("subscriptions")
      .update({
        plan_interval: target_interval,
        price_monthly: isUpgrade ? 20.75 : 29.00,
      })
      .eq("id", subscription_id)

    console.log(`Subscription ${sub.stripe_subscription_id} switched to ${target_interval} for ${estName}`)

    return new Response(JSON.stringify({ ok: true, new_interval: target_interval }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err) {
    console.error("Switch plan error:", err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
