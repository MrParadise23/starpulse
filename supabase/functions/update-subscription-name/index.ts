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
