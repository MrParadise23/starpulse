// supabase/functions/generate-review-reply/index.ts
// Edge Function pour generer une reponse IA a un avis Google
// Utilise les parametres de voix de marque du commercant (CDC section 7.8)
//
// DEPLOIEMENT : supabase functions deploy generate-review-reply
// VARIABLES D'ENVIRONNEMENT REQUISES :
//   - OPENAI_API_KEY (ou ANTHROPIC_API_KEY selon le provider choisi)
//
// APPEL DEPUIS LE FRONT :
// const { data } = await supabase.functions.invoke('generate-review-reply', {
//   body: { review_text, review_rating, author_name, establishment_name, ... }
// })

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReviewReplyRequest {
  review_text: string | null
  review_rating: number | null
  author_name: string | null
  establishment_name: string
  // Parametrage voix de marque (CDC 7.8)
  ai_tone: string
  ai_instructions: string | null
  ai_preferred_expressions: string | null
  ai_avoid_expressions: string | null
  ai_response_length: string // 'short' | 'medium' | 'long'
  ai_positive_style: string | null
  ai_negative_style: string | null
  ai_rules: string | null
}

function buildPrompt(req: ReviewReplyRequest): string {
  const isPositive = req.review_rating && req.review_rating >= 4
  const lengthMap: Record<string, string> = {
    short: '2 a 3 phrases maximum',
    medium: '4 a 6 phrases',
    long: '7 phrases ou plus, detaillee',
  }

  let prompt = `Tu es le gerant de "${req.establishment_name}". Tu dois rediger une reponse a un avis client sur Google.\n\n`
  prompt += `TON GENERAL : ${req.ai_tone}\n`
  prompt += `LONGUEUR SOUHAITEE : ${lengthMap[req.ai_response_length] || lengthMap.medium}\n`

  if (isPositive && req.ai_positive_style) {
    prompt += `STYLE POUR AVIS POSITIFS : ${req.ai_positive_style}\n`
  }
  if (!isPositive && req.ai_negative_style) {
    prompt += `STYLE POUR AVIS NEGATIFS : ${req.ai_negative_style}\n`
  }
  if (req.ai_preferred_expressions) {
    prompt += `EXPRESSIONS A PRIVILEGIER : ${req.ai_preferred_expressions}\n`
  }
  if (req.ai_avoid_expressions) {
    prompt += `FORMULATIONS A EVITER : ${req.ai_avoid_expressions}\n`
  }
  if (req.ai_rules) {
    prompt += `REGLES A TOUJOURS RESPECTER : ${req.ai_rules}\n`
  }
  if (req.ai_instructions) {
    prompt += `INSTRUCTIONS SUPPLEMENTAIRES : ${req.ai_instructions}\n`
  }

  prompt += `\n--- AVIS DU CLIENT ---\n`
  prompt += `Auteur : ${req.author_name || 'Anonyme'}\n`
  prompt += `Note : ${req.review_rating || 'non precisee'}/5\n`
  prompt += `Texte : ${req.review_text || '(aucun commentaire)'}\n`
  prompt += `\n--- CONSIGNE ---\n`
  prompt += `Redige une reponse naturelle, personnelle, qui sonne comme si elle venait du gerant lui-meme. Pas de formule generique. Ne commence pas par "Cher client".`

  return prompt
}

serve(async (req) => {
  // Gestion CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: ReviewReplyRequest = await req.json()
    const prompt = buildPrompt(body)

    // ===== INTEGRATION IA =====
    // Option A : OpenAI
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      // Fallback : reponse placeholder si pas de cle API
      const isPositive = body.review_rating && body.review_rating >= 4
      const fallback = isPositive
        ? `Merci beaucoup ${body.author_name || ''} pour votre retour ! Nous sommes ravis que votre experience chez ${body.establishment_name} vous ait plu. Au plaisir de vous revoir !`
        : `Merci ${body.author_name || ''} pour votre retour. Nous prenons note de vos remarques et ferons tout pour ameliorer votre prochaine experience. N'hesitez pas a nous contacter directement.`

      return new Response(
        JSON.stringify({ reply: fallback, source: 'fallback' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Tu es un assistant qui aide les commercants a repondre a leurs avis Google de maniere authentique et personnalisee.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
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
      JSON.stringify({ error: 'Erreur lors de la generation', details: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
