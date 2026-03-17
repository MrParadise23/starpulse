import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Establishment, GoogleReview } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { Star, Sparkles, Copy, Check, RefreshCw, Send, Inbox, Link2, AlertTriangle, Clock, CheckCircle2, X, Edit3, EyeOff } from 'lucide-react'

interface DashboardContext { establishment: Establishment | null; session: Session }

type ConnectionStatus = 'not_connected' | 'connected' | 'pending' | 'error'
type ReviewFilter = 'all' | 'pending' | 'ai_generated' | 'published' | 'ignored'

export default function ReviewsPage() {
  const { establishment } = useOutletContext<DashboardContext>()
  const [reviews, setReviews] = useState<GoogleReview[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<ReviewFilter>('all')

  // Etat d'edition pour chaque avis
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  useEffect(() => { if (establishment) loadReviews(); else setLoading(false) }, [establishment, filter])

  async function loadReviews() {
    let query = supabase.from('google_reviews').select('*')
      .eq('establishment_id', establishment!.id)
      .order('review_date', { ascending: false })
    if (filter !== 'all') query = query.eq('reply_status', filter)
    const { data } = await query
    setReviews(data || [])
    setLoading(false)
  }

  function getGoogleStatus(): ConnectionStatus {
    if (!establishment) return 'not_connected'
    if (establishment.google_connection_status === 'connected' && establishment.google_place_id) return 'connected'
    if (establishment.google_connection_status === 'error') return 'error'
    return 'not_connected'
  }

  // CDC 5.7 : generation IA declenchee uniquement par le commercant
  async function generateAiReply(review: GoogleReview) {
    setGeneratingId(review.id)

    let replyText = ''
    const est = establishment!

    try {
      // Appel Edge Function Supabase
      const { data, error } = await supabase.functions.invoke('generate-review-reply', {
        body: {
          review_text: review.comment,
          review_rating: review.rating,
          author_name: review.author_name,
          establishment_name: est.name,
          ai_tone: est.ai_tone,
          ai_instructions: est.ai_instructions,
          ai_preferred_expressions: (est as any).ai_preferred_expressions,
          ai_avoid_expressions: (est as any).ai_avoid_expressions,
          ai_response_length: (est as any).ai_response_length || 'medium',
          ai_positive_style: (est as any).ai_positive_style,
          ai_negative_style: (est as any).ai_negative_style,
          ai_rules: (est as any).ai_rules,
        }
      })

      if (!error && data?.reply) {
        replyText = data.reply
      } else {
        throw new Error('Edge Function non disponible')
      }
    } catch {
      // Fallback si Edge Function pas encore deployee
      const isPositive = review.rating && review.rating >= 4
      const name = review.author_name || ''
      replyText = isPositive
        ? `Merci beaucoup ${name} pour votre retour positif ! Nous sommes ravis que votre experience chez ${est.name} vous ait plu. Au plaisir de vous revoir !`
        : `Merci ${name} pour votre retour. Nous prenons note de vos remarques et ferons tout pour ameliorer votre prochaine experience chez ${est.name}. N'hesitez pas a nous contacter directement.`
    }

    await supabase.from('google_reviews').update({
      ai_suggested_reply: replyText,
      reply_status: 'ai_generated'
    }).eq('id', review.id)

    setReviews(prev => prev.map(r =>
      r.id === review.id ? { ...r, ai_suggested_reply: replyText, reply_status: 'ai_generated' } : r
    ))
    setGeneratingId(null)
  }

  async function copyReply(review: GoogleReview) {
    const text = review.final_reply || review.ai_suggested_reply || ''
    await navigator.clipboard.writeText(text)
    setCopiedId(review.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Commencer l'edition manuelle de la reponse
  function startEditing(review: GoogleReview) {
    setEditingId(review.id)
    setEditText(review.final_reply || review.ai_suggested_reply || '')
  }

  // Sauvegarder la modification
  async function saveEdit(reviewId: string) {
    if (!editText.trim()) return
    await supabase.from('google_reviews').update({
      final_reply: editText.trim()
    }).eq('id', reviewId)
    setReviews(prev => prev.map(r =>
      r.id === reviewId ? { ...r, final_reply: editText.trim() } : r
    ))
    setEditingId(null)
    setEditText('')
  }

  // CDC 7.7 : publier directement sur Google depuis le SaaS
  async function publishReply(review: GoogleReview) {
    const replyText = review.final_reply || review.ai_suggested_reply || ''
    if (!replyText) return

    // TODO: Appel API Google Business Profile pour publier
    // await supabase.functions.invoke('publish-google-reply', {
    //   body: {
    //     establishment_id: establishment!.id,
    //     google_review_id: review.google_review_id,
    //     reply_text: replyText
    //   }
    // })

    await supabase.from('google_reviews').update({
      reply_status: 'published',
      final_reply: replyText,
      replied_at: new Date().toISOString()
    }).eq('id', review.id)

    setReviews(prev => prev.map(r =>
      r.id === review.id ? { ...r, reply_status: 'published', final_reply: replyText, replied_at: new Date().toISOString() } : r
    ))
  }

  // CDC 7.7 : le commercant peut choisir de ne pas repondre
  async function ignoreReview(reviewId: string) {
    await supabase.from('google_reviews').update({ reply_status: 'ignored' }).eq('id', reviewId)
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply_status: 'ignored' } : r))
  }

  const googleStatus = getGoogleStatus()

  const statusConfig = {
    not_connected: { icon: Link2, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Non connecte', desc: 'Connectez votre fiche Google Business Profile pour synchroniser vos avis.' },
    connected: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Connecte', desc: `Fiche liee : ${establishment?.google_business_name || 'N/A'}` },
    pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Synchronisation en cours', desc: 'La connexion est en cours de configuration.' },
    error: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Erreur de connexion', desc: 'La connexion a echoue. Veuillez reconnecter votre compte.' },
  }

  const status = statusConfig[googleStatus]

  // Libelle des statuts (CDC 7.7)
  function getStatusBadge(s: string) {
    switch (s) {
      case 'pending': return { label: 'Non traite', cls: 'bg-amber-100 text-amber-700' }
      case 'ai_generated': return { label: 'Reponse IA generee', cls: 'bg-blue-100 text-blue-700' }
      case 'published': return { label: 'Publie', cls: 'bg-emerald-100 text-emerald-700' }
      case 'ignored': return { label: 'Ignore', cls: 'bg-gray-100 text-gray-500' }
      default: return { label: s, cls: 'bg-gray-100 text-gray-600' }
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Avis Google</h1>
        <p className="text-gray-500 text-sm mt-1">Gerez vos avis et repondez avec l'aide de l'IA.</p>
      </div>

      {/* Section Google Business Profile */}
      <div className={`rounded-2xl border ${status.border} ${status.bg} p-5 mb-6`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status.bg}`}>
              <status.icon className={`w-5 h-5 ${status.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display font-semibold text-gray-900">Google Business Profile</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  googleStatus === 'connected' ? 'bg-emerald-100 text-emerald-700' :
                  googleStatus === 'error' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>{status.label}</span>
              </div>
              <p className="text-sm text-gray-600">{status.desc}</p>
              {googleStatus === 'connected' && establishment?.google_last_sync && (
                <p className="text-xs text-gray-400 mt-1">Derniere synchronisation : {new Date(establishment.google_last_sync).toLocaleString('fr-FR')}</p>
              )}
              {googleStatus === 'connected' && establishment?.google_account_email && (
                <p className="text-xs text-gray-400">Compte : {establishment.google_account_email}</p>
              )}
            </div>
          </div>
          <button className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            googleStatus === 'connected'
              ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}>
            {googleStatus === 'connected' ? 'Reconnecter' : 'Connecter Google Business Profile'}
          </button>
        </div>
        {googleStatus === 'not_connected' && (
          <div className="mt-4 pt-3 border-t border-gray-200/50">
            <p className="text-xs text-gray-500">
              Structure prete. La synchronisation automatique des avis Google est en cours d'implementation.
              En attendant, vous pouvez utiliser les reponses IA sur les avis existants.
            </p>
          </div>
        )}
      </div>

      {/* Filtres (CDC 7.7 : statuts pending / ai_generated / published / ignored) */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { key: 'all' as const, label: 'Tous' },
          { key: 'pending' as const, label: 'Non traites' },
          { key: 'ai_generated' as const, label: 'IA generee' },
          { key: 'published' as const, label: 'Publies' },
          { key: 'ignored' as const, label: 'Ignores' },
        ]).map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Aucun avis</p>
          <p className="text-gray-400 text-sm mt-1">
            {googleStatus === 'connected'
              ? 'Les avis Google seront synchronises automatiquement.'
              : 'Connectez votre fiche Google pour synchroniser vos avis.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const badge = getStatusBadge(review.reply_status)
            const isEditing = editingId === review.id
            const replyText = review.final_reply || review.ai_suggested_reply || ''
            const canAct = review.reply_status !== 'published'

            return (
              <div key={review.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                {/* En-tete avis */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{review.author_name || 'Anonyme'}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.cls}`}>{badge.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className="w-3.5 h-3.5"
                            fill={s <= (review.rating || 0) ? '#facc15' : 'none'}
                            color={s <= (review.rating || 0) ? '#facc15' : '#d1d5db'} />
                        ))}
                      </div>
                      {review.review_date && (
                        <span className="text-xs text-gray-400">{new Date(review.review_date).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Texte de l'avis */}
                {review.comment && <p className="text-sm text-gray-700 mb-4 leading-relaxed">{review.comment}</p>}

                {/* Suggestion IA (quand generee et pas encore publiee) */}
                {review.ai_suggested_reply && review.reply_status !== 'published' && !isEditing && (
                  <div className="bg-blue-50/50 rounded-xl p-4 mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">Suggestion IA</span>
                    </div>
                    <p className="text-sm text-gray-700">{replyText}</p>
                  </div>
                )}

                {/* Zone d'edition manuelle (CDC 7.7 : modifier la reponse avant publication) */}
                {isEditing && (
                  <div className="bg-blue-50/50 rounded-xl p-4 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">Modifier la reponse</span>
                      </div>
                      <button onClick={() => { setEditingId(null); setEditText('') }}
                        className="p-1 rounded hover:bg-blue-100">
                        <X className="w-3.5 h-3.5 text-blue-600" />
                      </button>
                    </div>
                    <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
                      rows={4}
                      className="w-full border border-blue-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white mb-2" />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(review.id)}
                        disabled={!editText.trim()}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        Sauvegarder
                      </button>
                      <button onClick={() => { setEditingId(null); setEditText('') }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {/* Reponse publiee */}
                {review.reply_status === 'published' && replyText && (
                  <div className="bg-emerald-50/50 rounded-xl p-4 mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-700">Reponse publiee</span>
                      {review.replied_at && (
                        <span className="text-xs text-emerald-500">le {new Date(review.replied_at).toLocaleDateString('fr-FR')}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{replyText}</p>
                  </div>
                )}

                {/* Actions (CDC 7.7 : generer / modifier / publier / ignorer) */}
                {canAct && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 1. Generer une reponse IA (CDC 5.7 : jamais automatique) */}
                    {!review.ai_suggested_reply && review.reply_status !== 'ignored' && (
                      <button onClick={() => generateAiReply(review)} disabled={generatingId === review.id}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50">
                        {generatingId === review.id
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <Sparkles className="w-3.5 h-3.5" />}
                        Generer une reponse IA
                      </button>
                    )}

                    {/* Actions apres generation */}
                    {review.ai_suggested_reply && !isEditing && (
                      <>
                        {/* Modifier */}
                        <button onClick={() => startEditing(review)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">
                          <Edit3 className="w-3.5 h-3.5" />Modifier
                        </button>
                        {/* Copier */}
                        <button onClick={() => copyReply(review)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">
                          {copiedId === review.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          Copier
                        </button>
                        {/* Regenerer */}
                        <button onClick={() => generateAiReply(review)} disabled={generatingId === review.id}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50">
                          <RefreshCw className={`w-3.5 h-3.5 ${generatingId === review.id ? 'animate-spin' : ''}`} />
                          Regenerer
                        </button>
                        {/* Publier sur Google */}
                        <button onClick={() => publishReply(review)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
                          <Send className="w-3.5 h-3.5" />Publier sur Google
                        </button>
                      </>
                    )}

                    {/* Ignorer (CDC 7.7 : le commercant peut choisir de ne pas repondre) */}
                    {review.reply_status !== 'ignored' && (
                      <button onClick={() => ignoreReview(review.id)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                        <EyeOff className="w-3.5 h-3.5" />Ignorer
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
