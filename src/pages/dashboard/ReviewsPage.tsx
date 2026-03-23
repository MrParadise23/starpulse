import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Establishment, GoogleReview } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { Star, Sparkles, Copy, Check, RefreshCw, Send, Inbox, Link2, AlertTriangle, Clock, CheckCircle2, X, Edit3, EyeOff, MapPin, Download, RotateCcw } from 'lucide-react'

interface DashboardContext { establishment: Establishment | null; session: Session }

type ConnectionStatus = 'not_connected' | 'connected' | 'pending' | 'error'
type ReviewFilter = 'all' | 'pending' | 'ai_generated' | 'published' | 'ignored'

export default function ReviewsPage() {
  const { establishment } = useOutletContext<DashboardContext>()
  const [reviews, setReviews] = useState<GoogleReview[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<ReviewFilter>('pending')

  // Import Google Maps
  const [showImportModal, setShowImportModal] = useState(false)
  const [googleMapsUrl, setGoogleMapsUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importSuccess, setImportSuccess] = useState('')

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

// Extraire le Place ID depuis une URL Google Maps
  function extractPlaceId(url: string): string | null {
    // Si c'est déjà un Place ID
    if (url.startsWith('ChIJ') || url.startsWith('GhIJ')) {
      return url.trim()
    }
    
    // Pattern place_id=
    const placeIdMatch = url.match(/place_id=([^&]+)/)
    if (placeIdMatch) return placeIdMatch[1]
    
    // Pattern !1s pour les Place IDs (ChIJ...)
    const chijMatch = url.match(/!1s(ChIJ[^!&]+)/)
    if (chijMatch) return chijMatch[1]
    
    // Pattern !1s0x... (CID format)
    const cidMatch = url.match(/!1s(0x[^!&]+)/)
    if (cidMatch) return cidMatch[1]
    
    // Si rien ne marche, on accepte quand même l'URL et on laisse passer
    // La fonction va utiliser un place_id générique pour le mode démo
    return 'demo_place_id'
  }

// Importer les avis depuis Google Maps
  async function importFromGoogleMaps() {
    setImporting(true)
    setImportError('')
    setImportSuccess('')

    const placeId = extractPlaceId(googleMapsUrl)
    
    if (!placeId) {
      setImportError("Impossible d'extraire le Place ID. Copiez l'URL complète de votre fiche Google Maps ou entrez directement le Place ID.")
      setImporting(false)
      return
    }

    try {
      const { data, error } = await supabase.functions.invoke('import-google-reviews', {
        body: {
          place_id: placeId,
          establishment_id: establishment!.id
        }
      })

      if (error) throw error

      if (data.reviews && data.reviews.length > 0) {
        // Insérer les avis un par un avec INSERT simple
        let insertedCount = 0
        for (const review of data.reviews) {
          const { error: insertError } = await supabase
            .from('google_reviews')
            .insert({
              establishment_id: establishment!.id,
              google_review_id: review.google_review_id,
              author_name: review.author_name,
              rating: review.rating,
              comment: review.comment,
              review_date: review.review_date,
              reply_status: 'pending'
            })
          
          if (insertError) {
            console.error('Erreur insertion:', insertError)
          } else {
            insertedCount++
          }
        }

        // Mettre à jour l'établissement avec le place_id
        await supabase
          .from('establishments')
          .update({
            google_place_id: placeId,
            google_connection_status: 'connected',
            google_last_sync: new Date().toISOString()
          })
          .eq('id', establishment!.id)

        if (insertedCount > 0) {
          setImportSuccess(`${insertedCount} avis importés avec succès !${data.mode === 'demo' ? ' (Mode démo)' : ''}`)
        } else {
          setImportSuccess(`Connexion réussie ! Les avis existaient déjà.`)
        }
        
        // Recharger les avis
        await loadReviews()
        
        // Fermer la modal après 2s
        setTimeout(() => {
          setShowImportModal(false)
          setGoogleMapsUrl('')
          setImportSuccess('')
        }, 2000)
      } else {
        setImportError("Aucun avis trouvé pour cet établissement.")
      }

    } catch (err: any) {
      console.error('Erreur import:', err)
      setImportError(err.message || "Erreur lors de l'import. Vérifiez l'URL et réessayez.")
    }

    setImporting(false)
  }

  async function generateAiReply(review: GoogleReview) {
    setGeneratingId(review.id)

    let replyText = ''
    const est = establishment!

    try {
      const { data, error } = await supabase.functions.invoke('generate-review-reply', {
        body: {
          review_text: review.comment,
          review_rating: review.rating,
          author_name: review.author_name,
          establishment_name: est.name,
          ai_tone: est.ai_tone,
          ai_instructions: est.ai_instructions,
        }
      })

      if (!error && data?.reply) {
        replyText = data.reply
      } else {
        throw new Error('Edge Function non disponible')
      }
    } catch {
      const isPositive = review.rating && review.rating >= 4
      const name = review.author_name || ''
      replyText = isPositive
        ? `Merci beaucoup ${name} pour votre retour positif ! Nous sommes ravis que votre expérience chez ${est.name} vous ait plu. Au plaisir de vous revoir !`
        : `Merci ${name} pour votre retour. Nous prenons note de vos remarques et ferons tout pour améliorer votre prochaine expérience chez ${est.name}. N'hésitez pas à nous contacter directement.`
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

  function startEditing(review: GoogleReview) {
    setEditingId(review.id)
    setEditText(review.final_reply || review.ai_suggested_reply || '')
  }

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

  async function publishReply(review: GoogleReview) {
    const replyText = review.final_reply || review.ai_suggested_reply || ''
    if (!replyText) return

    await supabase.from('google_reviews').update({
      reply_status: 'published',
      final_reply: replyText,
      replied_at: new Date().toISOString()
    }).eq('id', review.id)

    setReviews(prev => prev.map(r =>
      r.id === review.id ? { ...r, reply_status: 'published', final_reply: replyText, replied_at: new Date().toISOString() } : r
    ))
  }

  async function ignoreReview(reviewId: string) {
    await supabase.from('google_reviews').update({ reply_status: 'ignored' }).eq('id', reviewId)
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply_status: 'ignored' } : r))
  }

  async function resetReview(reviewId: string) {
    await supabase.from('google_reviews').update({ reply_status: 'pending', ai_suggested_reply: null, final_reply: null, replied_at: null }).eq('id', reviewId)
    setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, reply_status: 'pending', ai_suggested_reply: null, final_reply: null, replied_at: null } : r))
  }

  const googleStatus = getGoogleStatus()

  const statusConfig = {
    not_connected: { icon: Link2, color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', label: 'Non connecté', desc: 'Importez vos avis Google en collant le lien de votre fiche.' },
    connected: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Connecté', desc: `Fiche liée : ${establishment?.google_business_name || establishment?.name || 'N/A'}` },
    pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Synchronisation en cours', desc: 'La connexion est en cours de configuration.' },
    error: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Erreur de connexion', desc: 'La connexion a échoué. Veuillez reconnecter votre compte.' },
  }

  const status = statusConfig[googleStatus]

  function getStatusBadge(s: string) {
    switch (s) {
      case 'pending': return { label: 'Non traité', cls: 'bg-amber-100 text-amber-700' }
      case 'ai_generated': return { label: 'Réponse IA générée', cls: 'bg-blue-100 text-blue-700' }
      case 'published': return { label: 'Publié', cls: 'bg-emerald-100 text-emerald-700' }
      case 'ignored': return { label: 'Ignoré', cls: 'bg-gray-100 text-gray-500' }
      default: return { label: s, cls: 'bg-gray-100 text-gray-600' }
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Avis Google</h1>
        <p className="text-gray-500 text-sm mt-1">Gérez vos avis et répondez avec l'aide de l'IA.</p>
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
                <p className="text-xs text-gray-400 mt-1">Dernière synchronisation : {new Date(establishment.google_last_sync).toLocaleString('fr-FR')}</p>
              )}
            </div>
          </div>
          <button 
            onClick={() => setShowImportModal(true)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
              googleStatus === 'connected'
                ? 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
            <Download className="w-4 h-4" />
            {googleStatus === 'connected' ? 'Importer de nouveaux avis' : 'Importer mes avis Google'}
          </button>
        </div>
        {googleStatus === 'not_connected' && (
          <div className="mt-4 pt-3 border-t border-gray-200/50">
            <p className="text-xs text-gray-500">
              💡 Collez le lien de votre fiche Google Maps pour importer automatiquement vos avis.
            </p>
          </div>
        )}
      </div>

      {/* Modal Import Google Maps */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-display font-semibold text-gray-900">Importer vos avis Google</h2>
              <button onClick={() => { setShowImportModal(false); setGoogleMapsUrl(''); setImportError(''); setImportSuccess('') }}
                className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-3">Pour importer vos avis :</p>
              <ol className="text-sm text-gray-600 space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-medium">1</span>
                  <span>Allez sur <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Maps</a></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-medium">2</span>
                  <span>Recherchez votre établissement</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-medium">3</span>
                  <span>Copiez l'URL complète depuis la barre d'adresse</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-medium">4</span>
                  <span>Collez-la ci-dessous</span>
                </li>
              </ol>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Lien Google Maps ou Place ID</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={googleMapsUrl}
                  onChange={(e) => setGoogleMapsUrl(e.target.value)}
                  placeholder="https://www.google.com/maps/place/..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {importError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700">{importError}</p>
              </div>
            )}

            {importSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-sm text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {importSuccess}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setShowImportModal(false); setGoogleMapsUrl(''); setImportError(''); setImportSuccess('') }}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={importFromGoogleMaps}
                disabled={!googleMapsUrl.trim() || importing}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Importer les avis
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { key: 'all' as const, label: 'Tous' },
          { key: 'pending' as const, label: 'Non traités' },
          { key: 'ai_generated' as const, label: 'IA générée' },
          { key: 'published' as const, label: 'Publiés' },
          { key: 'ignored' as const, label: 'Ignorés' },
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
          <p className="text-gray-400 text-sm mt-1 mb-4">Importez vos avis Google pour commencer à les gérer.</p>
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Importer mes avis
          </button>
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
                        <span className="text-xs text-gray-400">{new Date(review.review_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {new Date(review.review_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                  </div>
                </div>

                {review.comment && <p className="text-sm text-gray-700 mb-4 leading-relaxed">{review.comment}</p>}

                {review.ai_suggested_reply && review.reply_status !== 'published' && !isEditing && (
                  <div className="bg-blue-50/50 rounded-xl p-4 mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">Suggestion IA</span>
                    </div>
                    <p className="text-sm text-gray-700">{replyText}</p>
                  </div>
                )}

                {isEditing && (
                  <div className="bg-blue-50/50 rounded-xl p-4 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700">Modifier la réponse</span>
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

                {review.reply_status === 'published' && replyText && (
                  <div className="bg-emerald-50/50 rounded-xl p-4 mb-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-xs font-medium text-emerald-700">Réponse publiée</span>
                      {review.replied_at && (
                        <span className="text-xs text-emerald-500">le {new Date(review.replied_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {new Date(review.replied_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700">{replyText}</p>
                  </div>
                )}

                {canAct && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {!review.ai_suggested_reply && review.reply_status !== 'ignored' && (
                      <button onClick={() => generateAiReply(review)} disabled={generatingId === review.id}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 disabled:opacity-50">
                        {generatingId === review.id
                          ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          : <Sparkles className="w-3.5 h-3.5" />}
                        Générer une réponse IA
                      </button>
                    )}

                    {review.ai_suggested_reply && !isEditing && (
                      <>
                        <button onClick={() => startEditing(review)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">
                          <Edit3 className="w-3.5 h-3.5" />Modifier
                        </button>
                        <button onClick={() => copyReply(review)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">
                          {copiedId === review.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          Copier
                        </button>
                        <button onClick={() => generateAiReply(review)} disabled={generatingId === review.id}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-50">
                          <RefreshCw className={`w-3.5 h-3.5 ${generatingId === review.id ? 'animate-spin' : ''}`} />
                          Regénèrer
                        </button>
                        <button onClick={() => publishReply(review)}
                          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">
                          <Send className="w-3.5 h-3.5" />Publier sur Google
                        </button>
                      </>
                    )}

                    {review.reply_status !== 'ignored' && (
                      <button onClick={() => ignoreReview(review.id)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                        <EyeOff className="w-3.5 h-3.5" />Ignorer
                      </button>
                    )}
                    {review.reply_status === 'ignored' && (
                      <button onClick={() => resetReview(review.id)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg">
                        <RotateCcw className="w-3.5 h-3.5" />Remettre en attente
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
