import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!
const FROM_EMAIL = "StarPulse <contact@star-pulse.com>"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

// Email templates
function getTemplate(type: string, data: Record<string, string>): { subject: string; html: string } {
  const baseStyle = `
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    max-width: 560px;
    margin: 0 auto;
    padding: 40px 24px;
    background: #fafaf8;
  `
  const cardStyle = `
    background: #ffffff;
    border-radius: 16px;
    padding: 32px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    border: 1px solid #f0f0ec;
  `
  const buttonStyle = `
    display: inline-block;
    padding: 14px 28px;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #ffffff;
    text-decoration: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 15px;
  `
  const footerStyle = `
    text-align: center;
    padding-top: 24px;
    font-size: 12px;
    color: #999;
  `

  const header = `
    <div style="text-align:center; margin-bottom:24px;">
      <span style="font-size:24px; font-weight:700; color:#1a1a18; letter-spacing:-0.03em;">
        Star<span style="color:#2563eb;">Pulse</span>
      </span>
    </div>
  `

  const footer = `
    <div style="${footerStyle}">
      <p>StarPulse · Boostez vos avis Google</p>
      <p><a href="https://app.star-pulse.com" style="color:#2563eb; text-decoration:none;">app.star-pulse.com</a></p>
      <p style="margin-top:8px;">Si vous n'avez pas effectué cette action, ignorez cet email.</p>
    </div>
  `

  switch (type) {
    case "welcome":
      return {
        subject: "Bienvenue sur StarPulse !",
        html: `<div style="${baseStyle}">
          ${header}
          <div style="${cardStyle}">
            <h1 style="font-size:22px; font-weight:700; color:#1a1a18; margin:0 0 16px; text-align:center;">Bienvenue ${data.name || ""} !</h1>
            <p style="font-size:15px; color:#555; line-height:1.6; margin:0 0 16px;">
              Votre compte StarPulse est prêt. Vous pouvez maintenant configurer votre premier établissement et commencer à collecter des avis Google.
            </p>
            <p style="font-size:15px; color:#555; line-height:1.6; margin:0 0 24px;">
              Voici les prochaines étapes :
            </p>
            <ol style="font-size:14px; color:#555; line-height:1.8; padding-left:20px; margin:0 0 24px;">
              <li>Configurez votre établissement dans les Réglages</li>
              <li>Créez votre premier QR code</li>
              <li>Placez-le dans votre commerce</li>
              <li>Regardez vos avis Google décoller</li>
            </ol>
            <div style="text-align:center;">
              <a href="https://app.star-pulse.com/dashboard" style="${buttonStyle}">Accéder à mon dashboard</a>
            </div>
          </div>
          ${footer}
        </div>`,
      }

    case "subscription_confirmed":
      return {
        subject: "Votre abonnement StarPulse est actif !",
        html: `<div style="${baseStyle}">
          ${header}
          <div style="${cardStyle}">
            <h1 style="font-size:22px; font-weight:700; color:#1a1a18; margin:0 0 16px; text-align:center;">Abonnement confirmé !</h1>
            <p style="font-size:15px; color:#555; line-height:1.6; margin:0 0 16px;">
              Merci pour votre confiance ! Votre abonnement StarPulse ${data.plan || ""} pour <strong>${data.establishment || ""}</strong> est maintenant actif.
            </p>
            ${data.trial_end ? `<p style="font-size:14px; color:#888; line-height:1.6; margin:0 0 16px;">Votre essai gratuit se termine le <strong>${data.trial_end}</strong>. Aucun prélèvement avant cette date.</p>` : ""}
            <div style="text-align:center; margin-top:24px;">
              <a href="https://app.star-pulse.com/dashboard" style="${buttonStyle}">Gérer mon établissement</a>
            </div>
          </div>
          ${footer}
        </div>`,
      }

    case "subscription_cancelled":
      return {
        subject: "Votre abonnement StarPulse a été annulé",
        html: `<div style="${baseStyle}">
          ${header}
          <div style="${cardStyle}">
            <h1 style="font-size:22px; font-weight:700; color:#1a1a18; margin:0 0 16px; text-align:center;">Abonnement annulé</h1>
            <p style="font-size:15px; color:#555; line-height:1.6; margin:0 0 16px;">
              Votre abonnement pour <strong>${data.establishment || ""}</strong> a été annulé.
            </p>
            ${data.end_date ? `<p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 16px;">Vous conservez l'accès jusqu'au <strong>${data.end_date}</strong>.</p>` : ""}
            <p style="font-size:14px; color:#888; line-height:1.6; margin:0 0 24px;">
              Vous pouvez réactiver votre abonnement à tout moment depuis votre dashboard.
            </p>
            <div style="text-align:center;">
              <a href="https://app.star-pulse.com/dashboard/subscription" style="${buttonStyle}">Réactiver mon abonnement</a>
            </div>
          </div>
          ${footer}
        </div>`,
      }

    case "trial_ending":
      return {
        subject: "Votre essai gratuit StarPulse se termine bientôt",
        html: `<div style="${baseStyle}">
          ${header}
          <div style="${cardStyle}">
            <h1 style="font-size:22px; font-weight:700; color:#1a1a18; margin:0 0 16px; text-align:center;">Votre essai se termine bientôt</h1>
            <p style="font-size:15px; color:#555; line-height:1.6; margin:0 0 16px;">
              Votre période d'essai pour <strong>${data.establishment || ""}</strong> se termine le <strong>${data.trial_end || ""}</strong>.
            </p>
            <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 24px;">
              Après cette date, votre abonnement sera automatiquement activé. Aucune action requise de votre part.
            </p>
            <div style="text-align:center;">
              <a href="https://app.star-pulse.com/dashboard/subscription" style="${buttonStyle}">Voir mon abonnement</a>
            </div>
          </div>
          ${footer}
        </div>`,
      }

    case "account_deleted":
      return {
        subject: "Votre compte StarPulse a été supprimé",
        html: `<div style="${baseStyle}">
          ${header}
          <div style="${cardStyle}">
            <h1 style="font-size:22px; font-weight:700; color:#1a1a18; margin:0 0 16px; text-align:center;">Compte supprimé</h1>
            <p style="font-size:15px; color:#555; line-height:1.6; margin:0 0 16px;">
              Votre compte StarPulse et toutes les données associées ont été définitivement supprimés, conformément à votre demande.
            </p>
            <p style="font-size:14px; color:#888; line-height:1.6; margin:0 0 16px;">
              Si vos abonnements étaient encore actifs, ils ont été annulés automatiquement.
            </p>
            <p style="font-size:14px; color:#888; line-height:1.6; margin:0;">
              Si vous changez d'avis, vous pouvez recréer un compte à tout moment sur <a href="https://app.star-pulse.com" style="color:#2563eb; text-decoration:none;">star-pulse.com</a>.
            </p>
          </div>
          ${footer}
        </div>`,
      }

    case "payment_failed":
      return {
        subject: "Problème de paiement sur votre abonnement StarPulse",
        html: `<div style="${baseStyle}">
          ${header}
          <div style="${cardStyle}">
            <h1 style="font-size:22px; font-weight:700; color:#1a1a18; margin:0 0 16px; text-align:center;">Échec de paiement</h1>
            <p style="font-size:15px; color:#555; line-height:1.6; margin:0 0 16px;">
              Le renouvellement de votre abonnement pour <strong>${data.establishment || ""}</strong> n'a pas pu être effectué.
            </p>
            <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 16px;">
              Cela peut arriver si votre carte a expiré ou si les fonds sont insuffisants. Votre accès reste actif pour le moment, mais il sera suspendu si le paiement n'est pas régularisé.
            </p>
            <p style="font-size:14px; color:#555; line-height:1.6; margin:0 0 24px;">
              Veuillez mettre à jour vos informations de paiement pour continuer à utiliser StarPulse.
            </p>
            <div style="text-align:center;">
              <a href="https://app.star-pulse.com/dashboard/subscription" style="${buttonStyle}">Mettre à jour mon paiement</a>
            </div>
          </div>
          ${footer}
        </div>`,
      }

    default:
      return { subject: "StarPulse", html: `<p>${data.message || ""}</p>` }
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { type, to, data } = await req.json()

    if (!type || !to) {
      return new Response(JSON.stringify({ error: "Missing type or to" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const { subject, html } = getTemplate(type, data || {})

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      console.error("Resend error:", result)
      return new Response(JSON.stringify({ error: result }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })

  } catch (err) {
    console.error("Send email error:", err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})
