// supabase/functions/generate-private-reply/index.ts
// Edge Function pour generer une suggestion de recontact prive (CDC section 5.4 / 7.6)
// Le commercant recoit un retour negatif et peut demander une aide IA pour rediger :
// - un email de reponse
// - un message de recontact
// - un texte court a copier-coller

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PrivateReplyRequest {
  client_first_name: string
  client_comment: string | null
  client_rating: number | null
  establishment_name: string
  reply_type: 'email' | 'sms' | 'text' // email, message court, ou texte libre
  ai_tone: string
  ai_instructions: string | null
}

function buildPrompt(req: PrivateReplyRequest): string {
  const typeLabels: Record<string, string> = {
    email: 'un email de reponse poli et professionnel',
    sms: 'un message SMS court (max 300 caracteres)',
    text: 'un texte de recontact a copier-coller',
  }

  let prompt = `Tu es le gerant de "${req.establishment_name}". Un client insatisfait a laisse un retour prive.\n\n`
  prompt += `PRENOM DU CLIENT : ${req.client_first_name}\n`
  prompt += `NOTE DONNEE : ${req.client_rating || 'non precisee'}/5\n`
  prompt += `COMMENTAIRE : ${req.client_comment || '(aucun commentaire)'}\n\n`
  prompt += `TON : ${req.ai_tone}\n`
  if (req.ai_instructions) prompt += `INSTRUCTIONS : ${req.ai_instructions}\n`
  prompt += `\nRedige ${typeLabels[req.reply_type] || typeLabels.text}.\n`
  prompt += `L'objectif est de recontacter ce client de maniere humaine et sincere, sans formule generique.`

  return prompt
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: PrivateReplyRequest = await req.json()
    const prompt = buildPrompt(body)

    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      const fallback = `Bonjour ${body.client_first_name}, merci pour votre retour. Nous avons bien pris note de vos remarques et souhaitons en discuter avec vous. N'hesitez pas a nous repondre, nous ferons notre possible pour ameliorer votre experience.`
      return new Response(
        JSON.stringify({ reply: fallback, source: 'fallback' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Tu es un assistant qui aide les commercants a recontacter des clients insatisfaits de maniere humaine et personnalisee.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
    })

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content?.trim() || ''

    return new Response(
      JSON.stringify({ reply, source: 'openai' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Erreur', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
