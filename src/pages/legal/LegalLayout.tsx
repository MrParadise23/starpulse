import { Link } from 'react-router-dom'

interface Props {
  title: string
  lastUpdated: string
  children: React.ReactNode
}

export default function LegalLayout({ title, lastUpdated, children }: Props) {
  return (
    <div style={{ fontFamily:'"DM Sans",system-ui,sans-serif', color:'#1a1a18', background:'#fafaf8', minHeight:'100vh' }}>
      <nav style={{ position:'sticky', top:0, zIndex:50, background:'rgba(250,250,248,0.85)', backdropFilter:'blur(12px)', borderBottom:'1px solid #f0f0ec' }}>
        <div style={{ maxWidth:1080, margin:'0 auto', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <span style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:18, letterSpacing:'-0.02em', color:'#1a1a18' }}>StarPulse</span>
          </Link>
          <Link to="/" style={{ fontSize:14, fontWeight:500, color:'#666', textDecoration:'none', padding:'8px 16px', borderRadius:10 }}>Retour à l'accueil</Link>
        </div>
      </nav>
      <main style={{ maxWidth:720, margin:'0 auto', padding:'48px 24px 80px' }}>
        <h1 style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:'clamp(24px, 4vw, 36px)', letterSpacing:'-0.03em', lineHeight:1.2, margin:'0 0 8px' }}>{title}</h1>
        <p style={{ fontSize:13, color:'#999', margin:'0 0 32px' }}>Dernière mise à jour : {lastUpdated}</p>
        <div style={{ fontSize:15, lineHeight:1.8, color:'#444' }}>
          {children}
        </div>
      </main>
      <footer style={{ borderTop:'1px solid #f0f0ec', padding:'24px' }}>
        <div style={{ maxWidth:720, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <p style={{ fontSize:12, color:'#bbb' }}>&copy; 2026 StarPulse. Tous droits réservés.</p>
          <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
            <Link to="/mentions-legales" style={{ fontSize:12, color:'#aaa', textDecoration:'none' }}>Mentions légales</Link>
            <Link to="/cgv" style={{ fontSize:12, color:'#aaa', textDecoration:'none' }}>CGV</Link>
            <Link to="/cgu" style={{ fontSize:12, color:'#aaa', textDecoration:'none' }}>CGU</Link>
            <Link to="/confidentialite" style={{ fontSize:12, color:'#aaa', textDecoration:'none' }}>Confidentialité</Link>
            <Link to="/cookies" style={{ fontSize:12, color:'#aaa', textDecoration:'none' }}>Cookies</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
