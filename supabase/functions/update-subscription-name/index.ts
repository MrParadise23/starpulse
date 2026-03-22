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

    const { establishment_id, name } = await req.json()
    if (!establishment_id || !name) throw new Error("Missing establishment_id or name")

    // Verify the user owns this establishment
    const { data: est } = await supabase
      .from("establishments")
      .select("id, user_id")
      .eq("id", establishment_id)
      .eq("user_id", user.id)
      .single()

    if (!est) throw new Error("Establishment not found or unauthorized")

    // Find the Stripe subscription for this establishment
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("establishment_id", establishment_id)
      .in("status", ["active", "trialing", "canceling"])
      .single()

    if (!sub?.stripe_subscription_id) {
      // No active subscription — nothing to update on Stripe
      return new Response(JSON.stringify({ ok: true, message: "No active subscription to update" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }

    // Update the Stripe subscription description
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      description: `StarPulse · ${name}`,
    })

    // Also update the product name on the subscription item
    // so it shows the commerce name in the billing portal title
    try {
      const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id)
      if (stripeSub.items.data.length > 0) {
        const item = stripeSub.items.data[0]
        const productId = typeof item.price.product === "string" ? item.price.product : item.price.product.id
        // Get current product name to determine plan label
        const product = await stripe.products.retrieve(productId)
        const isAnnual = item.price.recurring?.interval === "year"
        const planLabel = isAnnual ? "Annuel" : "Mensuel"
        
        // Update the product name — but only if it's a per-subscription product (inline price)
        // For shared products, we create a new inline product instead
        const newProductName = `StarPulse ${planLabel} · ${name}`
        
        // Check if this product is shared (used by multiple subscriptions)
        const prices = await stripe.prices.list({ product: productId, limit: 5 })
        const isSharedProduct = prices.data.length > 1 || product.name === "StarPulse Mensuel" || product.name === "StarPulse Annuel"
        
        if (!isSharedProduct) {
          // Safe to rename — this product is unique to this subscription
          await stripe.products.update(productId, { name: newProductName })
          console.log(`Updated product ${productId} name to: ${newProductName}`)
        }
      }
    } catch (e) {
      // Non-critical — description update already succeeded
      console.log("Could not update product name:", e)
    }

    console.log(`Updated Stripe subscription ${sub.stripe_subscription_id} description to: StarPulse · ${name}`)

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })
  } catch (err) {
    console.error("Update subscription name error:", err)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    })
  }
})
