import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleReset(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setError('')
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (err) { setError(err.message); setLoading(false); return }
    setSent(true); setLoading(false)
  }

  const inputStyle = { width:'100%', border:'1.5px solid #e8e8e4', borderRadius:12, padding:'13px 14px', fontSize:16, fontFamily:'"DM Sans",system-ui', color:'#1a1a18', background:'#fafaf8', outline:'none', transition:'border-color 0.2s,box-shadow 0.2s' }

  return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'radial-gradient(ellipse at 50% 0%,rgba(37,99,235,0.04) 0%,#fafaf8 60%)', padding:'32px 20px', fontFamily:'"DM Sans",system-ui,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:36, animation:'fadeUp 0.5s ease-out' }}>
          <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 4px 20px rgba(37,99,235,0.25)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <h1 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:26, color:'#1a1a18', margin:'0 0 6px', letterSpacing:'-0.03em' }}>Mot de passe oublié</h1>
          <p style={{ fontSize:14, color:'#888', margin:0 }}>Entrez votre email pour recevoir un lien de réinitialisation</p>
        </div>

        {sent ? (
          <div style={{ background:'#fff', borderRadius:20, padding:'28px 24px', boxShadow:'0 1px 3px rgba(0,0,0,0.04),0 8px 32px rgba(0,0,0,0.06)', animation:'fadeUp 0.5s ease-out 0.1s both', textAlign:'center' }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:18, color:'#1a1a18', margin:'0 0 8px' }}>Email envoyé !</h2>
            <p style={{ fontSize:14, color:'#888', margin:'0 0 20px', lineHeight:1.5 }}>
              Un lien de réinitialisation a été envoyé à <strong style={{ color:'#1a1a18' }}>{email}</strong>. Vérifiez votre boîte de réception (et vos spams).
            </p>
            <Link to="/login" style={{ color:'#2563eb', fontWeight:600, fontSize:14, textDecoration:'none' }}>Retour à la connexion</Link>
          </div>
        ) : (
          <form onSubmit={handleReset} style={{ background:'#fff', borderRadius:20, padding:'28px 24px', boxShadow:'0 1px 3px rgba(0,0,0,0.04),0 8px 32px rgba(0,0,0,0.06)', animation:'fadeUp 0.5s ease-out 0.1s both' }}>
            <div style={{ marginBottom:20 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#555', marginBottom:6 }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vous@restaurant.fr" style={inputStyle}
                onFocus={(e) => {e.target.style.borderColor='#2563eb';e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.08)'}}
                onBlur={(e) => {e.target.style.borderColor='#e8e8e4';e.target.style.boxShadow='none'}}/>
            </div>
            {error && <div style={{ background:'#fef2f2', color:'#b91c1c', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:16 }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ width:'100%', padding:'14px 0', borderRadius:14, border:'none', background:loading?'#93a3b8':'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', fontSize:15, fontWeight:600, fontFamily:'"Outfit",system-ui', cursor:loading?'wait':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:loading?'none':'0 4px 16px rgba(37,99,235,0.3)', transition:'background 0.2s,transform 0.1s', letterSpacing:'-0.01em' }}
              onMouseDown={(e) => {if(!loading)(e.target as HTMLElement).style.transform='scale(0.98)'}}
              onMouseUp={(e) => (e.target as HTMLElement).style.transform='scale(1)'}>
              {loading?<div style={{ width:18, height:18, border:'2px solid #fff', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>:'Envoyer le lien'}
            </button>
          </form>
        )}

        <p style={{ textAlign:'center', fontSize:14, color:'#888', marginTop:24, animation:'fadeUp 0.5s ease-out 0.2s both' }}>
          <Link to="/login" style={{ color:'#2563eb', fontWeight:600, textDecoration:'none' }}>Retour à la connexion</Link>
        </p>
        <p style={{ textAlign:'center', fontSize:11, color:'#c0c0b8', marginTop:40, letterSpacing:'0.02em' }}>StarPulse · Gérez vos avis, boostez votre réputation.</p>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}*{margin:0;padding:0;box-sizing:border-box}input::placeholder{color:#bbb}`}</style>
    </div>
  )
}
