import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" })
const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { user_id } = await req.json()

    // Security: ensure the authenticated user is deleting their own account
    if (user.id !== user_id) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    console.log(`Starting account deletion for user ${user_id}`)

    // 1. Cancel all active Stripe subscriptions
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", user_id)
      .in("status", ["active", "trialing", "canceling"])

    if (subscriptions && subscriptions.length > 0) {
      for (const sub of subscriptions) {
        if (sub.stripe_subscription_id) {
          try {
            await stripe.subscriptions.cancel(sub.stripe_subscription_id)
            console.log(`Cancelled Stripe subscription ${sub.stripe_subscription_id}`)
          } catch (stripeErr) {
            console.error(`Failed to cancel subscription ${sub.stripe_subscription_id}:`, stripeErr)
            // Continue anyway - don't block deletion
          }
        }
      }
    }

    // 2. Get all establishment IDs for this user
    const { data: establishments } = await supabase
      .from("establishments")
      .select("id")
      .eq("user_id", user_id)

    const estIds = establishments?.map(e => e.id) || []

    if (estIds.length > 0) {
      // 3. Delete related data for all establishments
      await supabase.from("google_reviews").delete().in("establishment_id", estIds)
      console.log("Deleted google_reviews")

      await supabase.from("feedbacks").delete().in("establishment_id", estIds)
      console.log("Deleted feedbacks")

      await supabase.from("plates").delete().in("establishment_id", estIds)
      console.log("Deleted plates")

      await supabase.from("scans").delete().in("establishment_id", estIds)
      console.log("Deleted scans")

      // Delete subscriptions
      await supabase.from("subscriptions").delete().in("establishment_id", estIds)
      console.log("Deleted subscriptions")

      // Delete commissions linked to these establishments
      await supabase.from("commissions").delete().in("establishment_id", estIds)
      console.log("Deleted commissions")
    }

    // 4. Delete user-level subscriptions (those not linked to an establishment)
    await supabase.from("subscriptions").delete().eq("user_id", user_id)

    // 5. Delete affiliate data if any
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("id")
      .eq("user_id", user_id)
      .single()

    if (affiliate) {
      await supabase.from("commissions").delete().eq("affiliate_id", affiliate.id)
      await supabase.from("referrals").delete().eq("affiliate_id", affiliate.id)
      await supabase.from("affiliates").delete().eq("id", affiliate.id)
      console.log("Deleted affiliate data")
    }

    // Also delete referrals where this user was referred
    await supabase.from("referrals").delete().eq("referred_user_id", user_id)

    // 6. Delete establishments
    if (estIds.length > 0) {
      await supabase.from("establishments").delete().in("id", estIds)
      console.log("Deleted establishments")
    }

    // 7. Delete user profile
    await supabase.from("profiles").delete().eq("id", user_id)
    console.log("Deleted profile")

    // 8. Send account deletion confirmation email (before deleting auth user)
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseServiceKey}` },
        body: JSON.stringify({ type: "account_deleted", to: user.email, data: {} }),
      })
      console.log(`Account deletion email sent to ${user.email}`)
    } catch (e) { console.log("Email send error (non-blocking):", e) }

    // 9. Delete the auth user (requires service role)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user_id)
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError)
      throw new Error("Erreur lors de la suppression du compte utilisateur")
    }
    console.log(`Successfully deleted user ${user_id}`)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err) {
    console.error("Delete account error:", err)
    return new Response(JSON.stringify({ error: err.message || "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
