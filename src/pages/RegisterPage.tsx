import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard/settings'
  const refCode = searchParams.get('ref') || ''
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [referralCode, setReferralCode] = useState(refCode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('Mot de passe : 6 caracteres minimum.'); return }
    setLoading(true); setError('')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(), password, options: { data: { full_name: fullName.trim() } }
    })
    if (authError) {
      setError(authError.message === 'User already registered' ? 'Un compte existe deja avec cet email.' : 'Erreur lors de la creation du compte.')
      setLoading(false); return
    }
    if (referralCode.trim() && authData.user) {
      const { data: aff } = await supabase.from('affiliates').select('id').eq('referral_code', referralCode.trim().toUpperCase()).single()
      if (aff) {
        await supabase.from('referrals').insert({
          affiliate_id: aff.id, referred_user_id: authData.user.id,
          commission_end_date: new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      }
    }
    navigate(redirectTo)
  }

  const inputStyle = { width:'100%', border:'1.5px solid #e8e8e4', borderRadius:12, padding:'13px 14px', fontSize:14, fontFamily:'"DM Sans",system-ui', color:'#1a1a18', background:'#fafaf8', outline:'none', transition:'border-color 0.2s,box-shadow 0.2s' }
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor='#2563eb'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.08)' }
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor='#e8e8e4'; e.target.style.boxShadow='none' }

  return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'radial-gradient(ellipse at 50% 0%,rgba(37,99,235,0.04) 0%,#fafaf8 60%)', padding:'32px 20px', fontFamily:'"DM Sans",system-ui,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32, animation:'fadeUp 0.5s ease-out' }}>
          <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 4px 20px rgba(37,99,235,0.25)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <h1 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:26, color:'#1a1a18', margin:'0 0 6px', letterSpacing:'-0.03em' }}>Creer votre compte</h1>
          <p style={{ fontSize:14, color:'#888', margin:0 }}>Gerez vos avis clients en quelques clics</p>
        </div>
        <form onSubmit={handleRegister} style={{ background:'#fff', borderRadius:20, padding:'28px 24px', boxShadow:'0 1px 3px rgba(0,0,0,0.04),0 8px 32px rgba(0,0,0,0.06)', animation:'fadeUp 0.5s ease-out 0.1s both' }}>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#555', marginBottom:6 }}>Nom complet</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Jean Dupont" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}/>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#555', marginBottom:6 }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vous@restaurant.fr" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur}/>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#555', marginBottom:6 }}>Mot de passe</label>
            <div style={{ position:'relative' }}>
              <input type={showPw?'text':'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="6 caracteres minimum" style={{...inputStyle,paddingRight:44}} onFocus={handleFocus} onBlur={handleBlur}/>
              <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:4, color:'#aaa' }}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d={showPw?"M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24":"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"} transform="scale(0.75)"/>{showPw&&<line x1="0.75" y1="0.75" x2="17.25" y2="17.25"/>}{!showPw&&<circle cx="9" cy="9" r="2.25"/>}</svg>
              </button>
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#555', marginBottom:6 }}>Code parrainage <span style={{ color:'#aaa', fontWeight:400 }}>(optionnel)</span></label>
            <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} placeholder="ex: LOUIS42" style={{...inputStyle, letterSpacing:'0.05em'}} onFocus={handleFocus} onBlur={handleBlur}/>
          </div>
          {error && <div style={{ background:'#fef2f2', color:'#b91c1c', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:16 }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ width:'100%', padding:'14px 0', borderRadius:14, border:'none', background:loading?'#93a3b8':'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', fontSize:15, fontWeight:600, fontFamily:'"Outfit",system-ui', cursor:loading?'wait':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:loading?'none':'0 4px 16px rgba(37,99,235,0.3)', transition:'background 0.2s,transform 0.1s', letterSpacing:'-0.01em' }} onMouseDown={(e) => {if(!loading)(e.target as HTMLElement).style.transform='scale(0.98)'}} onMouseUp={(e) => (e.target as HTMLElement).style.transform='scale(1)'}>
            {loading?<div style={{ width:18, height:18, border:'2px solid #fff', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>:'Creer mon compte'}
          </button>
        </form>
        <div style={{ display:'flex', justifyContent:'center', gap:24, marginTop:24, animation:'fadeUp 0.5s ease-out 0.2s both' }}>
          {[{icon:'5min',label:'Installation rapide'},{icon:'NFC',label:'QR & NFC inclus'},{icon:'IA',label:'Reponses IA'}].map((f) => (
            <div key={f.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'#2563eb', fontFamily:'"Outfit",system-ui', marginBottom:2 }}>{f.icon}</div>
              <div style={{ fontSize:11, color:'#999' }}>{f.label}</div>
            </div>
          ))}
        </div>
        <p style={{ textAlign:'center', fontSize:14, color:'#888', marginTop:20, animation:'fadeUp 0.5s ease-out 0.25s both' }}>Deja un compte ? <Link to="/login" style={{ color:'#2563eb', fontWeight:600, textDecoration:'none' }}>Se connecter</Link></p>
        <p style={{ textAlign:'center', fontSize:11, color:'#c0c0b8', marginTop:32, letterSpacing:'0.02em' }}>StarPulse — Gerez vos avis, boostez votre reputation.</p>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}*{margin:0;padding:0;box-sizing:border-box}input::placeholder{color:#bbb}`}</style>
    </div>
  )
}
