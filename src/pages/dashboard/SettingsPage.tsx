import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Establishment } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { Save, Check, Plus, Star, ArrowRight, Link2, CheckCircle2, AlertTriangle } from 'lucide-react'

interface DashboardContext { establishment: Establishment | null; session: Session; refreshEstablishments: () => Promise<void> }

// Categories completes selon CDC section 4
const CATEGORIES = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'glacier', label: 'Glacier' },
  { value: 'cafe', label: 'Cafe / Bar' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'boulangerie', label: 'Boulangerie / Patisserie' },
  { value: 'coiffeur', label: 'Salon de coiffure' },
  { value: 'cabinet', label: 'Cabinet' },
  { value: 'concession', label: 'Concession' },
  { value: 'boutique', label: 'Boutique / Magasin' },
  { value: 'commerce', label: 'Commerce de proximite' },
  { value: 'autre', label: 'Autre' },
]

export default function SettingsPage() {
  const { establishment, session, refreshEstablishments } = useOutletContext<DashboardContext>()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const isNew = !establishment

  // Informations generales
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('restaurant')
  const [redirectUrl, setRedirectUrl] = useState('')
  const [routingQuestion, setRoutingQuestion] = useState("Comment s'est passee votre experience ?")
  const [satisfactionThreshold, setSatisfactionThreshold] = useState(4)
  const [primaryColor, setPrimaryColor] = useState('#2563eb')

  // Parametrage IA enrichi (CDC section 7.8)
  const [aiTone, setAiTone] = useState('chaleureux et professionnel')
  const [aiInstructions, setAiInstructions] = useState('')
  const [aiPreferredExpressions, setAiPreferredExpressions] = useState('')
  const [aiAvoidExpressions, setAiAvoidExpressions] = useState('')
  const [aiResponseLength, setAiResponseLength] = useState('medium')
  const [aiPositiveStyle, setAiPositiveStyle] = useState('')
  const [aiNegativeStyle, setAiNegativeStyle] = useState('')
  const [aiRules, setAiRules] = useState('')

  useEffect(() => {
    if (establishment) {
      setName(establishment.name)
      setAddress(establishment.address || '')
      setCity(establishment.city || '')
      setCategory(establishment.category)
      setRedirectUrl(establishment.redirect_url || '')
      setRoutingQuestion(establishment.routing_question)
      setSatisfactionThreshold(establishment.satisfaction_threshold)
      setPrimaryColor(establishment.primary_color)
      setAiTone(establishment.ai_tone)
      setAiInstructions(establishment.ai_instructions || '')
      // Champs enrichis (peuvent etre null si pas encore migrés)
      setAiPreferredExpressions((establishment as any).ai_preferred_expressions || '')
      setAiAvoidExpressions((establishment as any).ai_avoid_expressions || '')
      setAiResponseLength((establishment as any).ai_response_length || 'medium')
      setAiPositiveStyle((establishment as any).ai_positive_style || '')
      setAiNegativeStyle((establishment as any).ai_negative_style || '')
      setAiRules((establishment as any).ai_rules || '')
    }
  }, [establishment])

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)

    const data: Record<string, any> = {
      user_id: session.user.id,
      name: name.trim(),
      address: address.trim() || null,
      city: city.trim() || null,
      category,
      redirect_url: redirectUrl.trim() || null,
      routing_question: routingQuestion.trim(),
      satisfaction_threshold: satisfactionThreshold,
      primary_color: primaryColor,
      ai_tone: aiTone.trim(),
      ai_instructions: aiInstructions.trim() || null,
      ai_preferred_expressions: aiPreferredExpressions.trim() || null,
      ai_avoid_expressions: aiAvoidExpressions.trim() || null,
      ai_response_length: aiResponseLength,
      ai_positive_style: aiPositiveStyle.trim() || null,
      ai_negative_style: aiNegativeStyle.trim() || null,
      ai_rules: aiRules.trim() || null,
    }

    if (isNew) {
      // Creer l'etablissement
      const { data: newEst } = await supabase.from('establishments').insert(data).select().single()

      // CDC 9.3 : generer automatiquement un premier QR code intelligent des la creation
      if (newEst && redirectUrl.trim()) {
        const qrCode = Math.random().toString(36).substring(2, 8).toUpperCase()
        await supabase.from('plates').insert({
          code: qrCode,
          establishment_id: newEst.id,
          label: 'QR principal',
          plate_type: 'qr',
          is_active: true,
          activated_at: new Date().toISOString()
        })
      }
    } else {
      await supabase.from('establishments').update(data).eq('id', establishment!.id)
    }

    await refreshEstablishments()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // Affichage du smart routing (CDC 7.3)
  const routingRanges = []
  for (let i = 1; i < satisfactionThreshold; i++) routingRanges.push(i)
  const negativeRange = routingRanges.length > 0 ? `${routingRanges[0]} a ${routingRanges[routingRanges.length - 1]}` : '1'
  const positiveRange = `${satisfactionThreshold} a 5`

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">{isNew ? 'Configurer mon etablissement' : 'Reglages'}</h1>
        <p className="text-gray-500 text-sm mt-1">{isNew ? 'Renseignez les informations de votre etablissement.' : 'Parametres de votre etablissement, smart routing et IA.'}</p>
      </div>

      <div className="space-y-6 max-w-lg">

        {/* Informations generales */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-display font-semibold text-gray-900 mb-4">Informations generales</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de l'etablissement *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Restaurant Le Gourmet"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Annecy"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Categorie</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="12 Rue du Lac, 74000 Annecy"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur principale</label>
              <div className="flex items-center gap-3">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer" />
                <span className="text-sm text-gray-500 font-mono">{primaryColor}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Smart Routing (CDC 7.3) */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-display font-semibold text-gray-900 mb-4">Smart Routing</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Lien public de redirection (Google, TripAdvisor, etc.)</label>
              <input type="url" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)}
                placeholder="https://g.page/r/votre-restaurant/review"
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1">Les clients satisfaits seront rediriges instantanement vers ce lien. Google conseille.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Question affichee au client</label>
              <input type="text" value={routingQuestion} onChange={(e) => setRoutingQuestion(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Seuil de satisfaction</label>
              <div className="flex items-center gap-3">
                <input type="range" min={2} max={5} value={satisfactionThreshold}
                  onChange={(e) => setSatisfactionThreshold(parseInt(e.target.value))} className="flex-1" />
                <span className="text-sm font-mono font-semibold text-gray-900 w-8 text-center">{satisfactionThreshold}</span>
              </div>
            </div>
            {/* Affichage explicite du routage (CDC 7.3) */}
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-600 mb-3">Logique de routage actuelle :</p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5"
                      fill={s < satisfactionThreshold ? '#f87171' : 'none'} color={s < satisfactionThreshold ? '#f87171' : '#d1d5db'} />)}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-700">{negativeRange} etoile(s) : <span className="font-medium text-amber-700">Retour prive</span></span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5"
                      fill={s >= satisfactionThreshold ? '#facc15' : 'none'} color={s >= satisfactionThreshold ? '#facc15' : '#d1d5db'} />)}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-700">{positiveRange} etoiles : <span className="font-medium text-emerald-700">Redirection vers le lien public</span></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Google Business Profile (CDC 10) */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-display font-semibold text-gray-900 mb-2">Google Business Profile</h2>
          <p className="text-sm text-gray-500 mb-4">Connexion liee a cet etablissement : <span className="font-medium">{name || 'Non defini'}</span></p>
          {!isNew && (
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Statut</span>
                <span className="flex items-center gap-1.5 text-sm">
                  {establishment?.google_connection_status === 'connected' ? (
                    <><CheckCircle2 className="w-4 h-4 text-emerald-500" /><span className="text-emerald-700 font-medium">Connecte</span></>
                  ) : establishment?.google_connection_status === 'error' ? (
                    <><AlertTriangle className="w-4 h-4 text-red-500" /><span className="text-red-700 font-medium">Erreur</span></>
                  ) : (
                    <><Link2 className="w-4 h-4 text-gray-400" /><span className="text-gray-500">Non connecte</span></>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Compte Google</span>
                <span className="text-sm text-gray-500">{establishment?.google_account_email || 'Aucun'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Fiche liee</span>
                <span className="text-sm text-gray-500">{establishment?.google_business_name || 'Aucune'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Derniere synchronisation</span>
                <span className="text-sm text-gray-500">{establishment?.google_last_sync ? new Date(establishment.google_last_sync).toLocaleString('fr-FR') : 'Jamais'}</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <button className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700">
                  {establishment?.google_connection_status === 'connected' ? 'Reconnecter / Changer de compte' : 'Connecter Google Business Profile'}
                </button>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Structure UI prete. L'integration OAuth Google est en cours d'implementation.
                </p>
              </div>
            </div>
          )}
          {isNew && (
            <p className="text-sm text-gray-400">Creez d'abord votre etablissement, puis vous pourrez connecter Google Business Profile.</p>
          )}
        </section>

        {/* Parametrage IA enrichi (CDC section 7.8) */}
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-display font-semibold text-gray-900 mb-2">Voix de marque IA</h2>
          <p className="text-sm text-gray-500 mb-4">
            Definissez la personnalite de votre etablissement pour que les reponses IA sonnent comme vous.
          </p>
          <div className="space-y-4">

            {/* Ton global */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ton general</label>
              <select value={aiTone} onChange={(e) => setAiTone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="chaleureux et professionnel">Chaleureux et professionnel</option>
                <option value="decontracte et amical">Decontracte et amical</option>
                <option value="formel et courtois">Formel et courtois</option>
                <option value="enthousiaste et dynamique">Enthousiaste et dynamique</option>
                <option value="sobre et elegant">Sobre et elegant</option>
                <option value="familial et bienveillant">Familial et bienveillant</option>
              </select>
            </div>

            {/* Expressions a privilegier */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mots et expressions a privilegier</label>
              <textarea value={aiPreferredExpressions} onChange={(e) => setAiPreferredExpressions(e.target.value)}
                placeholder="ex: Merci de tout coeur, au plaisir de vous revoir, notre equipe, fait maison..."
                rows={2}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {/* Formulations a eviter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Formulations a eviter</label>
              <textarea value={aiAvoidExpressions} onChange={(e) => setAiAvoidExpressions(e.target.value)}
                placeholder="ex: Cher client, nous sommes desoles, reduction, code promo..."
                rows={2}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {/* Longueur souhaitee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Longueur des reponses</label>
              <select value={aiResponseLength} onChange={(e) => setAiResponseLength(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="short">Courte (2-3 phrases)</option>
                <option value="medium">Moyenne (4-6 phrases)</option>
                <option value="long">Detaillee (7+ phrases)</option>
              </select>
            </div>

            {/* Style pour avis positifs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Comment repondre aux avis positifs ?</label>
              <textarea value={aiPositiveStyle} onChange={(e) => setAiPositiveStyle(e.target.value)}
                placeholder="ex: Remercier chaleureusement, mentionner un detail de l'avis, inviter a revenir..."
                rows={2}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {/* Style pour avis negatifs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Comment repondre aux avis negatifs ?</label>
              <textarea value={aiNegativeStyle} onChange={(e) => setAiNegativeStyle(e.target.value)}
                placeholder="ex: Presenter des excuses sinceres, proposer de regler le probleme en prive, rester digne..."
                rows={2}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {/* Regles a toujours respecter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Regles a toujours respecter</label>
              <textarea value={aiRules} onChange={(e) => setAiRules(e.target.value)}
                placeholder="ex: Toujours tutoyer. Ne jamais proposer de reduction. Toujours signer avec le prenom du gerant."
                rows={2}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {/* Instructions libres */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Instructions supplementaires (libres)</label>
              <textarea value={aiInstructions} onChange={(e) => setAiInstructions(e.target.value)}
                placeholder="Toute autre instruction pour que l'IA reflete au mieux votre identite..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </section>

        <button onClick={handleSave} disabled={saving || !name.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50">
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : saved ? <Check className="w-4 h-4" /> : isNew ? <Plus className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saving ? 'Enregistrement...' : saved ? 'Enregistre !' : isNew ? "Creer l'etablissement" : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
