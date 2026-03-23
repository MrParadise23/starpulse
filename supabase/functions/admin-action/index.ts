import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno"

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" })
const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const ADMIN_EMAIL = "louis23rs@gmail.com"

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
    // Verify the caller is the admin
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const token = authHeader.replace("Bearer ", "")
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user || user.email !== ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Accès admin requis" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { action, target_user_id, subscription_id } = await req.json()

    // ========================================
    // ACTION: DELETE USER (cascade complète)
    // ========================================
    if (action === "delete_user") {
      if (!target_user_id) throw new Error("target_user_id requis")
      console.log(`[ADMIN] Deleting user ${target_user_id}`)

      // Get user email before deletion (for logging)
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", target_user_id)
        .single()

      // 1. Cancel all active Stripe subscriptions
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("stripe_subscription_id, status")
        .eq("user_id", target_user_id)
        .in("status", ["active", "trialing", "canceling"])

      if (subscriptions) {
        for (const sub of subscriptions) {
          if (sub.stripe_subscription_id) {
            try {
              await stripe.subscriptions.cancel(sub.stripe_subscription_id)
              console.log(`Cancelled Stripe sub ${sub.stripe_subscription_id}`)
            } catch (e) {
              console.error(`Failed to cancel sub:`, e)
            }
          }
        }
      }

      // 2. Get all establishment IDs
      const { data: establishments } = await supabase
        .from("establishments")
        .select("id")
        .eq("user_id", target_user_id)

      const estIds = establishments?.map(e => e.id) || []

      if (estIds.length > 0) {
        // 3. Delete related data
        await supabase.from("google_reviews").delete().in("establishment_id", estIds)
        await supabase.from("feedbacks").delete().in("establishment_id", estIds)
        await supabase.from("plates").delete().in("establishment_id", estIds)
        await supabase.from("scans").delete().in("establishment_id", estIds)
        await supabase.from("subscriptions").delete().in("establishment_id", estIds)
        await supabase.from("commissions").delete().in("establishment_id", estIds)
      }

      // 4. Delete user-level subscriptions
      await supabase.from("subscriptions").delete().eq("user_id", target_user_id)

      // 5. Delete affiliate data
      const { data: affiliate } = await supabase
        .from("affiliates")
        .select("id")
        .eq("user_id", target_user_id)
        .single()

      if (affiliate) {
        await supabase.from("commissions").delete().eq("affiliate_id", affiliate.id)
        await supabase.from("referrals").delete().eq("affiliate_id", affiliate.id)
        await supabase.from("affiliates").delete().eq("id", affiliate.id)
      }

      await supabase.from("referrals").delete().eq("referred_user_id", target_user_id)

      // 6. Delete establishments
      if (estIds.length > 0) {
        await supabase.from("establishments").delete().in("id", estIds)
      }

      // 7. Delete profile
      await supabase.from("profiles").delete().eq("id", target_user_id)

      // 8. Send deletion email
      if (profile?.email) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseServiceKey}` },
            body: JSON.stringify({ type: "account_deleted", to: profile.email, data: {} }),
          })
        } catch (e) { console.log("Email error (non-blocking):", e) }
      }

      // 9. Delete auth user
      const { error: deleteError } = await supabase.auth.admin.deleteUser(target_user_id)
      if (deleteError) {
        console.error("Error deleting auth user:", deleteError)
        throw new Error("Erreur suppression compte auth")
      }

      console.log(`[ADMIN] Successfully deleted user ${target_user_id} (${profile?.email})`)
      return new Response(JSON.stringify({ success: true, message: `Utilisateur ${profile?.email || target_user_id} supprimé` }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // ========================================
    // ACTION: REFUND SUBSCRIPTION
    // ========================================
    if (action === "refund_subscription") {
      if (!subscription_id) throw new Error("subscription_id requis")
      console.log(`[ADMIN] Refunding subscription ${subscription_id}`)

      // Get the subscription from DB
      const { data: sub, error: subError } = await supabase
        .from("subscriptions")
        .select("*, establishments(name)")
        .eq("id", subscription_id)
        .single()

      if (subError || !sub) throw new Error("Abonnement introuvable")
      if (!sub.stripe_subscription_id) throw new Error("Pas d'ID Stripe lié à cet abonnement")

      // Get the latest invoice for this subscription
      const invoices = await stripe.invoices.list({
        subscription: sub.stripe_subscription_id,
        limit: 1,
        status: "paid",
      })

      if (invoices.data.length === 0) {
        // No paid invoice — might be in trial. Just cancel.
        console.log("No paid invoice found, cancelling subscription only")
        try {
          await stripe.subscriptions.cancel(sub.stripe_subscription_id)
        } catch (e) { console.error("Cancel error:", e) }

        await supabase.from("subscriptions").update({
          status: "refunded",
          cancelled_at: new Date().toISOString(),
        }).eq("id", subscription_id)

        // Deactivate establishment
        if (sub.establishment_id) {
          await supabase.from("establishments").update({ is_active: false }).eq("id", sub.establishment_id)
        }

        return new Response(JSON.stringify({ success: true, message: "Abonnement annulé (aucune facture payée à rembourser)" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        })
      }

      const invoice = invoices.data[0]
      const chargeId = invoice.charge as string

      if (!chargeId) throw new Error("Aucun paiement trouvé sur cette facture")

      // Refund the charge
      const refund = await stripe.refunds.create({ charge: chargeId })
      console.log(`Refund created: ${refund.id} for charge ${chargeId}`)

      // Cancel the subscription
      try {
        await stripe.subscriptions.cancel(sub.stripe_subscription_id)
      } catch (e) { console.error("Cancel after refund error:", e) }

      // Update DB
      await supabase.from("subscriptions").update({
        status: "refunded",
        cancelled_at: new Date().toISOString(),
      }).eq("id", subscription_id)

      // Deactivate establishment
      if (sub.establishment_id) {
        await supabase.from("establishments").update({ is_active: false }).eq("id", sub.establishment_id)
      }

      // Mark related commissions as refunded
      if (sub.establishment_id) {
        await supabase.from("commissions").update({
          status: "refunded",
        }).eq("establishment_id", sub.establishment_id).eq("status", "pending")
      }

      const estName = sub.establishments?.name || "Établissement"
      console.log(`[ADMIN] Successfully refunded subscription for ${estName}`)
      return new Response(JSON.stringify({ success: true, message: `Abonnement ${estName} remboursé (${(invoice.amount_paid / 100).toFixed(2)}€)` }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // ========================================
    // ACTION: CANCEL SUBSCRIPTION (sans remboursement)
    // ========================================
    if (action === "cancel_subscription") {
      if (!subscription_id) throw new Error("subscription_id requis")
      console.log(`[ADMIN] Cancelling subscription ${subscription_id}`)

      const { data: sub, error: subError } = await supabase
        .from("subscriptions")
        .select("*, establishments(name)")
        .eq("id", subscription_id)
        .single()

      if (subError || !sub) throw new Error("Abonnement introuvable")

      // Cancel on Stripe (immediate, not at period end)
      if (sub.stripe_subscription_id) {
        try {
          await stripe.subscriptions.cancel(sub.stripe_subscription_id)
          console.log(`Cancelled Stripe sub ${sub.stripe_subscription_id}`)
        } catch (e) {
          console.error("Stripe cancel error:", e)
        }
      }

      // Update DB
      await supabase.from("subscriptions").update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      }).eq("id", subscription_id)

      // Deactivate establishment
      if (sub.establishment_id) {
        await supabase.from("establishments").update({ is_active: false }).eq("id", sub.establishment_id)
      }

      const estName = sub.establishments?.name || "Établissement"
      console.log(`[ADMIN] Successfully cancelled subscription for ${estName}`)
      return new Response(JSON.stringify({ success: true, message: `Abonnement ${estName} annulé` }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    throw new Error(`Action inconnue: ${action}`)

  } catch (err) {
    console.error("[ADMIN] Error:", err)
    return new Response(JSON.stringify({ error: err.message || "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
