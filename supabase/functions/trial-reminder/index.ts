import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabaseUrl = Deno.env.get("SUPABASE_URL")!
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

async function sendEmail(type: string, to: string, data: Record<string, string> = {}) {
  try {
    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${supabaseServiceKey}` },
      body: JSON.stringify({ type, to, data }),
    })
    console.log(`Email sent: ${type} to ${to}`)
  } catch (e) {
    console.error(`Failed to send email ${type} to ${to}:`, e)
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Find subscriptions with trial ending in exactly 2 days
    const now = new Date()
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    const startOfDay = new Date(twoDaysFromNow.getFullYear(), twoDaysFromNow.getMonth(), twoDaysFromNow.getDate()).toISOString()
    const endOfDay = new Date(twoDaysFromNow.getFullYear(), twoDaysFromNow.getMonth(), twoDaysFromNow.getDate() + 1).toISOString()

    const { data: expiringTrials, error } = await supabase
      .from("subscriptions")
      .select("id, user_id, establishment_id, trial_ends_at")
      .eq("status", "trialing")
      .gte("trial_ends_at", startOfDay)
      .lt("trial_ends_at", endOfDay)

    if (error) {
      console.error("Error querying expiring trials:", error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    console.log(`Found ${expiringTrials?.length || 0} trials ending in 2 days`)

    let sent = 0
    for (const sub of expiringTrials || []) {
      const { data: profile } = await supabase.from("profiles").select("email").eq("id", sub.user_id).single()
      const { data: est } = await supabase.from("establishments").select("name").eq("id", sub.establishment_id).single()

      if (profile?.email) {
        await sendEmail("trial_ending", profile.email, {
          establishment: est?.name || "",
          trial_end: new Date(sub.trial_ends_at).toLocaleDateString("fr-FR"),
        })
        sent++
      }
    }

    return new Response(JSON.stringify({ success: true, checked: expiringTrials?.length || 0, sent }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err) {
    console.error("Trial reminder error:", err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
