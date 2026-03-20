import { useEffect, useState, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Establishment } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface DashboardContext { establishment: Establishment | null; session: Session; refreshEstablishments: () => Promise<void>; establishments: Establishment[]; switchEstablishment: (est: Establishment) => void }

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
  { value: 'commerce', label: 'Commerce de proximité' },
  { value: 'autre', label: 'Autre' },
]

export default function SettingsPage() {
  const { establishment, session, refreshEstablishments, establishments, switchEstablishment } = useOutletContext<DashboardContext>()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [canAddError, setCanAddError] = useState('')
  const isNew = !establishment || isCreatingNew
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [newPlanInterval, setNewPlanInterval] = useState<'monthly'|'yearly'>('yearly')

  const PRICE_MONTHLY = 'price_1TCjEzLMRsVfhf6RMRE1sO8K'
  const PRICE_YEARLY = 'price_1TCjGwLMRsVfhf6R06JFRqRr'

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [category, setCategory] = useState('restaurant')
  const [redirectUrl, setRedirectUrl] = useState('')
  const [routingQuestion, setRoutingQuestion] = useState("Comment s'est passée votre expérience ?")
  const [satisfactionThreshold, setSatisfactionThreshold] = useState(4)
  const [primaryColor, setPrimaryColor] = useState('#2563eb')
  const [logoUrl, setLogoUrl] = useState('')
  const [aiTone, setAiTone] = useState('chaleureux et professionnel')
  const [aiInstructions, setAiInstructions] = useState('')
  const [aiPreferredExpressions, setAiPreferredExpressions] = useState('')
  const [aiAvoidExpressions, setAiAvoidExpressions] = useState('')
  const [aiResponseLength, setAiResponseLength] = useState('medium')
  const [aiPositiveStyle, setAiPositiveStyle] = useState('')
  const [aiNegativeStyle, setAiNegativeStyle] = useState('')
  const [aiRules, setAiRules] = useState('')

  useEffect(() => {
    if (isCreatingNew) {
      setName(''); setAddress(''); setCity(''); setCategory('restaurant')
      setRedirectUrl(''); setRoutingQuestion("Comment s'est passée votre expérience ?")
      setSatisfactionThreshold(4); setPrimaryColor('#2563eb'); setLogoUrl('')
      setAiTone('chaleureux et professionnel'); setAiInstructions('')
      setAiPreferredExpressions(''); setAiAvoidExpressions('')
      setAiResponseLength('medium'); setAiPositiveStyle(''); setAiNegativeStyle(''); setAiRules('')
      return
    }
    if (establishment) {
      setName(establishment.name)
      setAddress(establishment.address || '')
      setCity(establishment.city || '')
      setCategory(establishment.category)
      setRedirectUrl(establishment.redirect_url || '')
      setRoutingQuestion(establishment.routing_question)
      setSatisfactionThreshold(establishment.satisfaction_threshold)
      setPrimaryColor(establishment.primary_color)
      setLogoUrl(establishment.logo_url || '')
      setAiTone(establishment.ai_tone)
      setAiInstructions(establishment.ai_instructions || '')
      setAiPreferredExpressions((establishment as any).ai_preferred_expressions || '')
      setAiAvoidExpressions((establishment as any).ai_avoid_expressions || '')
      setAiResponseLength((establishment as any).ai_response_length || 'medium')
      setAiPositiveStyle((establishment as any).ai_positive_style || '')
      setAiNegativeStyle((establishment as any).ai_negative_style || '')
      setAiRules((establishment as any).ai_rules || '')
    }
  }, [establishment, isCreatingNew])

  async function uploadLogo(file: File) {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const fileName = `${session.user.id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('logos').upload(fileName, file, { upsert: true })
    if (error) { alert('Erreur upload: ' + error.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName)
    setLogoUrl(urlData.publicUrl)
    if (establishment) {
      await supabase.from('establishments').update({ logo_url: urlData.publicUrl }).eq('id', establishment.id)
      await refreshEstablishments()
    }
    setUploading(false)
  }

  async function removeLogo() {
    setLogoUrl('')
    if (establishment) {
      await supabase.from('establishments').update({ logo_url: null }).eq('id', establishment.id)
      await refreshEstablishments()
    }
  }

  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // On mount: check if we're coming back from a cancelled checkout with a draft establishment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const checkoutResult = params.get('new_establishment')
    const draftId = params.get('draft_id')
    if (checkoutResult === 'cancelled' && draftId) {
      // Clean up draft establishment
      supabase.from('establishments').delete().eq('id', draftId).eq('is_active', false).then(() => {
        refreshEstablishments()
      })
      window.history.replaceState({}, '', '/dashboard/settings')
    }
    if (checkoutResult === 'success') {
      refreshEstablishments()
      window.history.replaceState({}, '', '/dashboard/settings')
    }
  }, [])

  async function handleAddEstablishment() {
    setCanAddError('')
    setIsCreatingNew(true)
  }

  function cancelNewEstablishment() {
    setIsCreatingNew(false)
    setCanAddError('')
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    const estData: Record<string, any> = {
      user_id: session.user.id, name: name.trim(), address: address.trim() || null,
      city: city.trim() || null, category, redirect_url: redirectUrl.trim() || null,
      routing_question: routingQuestion.trim(), satisfaction_threshold: satisfactionThreshold,
      primary_color: primaryColor, logo_url: logoUrl || null, ai_tone: aiTone.trim(),
      ai_instructions: aiInstructions.trim() || null,
      ai_preferred_expressions: aiPreferredExpressions.trim() || null,
      ai_avoid_expressions: aiAvoidExpressions.trim() || null,
      ai_response_length: aiResponseLength,
      ai_positive_style: aiPositiveStyle.trim() || null,
      ai_negative_style: aiNegativeStyle.trim() || null,
      ai_rules: aiRules.trim() || null,
    }

    if (isCreatingNew) {
      // New establishment flow: create as draft (is_active: false) then launch Stripe checkout
      estData.is_active = false
      const { data: newEst, error: insertErr } = await supabase.from('establishments').insert(estData).select().single()
      if (insertErr || !newEst) {
        alert("Erreur lors de la création : " + (insertErr?.message || "Réessayez."))
        setSaving(false)
        return
      }
      // Create default QR code
      if (redirectUrl.trim()) {
        const qrCode = Math.random().toString(36).substring(2, 8).toUpperCase()
        await supabase.from('plates').insert({ code: qrCode, establishment_id: newEst.id, label: 'QR principal', plate_type: 'qr', is_active: true, activated_at: new Date().toISOString() })
      }
      // Launch Stripe checkout for this new establishment
      setSaving(false)
      setCheckoutLoading(true)
      try {
        const origin = window.location.origin
        const { data: checkoutData, error: checkoutErr } = await supabase.functions.invoke('create-checkout', {
          body: {
            mode: 'subscription',
            price_id: newPlanInterval === 'yearly' ? PRICE_YEARLY : PRICE_MONTHLY,
            plan_interval: newPlanInterval,
            establishment_id: newEst.id,
            success_url: `${origin}/dashboard/settings?new_establishment=success&draft_id=${newEst.id}`,
            cancel_url: `${origin}/dashboard/settings?new_establishment=cancelled&draft_id=${newEst.id}`,
          }
        })
        if (checkoutErr) throw checkoutErr
        if (checkoutData?.url) {
          window.location.href = checkoutData.url
          return
        }
      } catch (err: any) {
        await supabase.from('establishments').delete().eq('id', newEst.id)
        alert("Erreur lors du paiement : " + (err.message || "Réessayez."))
      }
      setCheckoutLoading(false)
    } else if (isNew) {
      // First establishment creation (subscription handled separately via SubscriptionPage)
      const { data: newEst } = await supabase.from('establishments').insert(estData).select().single()
      if (newEst) {
        if (redirectUrl.trim()) {
          const qrCode = Math.random().toString(36).substring(2, 8).toUpperCase()
          await supabase.from('plates').insert({ code: qrCode, establishment_id: newEst.id, label: 'QR principal', plate_type: 'qr', is_active: true, activated_at: new Date().toISOString() })
        }
        setIsCreatingNew(false)
        await refreshEstablishments()
        switchEstablishment(newEst as Establishment)
      }
      setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
    } else {
      // Update existing establishment
      await supabase.from('establishments').update(estData).eq('id', establishment!.id)
      await refreshEstablishments()
      setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
    }
  }

  const sectionStyle = { background:'#fff', borderRadius:20, border:'1px solid #f0f0ec', padding:'24px' } as const
  const labelStyle = { display:'block', fontSize:13, fontWeight:500, color:'#555', marginBottom:6 } as const
  const inputCls = "w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  const routingRanges: number[] = []
  for (let i = 1; i < satisfactionThreshold; i++) routingRanges.push(i)
  const negativeRange = routingRanges.length > 0 ? `${routingRanges[0]} a ${routingRanges[routingRanges.length - 1]}` : '1'
  const positiveRange = `${satisfactionThreshold} a 5`

  return (
    <div>
      <div className="mb-6">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:24, color:'#1a1a18', letterSpacing:'-0.02em', margin:'0 0 4px' }}>
              {isCreatingNew ? 'Nouvel établissement' : isNew ? 'Configurer mon établissement' : 'Réglages'}
            </h1>
            <p className="text-gray-500 text-sm">
              {isCreatingNew ? 'Renseignez les informations du nouvel établissement.' : isNew ? 'Renseignez les informations de votre établissement.' : 'Paramètres de votre établissement, smart routing et IA.'}
            </p>
          </div>
          {!isNew && (
            <button onClick={handleAddEstablishment}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', borderRadius:12, border:'1.5px solid #e8e8e4', background:'#fff', fontSize:13, fontWeight:500, color:'#555', cursor:'pointer', transition:'all 0.15s', fontFamily:'"Outfit",system-ui', whiteSpace:'nowrap' }}
              onMouseEnter={(e) => { (e.currentTarget).style.borderColor='#2563eb'; (e.currentTarget).style.color='#2563eb' }}
              onMouseLeave={(e) => { (e.currentTarget).style.borderColor='#e8e8e4'; (e.currentTarget).style.color='#555' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Ajouter un établissement
            </button>
          )}
        </div>
        {canAddError && (
          <div style={{ marginTop:12, background:'#fee2e2', border:'1px solid #fecaca', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" style={{ flexShrink:0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p style={{ fontSize:13, color:'#991b1b', margin:0 }}>{canAddError}</p>
          </div>
        )}
        {isCreatingNew && (
          <button onClick={cancelNewEstablishment}
            style={{ marginTop:12, display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, border:'1.5px solid #e8e8e4', background:'#fff', fontSize:13, fontWeight:500, color:'#888', cursor:'pointer', fontFamily:'"Outfit",system-ui' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Retour aux réglages
          </button>
        )}
      </div>

      <div className="space-y-6 max-w-lg">

        {/* Logo */}
        <section style={sectionStyle}>
          <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', marginBottom:16 }}>Logo de l'établissement</h2>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ width:72, height:72, borderRadius:16, objectFit:'cover', border:'1px solid #f0f0ec' }}/>
            ) : (
              <div style={{ width:72, height:72, borderRadius:16, background:'#f5f5f0', display:'flex', alignItems:'center', justifyContent:'center', border:'1px dashed #ddd' }}>
                <svg width="24" height="24" fill="none" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              </div>
            )}
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, color:'#888', marginBottom:10, lineHeight:1.5 }}>Ce logo apparaitra sur la page de notation vue par vos clients.</p>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  style={{ padding:'8px 16px', borderRadius:10, border:'1.5px solid #e8e8e4', background:'#fff', fontSize:13, fontWeight:500, color:'#555', cursor:'pointer', transition:'all 0.15s' }}>
                  {uploading ? 'Upload...' : logoUrl ? 'Changer' : 'Ajouter un logo'}
                </button>
                {logoUrl && (
                  <button onClick={removeLogo}
                    style={{ padding:'8px 16px', borderRadius:10, border:'1.5px solid #fecaca', background:'#fff', fontSize:13, fontWeight:500, color:'#dc2626', cursor:'pointer' }}>
                    Supprimer
                  </button>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }}
                onChange={(e) => { if (e.target.files?.[0]) uploadLogo(e.target.files[0]) }}/>
            </div>
          </div>
        </section>

        {/* Informations générales */}
        <section style={sectionStyle}>
          <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', marginBottom:16 }}>Informations générales</h2>
          <div className="space-y-4">
            <div>
              <label style={labelStyle}>Nom de l'établissement *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Restaurant Le Gourmet" className={inputCls}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Ville</label>
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Annecy" className={inputCls}/>
              </div>
              <div>
                <label style={labelStyle}>Categorie</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Adresse</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="12 Rue du Lac, 74000 Annecy" className={inputCls}/>
            </div>
            <div>
              <label style={labelStyle}>Couleur principale</label>
              <p style={{ fontSize:12, color:'#999', marginBottom:8 }}>Cette couleur sera utilisee pour les boutons et accents sur la page vue par vos clients.</p>
              <div className="flex items-center gap-3">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"/>
                <span className="text-sm text-gray-500 font-mono">{primaryColor}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Smart Routing */}
        <section style={sectionStyle}>
          <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', marginBottom:4 }}>Smart Routing</h2>
          <p style={{ fontSize:13, color:'#888', marginBottom:16 }}>Configurez le comportement quand un client scanne votre QR code ou tag NFC.</p>
          <div className="space-y-4">
            <div>
              <label style={labelStyle}>Lien public de redirection (Google, TripAdvisor, etc.)</label>
              <input type="url" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} placeholder="https://g.page/r/votre-restaurant/review" className={inputCls}/>
              <p style={{ fontSize:12, color:'#aaa', marginTop:4 }}>Les clients satisfaits seront redirigés instantanement vers ce lien.</p>
            </div>
            <div>
              <label style={labelStyle}>Question affichee au client</label>
              <input type="text" value={routingQuestion} onChange={(e) => setRoutingQuestion(e.target.value)} className={inputCls}/>
            </div>
            <div>
              <label style={labelStyle}>Seuil de satisfaction</label>
              <div className="flex items-center gap-3">
                <input type="range" min={2} max={5} value={satisfactionThreshold} onChange={(e) => setSatisfactionThreshold(parseInt(e.target.value))} className="flex-1"/>
                <span className="text-sm font-mono font-semibold text-gray-900 w-8 text-center">{satisfactionThreshold}</span>
              </div>
            </div>
            <div style={{ background:'#f5f5f0', borderRadius:12, padding:16 }}>
              <p style={{ fontSize:12, fontWeight:600, color:'#666', marginBottom:10 }}>Logique de routage actuelle :</p>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ display:'flex', gap:2 }}>
                    {[1,2,3,4,5].map(s => <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={s<satisfactionThreshold?'#f87171':'none'} stroke={s<satisfactionThreshold?'#f87171':'#d1d5db'} strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
                  </div>
                  <span style={{ fontSize:12, color:'#666' }}>{negativeRange} étoile(s) → <span style={{ fontWeight:600, color:'#d97706' }}>Retour privé</span></span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ display:'flex', gap:2 }}>
                    {[1,2,3,4,5].map(s => <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill={s>=satisfactionThreshold?'#facc15':'none'} stroke={s>=satisfactionThreshold?'#facc15':'#d1d5db'} strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
                  </div>
                  <span style={{ fontSize:12, color:'#666' }}>{positiveRange} étoiles → <span style={{ fontWeight:600, color:'#059669' }}>Redirection Google</span></span>
                </div>
              </div>
            </div>
            <div style={{ background:'#eff6ff', border:'1px solid #dbeafe', borderRadius:12, padding:16 }}>
              <p style={{ fontSize:12, fontWeight:600, color:'#1e40af', marginBottom:6 }}>Comment ça marche ?</p>
              <ol style={{ fontSize:12, color:'#3b82f6', lineHeight:1.8, paddingLeft:16, margin:0 }}>
                <li>Créez un QR code dans Tags NFC & QR</li>
                <li>Imprimez-le et placez-le dans votre établissement</li>
                <li>Le client scanne → voit les étoiles → est redirigé selon sa note</li>
              </ol>
            </div>
          </div>
        </section>

        {/* Aperçu du smart routing */}
        <section style={sectionStyle}>
          <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', marginBottom:4 }}>Aperçu du smart routing</h2>
          <p style={{ fontSize:13, color:'#888', marginBottom:16 }}>Voilà ce que vos clients verront en scannant votre QR code.</p>
          <div style={{ background:`radial-gradient(ellipse at 50% 20%,${primaryColor}08 0%,#fafaf8 60%)`, borderRadius:16, padding:24, border:'1px solid #f0f0ec' }}>
            <div style={{ textAlign:'center', marginBottom:16 }}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" style={{ width:48, height:48, borderRadius:12, objectFit:'cover', margin:'0 auto 8px', display:'block', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}/>
              ) : (
                <div style={{ width:48, height:48, borderRadius:12, background:'#e8e8e4', margin:'0 auto 8px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontSize:18, fontWeight:700, color:'#999' }}>{name ? name.charAt(0) : '?'}</span>
                </div>
              )}
              <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:18, color:'#1a1a18' }}>{name || 'Votre établissement'}</p>
            </div>
            <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
              <p style={{ textAlign:'center', fontSize:14, fontWeight:500, color:'#333', marginBottom:16 }}>{routingQuestion}</p>
              <div style={{ display:'flex', justifyContent:'center', gap:6 }}>
                {[1,2,3,4,5].map(s => (
                  <svg key={s} width="32" height="32" viewBox="0 0 24 24" fill="#facc15" stroke="#facc15" strokeWidth="1.5" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                ))}
              </div>
              <div style={{ marginTop:14 }}>
                <div style={{ width:'100%', padding:10, borderRadius:10, background:primaryColor, textAlign:'center' }}>
                  <span style={{ color:'#fff', fontSize:13, fontWeight:600, fontFamily:'"Outfit",system-ui' }}>Valider ma note</span>
                </div>
              </div>
            </div>
            <p style={{ textAlign:'center', fontSize:10, color:'#c0c0b8', marginTop:12 }}>Propulsé par StarPulse</p>
          </div>
        </section>

        {/* Google Business Profile */}
        <section style={sectionStyle}>
          <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', marginBottom:4 }}>Google Business Profile</h2>
          <p style={{ fontSize:13, color:'#888', marginBottom:16 }}>Connexion liée a cet établissement : <span style={{ fontWeight:500 }}>{name || 'Non défini'}</span></p>
          {!isNew && (
            <div style={{ background:'#f5f5f0', borderRadius:12, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:13, color:'#666' }}>Statut</span>
                {establishment?.google_connection_status === 'connected' ? (
                  <span style={{ fontSize:13, fontWeight:600, color:'#059669' }}>Connecté</span>
                ) : (
                  <span style={{ fontSize:13, color:'#999' }}>Non connecté</span>
                )}
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:13, color:'#666' }}>Fiche liée</span>
                <span style={{ fontSize:13, color:'#999' }}>{establishment?.google_business_name || 'Aucune'}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
                <span style={{ fontSize:13, color:'#666' }}>Dernière synchro</span>
                <span style={{ fontSize:13, color:'#999' }}>{establishment?.google_last_sync ? new Date(establishment.google_last_sync).toLocaleString('fr-FR') : 'Jamais'}</span>
              </div>
              <button style={{ width:'100%', padding:10, borderRadius:10, border:'none', background:'#2563eb', color:'#fff', fontSize:13, fontWeight:600, fontFamily:'"Outfit",system-ui', cursor:'pointer' }}>
                {establishment?.google_connection_status === 'connected' ? 'Reconnecter' : 'Connectér Google Business Profile'}
              </button>
              <p style={{ fontSize:11, color:'#aaa', textAlign:'center', marginTop:8 }}>OAuth Google en cours d'implémentation.</p>
            </div>
          )}
          {isNew && <p style={{ fontSize:13, color:'#aaa' }}>Créez d'abord votre établissement.</p>}
        </section>

        {/* Voix de marque IA */}
        <section style={sectionStyle}>
          <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', marginBottom:4 }}>Voix de marque IA</h2>
          <p style={{ fontSize:13, color:'#888', marginBottom:16 }}>Définissez la personnalité de votre établissement pour que les réponses IA sonnent comme vous.</p>
          <div className="space-y-4">
            <div>
              <label style={labelStyle}>Ton général</label>
              <select value={aiTone} onChange={(e) => setAiTone(e.target.value)} className={inputCls}>
                <option value="chaleureux et professionnel">Chaleureux et professionnel</option>
                <option value="décontracté et amical">Decontracte et amical</option>
                <option value="formel et courtois">Formel et courtois</option>
                <option value="enthousiaste et dynamique">Enthousiaste et dynamique</option>
                <option value="sobre et élégant">Sobre et élégant</option>
                <option value="familial et bienveillant">Familial et bienveillant</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Mots et expressions a privilégier</label>
              <textarea value={aiPreferredExpressions} onChange={(e) => setAiPreferredExpressions(e.target.value)} placeholder="ex: Merci de tout coeur, au plaisir de vous revoir..." rows={2} className={inputCls + " resize-none"}/>
            </div>
            <div>
              <label style={labelStyle}>Formulations a éviter</label>
              <textarea value={aiAvoidExpressions} onChange={(e) => setAiAvoidExpressions(e.target.value)} placeholder="ex: Cher client, nous sommes désolés..." rows={2} className={inputCls + " resize-none"}/>
            </div>
            <div>
              <label style={labelStyle}>Longueur des réponses</label>
              <select value={aiResponseLength} onChange={(e) => setAiResponseLength(e.target.value)} className={inputCls}>
                <option value="short">Courte (2-3 phrases)</option>
                <option value="medium">Moyenne (4-6 phrases)</option>
                <option value="long">Détaillée (7+ phrases)</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Comment répondre aux avis positifs ?</label>
              <textarea value={aiPositiveStyle} onChange={(e) => setAiPositiveStyle(e.target.value)} placeholder="ex: Remercier chaleureusement, mentionner un detail..." rows={2} className={inputCls + " resize-none"}/>
            </div>
            <div>
              <label style={labelStyle}>Comment répondre aux avis négatifs ?</label>
              <textarea value={aiNegativeStyle} onChange={(e) => setAiNegativeStyle(e.target.value)} placeholder="ex: Présentér des excuses sincères, proposer de regler en privé..." rows={2} className={inputCls + " resize-none"}/>
            </div>
            <div>
              <label style={labelStyle}>Règles à toujours respecter</label>
              <textarea value={aiRules} onChange={(e) => setAiRules(e.target.value)} placeholder="ex: Toujours tutoyer. Ne jamais proposer de reduction." rows={2} className={inputCls + " resize-none"}/>
            </div>
            <div>
              <label style={labelStyle}>Instructions supplémentaires</label>
              <textarea value={aiInstructions} onChange={(e) => setAiInstructions(e.target.value)} placeholder="Toute autre instruction pour l'IA..." rows={3} className={inputCls + " resize-none"}/>
            </div>
          </div>
        </section>

        {/* Choix du plan pour nouvel établissement */}
        {isCreatingNew && (
          <section style={sectionStyle}>
            <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', marginBottom:4 }}>Abonnement pour cet établissement</h2>
            <p style={{ fontSize:13, color:'#888', marginBottom:16 }}>Chaque établissement nécessite son propre abonnement.</p>
            <div style={{ display:'flex', gap:12 }}>
              <button onClick={() => setNewPlanInterval('monthly')}
                style={{
                  flex:1, padding:'16px', borderRadius:14, border: newPlanInterval === 'monthly' ? '2px solid #2563eb' : '1.5px solid #e8e8e4',
                  background: newPlanInterval === 'monthly' ? 'rgba(37,99,235,0.04)' : '#fff',
                  cursor:'pointer', textAlign:'center', transition:'all 0.15s',
                }}>
                <div style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:24, color:'#1a1a18', letterSpacing:'-0.02em' }}>29<span style={{ fontSize:13, fontWeight:500, color:'#888' }}> EUR/mois</span></div>
                <div style={{ fontSize:12, color:'#888', marginTop:4 }}>Mensuel, sans engagement</div>
              </button>
              <button onClick={() => setNewPlanInterval('yearly')}
                style={{
                  flex:1, padding:'16px', borderRadius:14, border: newPlanInterval === 'yearly' ? '2px solid #2563eb' : '1.5px solid #e8e8e4',
                  background: newPlanInterval === 'yearly' ? 'rgba(37,99,235,0.04)' : '#fff',
                  cursor:'pointer', textAlign:'center', transition:'all 0.15s', position:'relative',
                }}>
                <div style={{ position:'absolute', top:-10, right:12, padding:'2px 8px', borderRadius:6, background:'#dcfce7', color:'#16a34a', fontSize:10, fontWeight:700 }}>-28%</div>
                <div style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:24, color:'#1a1a18', letterSpacing:'-0.02em' }}>249<span style={{ fontSize:13, fontWeight:500, color:'#888' }}> EUR/an</span></div>
                <div style={{ fontSize:12, color:'#888', marginTop:4 }}>~20,75 EUR/mois</div>
              </button>
            </div>
            <p style={{ fontSize:11, color:'#bbb', marginTop:10, textAlign:'center' }}>Essai gratuit 7 jours. Paiement sécurisé par Stripe.</p>
          </section>
        )}

        {/* Bouton sauvegarder */}
        {checkoutLoading ? (
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 28px', borderRadius:14, background:'#f5f5f0' }}>
            <div style={{ width:20, height:20, borderRadius:'50%', border:'3px solid #e8e8e4', borderTopColor:'#2563eb', animation:'spin 0.8s linear infinite' }}/>
            <span style={{ fontSize:15, fontWeight:600, color:'#555', fontFamily:'"Outfit",system-ui' }}>Redirection vers le paiement...</span>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        ) : (
          <button onClick={handleSave} disabled={saving || !name.trim()}
            style={{
              display:'flex', alignItems:'center', gap:8, padding:'14px 28px', borderRadius:14, border:'none',
              background: saving ? '#93a3b8' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              color:'#fff', fontSize:15, fontWeight:600, fontFamily:'"Outfit",system-ui',
              cursor: saving ? 'wait' : 'pointer', boxShadow: saving ? 'none' : '0 4px 16px rgba(37,99,235,0.3)',
              transition:'all 0.2s', letterSpacing:'-0.01em'
            }}>
            {saving ? 'Création en cours...' : saved ? 'Enregistré !' : isCreatingNew ? 'Créer et souscrire' : isNew ? "Créer l'établissement" : 'Enregistrer les modifications'}
          </button>
        )}
      </div>
    </div>
  )
}
