import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError(err.message); setLoading(false); return }
    setDone(true); setLoading(false)
    setTimeout(() => navigate('/dashboard'), 2000)
  }

  const inputStyle = { width:'100%', border:'1.5px solid #e8e8e4', borderRadius:12, padding:'13px 14px', fontSize:14, fontFamily:'"DM Sans",system-ui', color:'#1a1a18', background:'#fafaf8', outline:'none', transition:'border-color 0.2s,box-shadow 0.2s' }

  return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'radial-gradient(ellipse at 50% 0%,rgba(37,99,235,0.04) 0%,#fafaf8 60%)', padding:'32px 20px', fontFamily:'"DM Sans",system-ui,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:36, animation:'fadeUp 0.5s ease-out' }}>
          <div style={{ width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 4px 20px rgba(37,99,235,0.25)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          </div>
          <h1 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:26, color:'#1a1a18', margin:'0 0 6px', letterSpacing:'-0.03em' }}>Nouveau mot de passe</h1>
          <p style={{ fontSize:14, color:'#888', margin:0 }}>Choisissez votre nouveau mot de passe</p>
        </div>

        {done ? (
          <div style={{ background:'#fff', borderRadius:20, padding:'28px 24px', boxShadow:'0 1px 3px rgba(0,0,0,0.04),0 8px 32px rgba(0,0,0,0.06)', animation:'fadeUp 0.5s ease-out 0.1s both', textAlign:'center' }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:18, color:'#1a1a18', margin:'0 0 8px' }}>Mot de passe modifié !</h2>
            <p style={{ fontSize:14, color:'#888', margin:0 }}>Redirection vers votre dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleUpdate} style={{ background:'#fff', borderRadius:20, padding:'28px 24px', boxShadow:'0 1px 3px rgba(0,0,0,0.04),0 8px 32px rgba(0,0,0,0.06)', animation:'fadeUp 0.5s ease-out 0.1s both' }}>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#555', marginBottom:6 }}>Nouveau mot de passe</label>
              <div style={{ position:'relative' }}>
                <input type={showPw?'text':'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Minimum 6 caractères" style={{...inputStyle,paddingRight:44}}
                  onFocus={(e) => {e.target.style.borderColor='#2563eb';e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.08)'}}
                  onBlur={(e) => {e.target.style.borderColor='#e8e8e4';e.target.style.boxShadow='none'}}/>
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', padding:4, color:'#aaa' }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" viewBox="0 0 24 24"><path d={showPw?"M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24":"M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"}/>{showPw&&<line x1="1" y1="1" x2="23" y2="23"/>}{!showPw&&<circle cx="12" cy="12" r="3"/>}</svg>
                </button>
              </div>
            </div>
            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#555', marginBottom:6 }}>Confirmer le mot de passe</label>
              <input type={showPw?'text':'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} required placeholder="Confirmez votre mot de passe" style={inputStyle}
                onFocus={(e) => {e.target.style.borderColor='#2563eb';e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.08)'}}
                onBlur={(e) => {e.target.style.borderColor='#e8e8e4';e.target.style.boxShadow='none'}}/>
            </div>
            {error && <div style={{ background:'#fef2f2', color:'#b91c1c', fontSize:13, padding:'10px 14px', borderRadius:10, marginBottom:16 }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ width:'100%', padding:'14px 0', borderRadius:14, border:'none', background:loading?'#93a3b8':'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', fontSize:15, fontWeight:600, fontFamily:'"Outfit",system-ui', cursor:loading?'wait':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:loading?'none':'0 4px 16px rgba(37,99,235,0.3)', transition:'background 0.2s,transform 0.1s', letterSpacing:'-0.01em' }}
              onMouseDown={(e) => {if(!loading)(e.target as HTMLElement).style.transform='scale(0.98)'}}
              onMouseUp={(e) => (e.target as HTMLElement).style.transform='scale(1)'}>
              {loading?<div style={{ width:18, height:18, border:'2px solid #fff', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>:'Changer le mot de passe'}
            </button>
          </form>
        )}

        <p style={{ textAlign:'center', fontSize:11, color:'#c0c0b8', marginTop:40, letterSpacing:'0.02em' }}>StarPulse · Gérez vos avis, boostez votre réputation.</p>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}*{margin:0;padding:0;box-sizing:border-box}input::placeholder{color:#bbb}`}</style>
    </div>
  )
}
