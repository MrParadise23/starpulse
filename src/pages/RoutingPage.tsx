import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Establishment, Plate } from '../lib/supabase'
import { Star, Send, CheckCircle, AlertCircle, User, Mail, Phone } from 'lucide-react'

type Step = 'loading' | 'rating' | 'feedback' | 'thanks' | 'error' | 'inactive'

export default function RoutingPage() {
  const { code } = useParams<{ code: string }>()
  const [step, setStep] = useState<Step>('loading')
  const [plate, setPlate] = useState<Plate | null>(null)
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [selectedRating, setSelectedRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)

  // Formulaire retour negatif unifie (CDC section 6.5)
  const [feedbackText, setFeedbackText] = useState('')
  const [contactFirstName, setContactFirstName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [validationError, setValidationError] = useState('')

  useEffect(() => { loadPlate() }, [code])

  async function loadPlate() {
    if (!code) { setStep('error'); return }
    const { data: plateData } = await supabase.from('plates').select('*').eq('code', code).single()
    if (!plateData) { setStep('error'); return }
    setPlate(plateData)
    if (!plateData.establishment_id) { window.location.href = `/activate/${code}`; return }
    const { data: estData } = await supabase.from('establishments').select('*').eq('id', plateData.establishment_id).single()
    if (!estData || !estData.is_active) { setStep('inactive'); return }
    setEstablishment(estData)
    setStep('rating')
  }

  async function handleRating(rating: number) {
    if (!plate || !establishment) return
    setSelectedRating(rating)
    const isPositive = rating >= establishment.satisfaction_threshold

    // Enregistrer le scan
    await supabase.from('scans').insert({
      plate_id: plate.id,
      establishment_id: establishment.id,
      rating_given: rating,
      result: isPositive ? 'redirect' : 'feedback',
      plate_type: plate.plate_type
    })

    if (isPositive) {
      // CDC 5.1 / 6.3 / 13.1 : REDIRECTION INSTANTANEE
      // Aucun message, aucun ecran de transition, aucun bouton "continuer"
      if (establishment.redirect_url) {
        window.location.href = establishment.redirect_url
      }
    } else {
      setStep('feedback')
    }
  }

  function validateFeedback(): boolean {
    // CDC 6.5 : prenom obligatoire + email OU telephone obligatoire
    if (!contactFirstName.trim()) {
      setValidationError('Veuillez renseigner votre prenom.')
      return false
    }
    if (!contactEmail.trim() && !contactPhone.trim()) {
      setValidationError('Veuillez renseigner au moins un moyen de contact (email ou telephone).')
      return false
    }
    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      setValidationError('Veuillez entrer une adresse email valide.')
      return false
    }
    setValidationError('')
    return true
  }

  async function handleFeedbackSubmit() {
    if (!plate || !establishment) return
    if (!validateFeedback()) return

    setSubmitting(true)
    await supabase.from('feedbacks').insert({
      establishment_id: establishment.id,
      plate_id: plate.id,
      rating: selectedRating,
      comment: feedbackText.trim() || null,
      client_first_name: contactFirstName.trim(),
      client_email: contactEmail.trim() || null,
      client_phone: contactPhone.trim() || null,
      source_plate_code: plate.code
    })
    setSubmitting(false)
    setStep('thanks')
  }

  const primaryColor = establishment?.primary_color || '#2563eb'
  const bgGradient = `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)`

  if (step === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-3 rounded-full animate-spin" style={{ borderColor: primaryColor, borderTopColor: 'transparent' }} />
    </div>
  )
  if (step === 'error') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Ce lien n'est pas valide.</p>
      </div>
    </div>
  )
  if (step === 'inactive') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Ce service n'est plus actif.</p>
      </div>
    </div>
  )
  // CDC 6.6 : ecran final simple apres retour negatif (friction OK ici)
  if (step === 'thanks') return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: bgGradient }}>
      <div className="text-center animate-fade-up">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: primaryColor }}>
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-display font-bold text-gray-900 mb-2">Merci pour votre retour.</h2>
        <p className="text-gray-500 text-sm">Votre avis nous aidera a nous ameliorer.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: bgGradient }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 animate-fade-up">
          {establishment?.logo_url && (
            <img src={establishment.logo_url} alt={establishment.name}
              className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3 shadow-md" />
          )}
          <h1 className="text-xl font-display font-bold text-gray-900">{establishment?.name}</h1>
        </div>

        {/* NOTATION (CDC 6.2) */}
        {step === 'rating' && (
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-6 animate-fade-up-delay">
            <p className="text-center text-gray-700 font-medium mb-6">{establishment?.routing_question}</p>
            <div className="star-rating flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star}
                  onClick={() => handleRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1">
                  <Star className="w-10 h-10 transition-colors" strokeWidth={1.5}
                    fill={(hoveredRating || selectedRating) >= star ? '#facc15' : 'none'}
                    color={(hoveredRating || selectedRating) >= star ? '#facc15' : '#d1d5db'} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RETOUR PRIVE NEGATIF - FORMULAIRE UNIFIE (CDC 6.4 / 6.5) */}
        {step === 'feedback' && (
          <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-6 animate-fade-up">
            <p className="text-sm text-gray-500 mb-4">
              Votre retour ne sera pas publie. Il est transmis directement a l'etablissement.
            </p>

            <div className="space-y-4">
              {/* Note donnee */}
              <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">Votre note :</span>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className="w-4 h-4"
                      fill={s <= selectedRating ? '#facc15' : 'none'}
                      color={s <= selectedRating ? '#facc15' : '#d1d5db'} />
                  ))}
                </div>
              </div>

              {/* Commentaire */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Votre retour <span className="text-gray-400 font-normal">(recommande)</span>
                </label>
                <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Qu'est-ce qui pourrait etre ameliore ?" rows={3} autoFocus
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* Prenom OBLIGATOIRE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Prenom <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" value={contactFirstName}
                    onChange={(e) => { setContactFirstName(e.target.value); setValidationError('') }}
                    placeholder="Votre prenom"
                    className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="email" value={contactEmail}
                    onChange={(e) => { setContactEmail(e.target.value); setValidationError('') }}
                    placeholder="votre@email.com"
                    className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Telephone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Telephone <span className="text-gray-400 font-normal">(ou email ci-dessus)</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="tel" value={contactPhone}
                    onChange={(e) => { setContactPhone(e.target.value); setValidationError('') }}
                    placeholder="06 12 34 56 78"
                    className="w-full border border-gray-200 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <p className="text-xs text-gray-400">
                <span className="text-red-400">*</span> Prenom et au moins un moyen de contact obligatoires.
              </p>

              {validationError && (
                <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl">{validationError}</div>
              )}

              <button onClick={handleFeedbackSubmit}
                disabled={submitting || !contactFirstName.trim() || (!contactEmail.trim() && !contactPhone.trim())}
                className="w-full py-3 rounded-xl text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: primaryColor }}>
                {submitting
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Send className="w-4 h-4" />Envoyer mon retour</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
