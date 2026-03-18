import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Establishment, Plate } from '../lib/supabase'

type Step = 'loading' | 'rating' | 'feedback' | 'thanks' | 'error' | 'inactive'

export default function RoutingPage() {
  const { code } = useParams<{ code: string }>()
  const [step, setStep] = useState<Step>('loading')
  const [plate, setPlate] = useState<Plate | null>(null)
  const [establishment, setEstablishment] = useState<Establishment | null>(null)
  const [selectedRating, setSelectedRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [confirmed, setConfirmed] = useState(false)
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

  async function handleStarClick(rating: number) {
    if (!plate || !establishment || confirmed) return
    setSelectedRating(rating)
    const isPositive = rating >= establishment.satisfaction_threshold
    if (isPositive) {
      setConfirmed(true)
      await supabase.from('scans').insert({
        plate_id: plate.id, establishment_id: establishment.id,
        rating_given: rating, result: 'redirect', plate_type: plate.plate_type
      })
      if (establishment.redirect_url) window.location.href = establishment.redirect_url
    }
  }

  async function confirmNegative() {
    if (!plate || !establishment || !selectedRating || confirmed) return
    setConfirmed(true)
    await supabase.from('scans').insert({
      plate_id: plate.id, establishment_id: establishment.id,
      rating_given: selectedRating, result: 'feedback', plate_type: plate.plate_type
    })
    setTimeout(() => { setStep('feedback'); setConfirmed(false) }, 400)
  }

  function validateFeedback(): boolean {
    if (!contactFirstName.trim()) { setValidationError('Veuillez renseigner votre prenom.'); return false }
    if (!contactEmail.trim() && !contactPhone.trim()) { setValidationError('Veuillez renseigner au moins un moyen de contact.'); return false }
    if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) { setValidationError('Adresse email invalide.'); return false }
    setValidationError(''); return true
  }

  async function handleFeedbackSubmit() {
    if (!plate || !establishment || !validateFeedback()) return
    setSubmitting(true)
    await supabase.from('feedbacks').insert({
      establishment_id: establishment.id, plate_id: plate.id, rating: selectedRating,
      comment: feedbackText.trim() || null, client_first_name: contactFirstName.trim(),
      client_email: contactEmail.trim() || null, client_phone: contactPhone.trim() || null,
      source_plate_code: plate.code
    })
    setSubmitting(false); setStep('thanks')
  }

  const color = establishment?.primary_color || '#2563eb'
  function hexToRgb(hex: string) {
    return { r: parseInt(hex.slice(1,3),16), g: parseInt(hex.slice(3,5),16), b: parseInt(hex.slice(5,7),16) }
  }
  const rgb = hexToRgb(color)
  const threshold = establishment?.satisfaction_threshold || 4
  const isNegative = selectedRating > 0 && selectedRating < threshold

  if (step === 'loading') return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fafaf8' }}>
      <div style={{ width:40, height:40, borderRadius:'50%', border:`3px solid ${color}20`, borderTopColor:color, animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (step === 'error') return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fafaf8', padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:280 }}>
        <div style={{ width:56, height:56, borderRadius:16, background:'#f5f5f0', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <svg width="24" height="24" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round"><circlé cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
        </div>
        <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:17, color:'#1a1a18', margin:'0 0 6px' }}>Lien invalide</p>
        <p style={{ fontFamily:'"DM Sans",system-ui', fontSize:14, color:'#888', lineHeight:1.5, margin:0 }}>Ce lien ne correspond a aucun établissement.</p>
      </div>
    </div>
  )

  if (step === 'inactive') return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fafaf8', padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:280 }}>
        <div style={{ width:56, height:56, borderRadius:16, background:'#f5f5f0', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <svg width="24" height="24" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round"><circlé cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
        </div>
        <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:17, color:'#1a1a18', margin:'0 0 6px' }}>Service indisponible</p>
        <p style={{ fontFamily:'"DM Sans",system-ui', fontSize:14, color:'#888', lineHeight:1.5, margin:0 }}>Ce service n'est plus actif pour le moment.</p>
      </div>
    </div>
  )

  if (step === 'thanks') return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:`radial-gradient(ellipse at 50% 30%,rgba(${rgb.r},${rgb.g},${rgb.b},0.06) 0%,#fafaf8 70%)`, padding:24 }}>
      <div style={{ textAlign:'center', maxWidth:300, animation:'fadeScale 0.5s ease-out' }}>
        <div style={{ width:64, height:64, borderRadius:20, background:color, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', boxShadow:`0 8px 32px rgba(${rgb.r},${rgb.g},${rgb.b},0.3)` }}>
          <svg width="28" height="28" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
        </div>
        <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:22, color:'#1a1a18', margin:'0 0 8px', letterSpacing:'-0.02em' }}>Merci !</p>
        <p style={{ fontFamily:'"DM Sans",system-ui', fontSize:15, color:'#777', lineHeight:1.6, margin:0 }}>Votre retour a bien été transmis. Il nous aidera à nous améliorer.</p>
      </div>
      <style>{`@keyframes fadeScale{from{opacity:0;transform:scale(0.9) translateY(12px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  )

  const inputStyle = { width:'100%', border:'1.5px solid #e8e8e4', borderRadius:12, padding:'12px 14px', fontSize:14, fontFamily:'inherit', color:'#333', background:'#fafaf8', outline:'none', transition:'border-color 0.2s' } as const

  return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center', background:`radial-gradient(ellipse at 50% 20%,rgba(${rgb.r},${rgb.g},${rgb.b},0.05) 0%,#fafaf8 60%)`, padding:'32px 20px', fontFamily:'"DM Sans",system-ui,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:380 }}>
        <div style={{ textAlign:'center' as const, marginBottom:32, animation:'fadeUp 0.5s ease-out' }}>
          {establishment?.logo_url && <img src={establishment.logo_url} alt={establishment.name} style={{ width:100, height:100, borderRadius:24, objectFit:'cover' as const, margin:'0 auto 12px', display:'block', boxShadow:'0 4px 16px rgba(0,0,0,0.08)' }}/>}
          <h1 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:24, color:'#1a1a18', margin:'0 0 4px', letterSpacing:'-0.02em' }}>{establishment?.name}</h1>
        </div>

        {step === 'rating' && (
          <div style={{ background:'#fff', borderRadius:20, padding:'28px 24px', boxShadow:'0 1px 3px rgba(0,0,0,0.04),0 8px 32px rgba(0,0,0,0.06)', animation:'fadeUp 0.5s ease-out 0.1s both' }}>
            <p style={{ textAlign:'center' as const, fontWeight:500, fontSize:16, color:'#333', margin:'0 0 24px', lineHeight:1.5 }}>{establishment?.routing_question}</p>
            <div className="star-row" style={{ display:'flex', justifyContent:'center', gap:8 }}>
              {[1,2,3,4,5].map((star) => {
                const display = hoveredRating || selectedRating
                const active = display >= star
                return (
                  <button key={star} onClick={() => handleStarClick(star)} onMouseEnter={() => !confirmed && setHoveredRating(star)} onMouseLeave={() => setHoveredRating(0)} disabled={confirmed}
                    className="star-btn"
                    style={{ background:'none', border:'none', padding:4, cursor:confirmed?'default':'pointer', transition:'transform 0.15s ease' }}>
                    <svg width="42" height="42" viewBox="0 0 24 24" fill={active?'#facc15':'none'} stroke={active?'#facc15':'#d1d5db'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" style={{ display:'block' }}>
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </button>
                )
              })}
            </div>
            {isNegative && !confirmed && (
              <button onClick={confirmNegative} style={{
                display:'block', width:'100%', marginTop:20, padding:'13px 0', borderRadius:14, border:'none',
                background:color, color:'#fff', fontSize:15, fontWeight:600, fontFamily:'"Outfit",system-ui',
                cursor:'pointer', boxShadow:`0 4px 16px rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`,
                transition:'transform 0.1s', letterSpacing:'-0.01em', animation:'fadeUp 0.3s ease-out'
              }}
                onMouseDown={(e) => (e.target as HTMLElement).style.transform='scale(0.98)'}
                onMouseUp={(e) => (e.target as HTMLElement).style.transform='scale(1)'}>
                Valider ma note
              </button>
            )}
          </div>
        )}

        {step === 'feedback' && (
          <div style={{ background:'#fff', borderRadius:20, padding:'28px 24px', boxShadow:'0 1px 3px rgba(0,0,0,0.04),0 8px 32px rgba(0,0,0,0.06)', animation:'fadeUp 0.4s ease-out' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, paddingBottom:16, marginBottom:20, borderBottom:'1px solid #f0f0ec' }}>
              <span style={{ fontSize:13, color:'#999' }}>Votre note</span>
              <div style={{ display:'flex', gap:2 }}>
                {[1,2,3,4,5].map(s => (
                  <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill={s<=selectedRating?'#facc15':'none'} stroke={s<=selectedRating?'#facc15':'#d1d5db'} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
            </div>
            <p style={{ fontSize:14, color:'#777', marginBottom:20, lineHeight:1.6 }}>Ce retour restera privé. Il sera transmis directement à l'établissement.</p>
            <div style={{ display:'flex', flexDirection:'column' as const, gap:14 }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#555', marginBottom:6 }}>Votre retour <span style={{ color:'#aaa', fontWeight:400 }}>(recommande)</span></label>
                <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="Qu'est-ce qui pourrait etre ameliore ?" rows={3} autoFocus style={{...inputStyle, resize:'none' as const}} onFocus={(e) => e.target.style.borderColor=color} onBlur={(e) => e.target.style.borderColor='#e8e8e4'}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#555', marginBottom:6 }}>Prenom <span style={{ color:'#e55' }}>*</span></label>
                <input type="text" value={contactFirstName} onChange={(e) => {setContactFirstName(e.target.value);setValidationError('')}} placeholder="Votre prenom" style={inputStyle} onFocus={(e) => e.target.style.borderColor=color} onBlur={(e) => e.target.style.borderColor='#e8e8e4'}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#555', marginBottom:6 }}>Email <span style={{ color:'#e55' }}>*</span></label>
                <input type="email" value={contactEmail} onChange={(e) => {setContactEmail(e.target.value);setValidationError('')}} placeholder="votre@email.com" style={inputStyle} onFocus={(e) => e.target.style.borderColor=color} onBlur={(e) => e.target.style.borderColor='#e8e8e4'}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#555', marginBottom:6 }}>Telephone <span style={{ color:'#aaa', fontWeight:400 }}>(ou email ci-dessus)</span></label>
                <input type="tel" value={contactPhone} onChange={(e) => {setContactPhone(e.target.value);setValidationError('')}} placeholder="06 12 34 56 78" style={inputStyle} onFocus={(e) => e.target.style.borderColor=color} onBlur={(e) => e.target.style.borderColor='#e8e8e4'}/>
              </div>
              <p style={{ fontSize:12, color:'#aaa', margin:0 }}>* Prenom et au moins un moyen de contact obligatoires.</p>
              {validationError && <div style={{ background:'#fef2f2', color:'#b91c1c', fontSize:13, padding:'10px 14px', borderRadius:10 }}>{validationError}</div>}
              <button onClick={handleFeedbackSubmit} disabled={submitting||!contactFirstName.trim()||(!contactEmail.trim()&&!contactPhone.trim())}
                style={{ width:'100%', padding:'14px 0', borderRadius:14, border:'none', background:submitting||!contactFirstName.trim()||(!contactEmail.trim()&&!contactPhone.trim())?'#d1d5db':color, color:'#fff', fontSize:15, fontWeight:600, fontFamily:'"Outfit",system-ui', cursor:submitting?'wait':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'background 0.2s,transform 0.1s', boxShadow:submitting||!contactFirstName.trim()?'none':`0 4px 16px rgba(${rgb.r},${rgb.g},${rgb.b},0.3)`, letterSpacing:'-0.01em' }}>
                {submitting?<div style={{ width:18, height:18, border:'2px solid #fff', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>:'Envoyer mon retour'}
              </button>
            </div>
          </div>
        )}

        <p style={{ textAlign:'center' as const, fontSize:11, color:'#c0c0b8', marginTop:32, letterSpacing:'0.02em' }}>Propulse par StarPulse</p>
      </div>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        *{margin:0;padding:0;box-sizing:border-box}
        input::placeholder,textarea::placeholder{color:#bbb}
        input:focus,textarea:focus{border-color:${color} !important}
        .star-btn{transition:transform 0.15s ease}
        .star-btn:hover{transform:scale(1.2)}
      `}</style>
    </div>
  )
}
