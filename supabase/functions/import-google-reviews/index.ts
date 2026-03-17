import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { place_id, establishment_id } = await req.json()

    if (!place_id) {
      return new Response(
        JSON.stringify({ error: 'place_id requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mode démo : retourner des avis simulés pour tester l'interface
    const demoReviews = [
      {
        id: crypto.randomUUID(),
        establishment_id,
        google_review_id: `demo_${Date.now()}_1`,
        author_name: "Marie Dupont",
        rating: 5,
        comment: "Excellent service ! L'équipe est très professionnelle et à l'écoute. Je recommande vivement.",
        review_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        reply_status: 'pending'
      },
      {
        id: crypto.randomUUID(),
        establishment_id,
        google_review_id: `demo_${Date.now()}_2`,
        author_name: "Pierre Martin",
        rating: 4,
        comment: "Très bonne expérience dans l'ensemble. Quelques petits détails à améliorer mais rien de grave.",
        review_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        reply_status: 'pending'
      },
      {
        id: crypto.randomUUID(),
        establishment_id,
        google_review_id: `demo_${Date.now()}_3`,
        author_name: "Sophie Bernard",
        rating: 3,
        comment: "Service correct mais l'attente était un peu longue. Le personnel reste agréable.",
        review_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        reply_status: 'pending'
      },
      {
        id: crypto.randomUUID(),
        establishment_id,
        google_review_id: `demo_${Date.now()}_4`,
        author_name: "Jean Leclerc",
        rating: 5,
        comment: "Parfait ! Exactement ce que je cherchais. Merci pour votre professionnalisme.",
        review_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        reply_status: 'pending'
      },
      {
        id: crypto.randomUUID(),
        establishment_id,
        google_review_id: `demo_${Date.now()}_5`,
        author_name: "Claire Moreau",
        rating: 2,
        comment: "Déçue par cette expérience. Le produit ne correspondait pas à la description et le SAV n'a pas été réactif.",
        review_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        reply_status: 'pending'
      }
    ]

    return new Response(
      JSON.stringify({ 
        reviews: demoReviews,
        mode: 'demo',
        message: 'Mode démo activé. Configurez GOOGLE_PLACES_API_KEY pour les vrais avis.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})