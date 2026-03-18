import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div style={{ fontFamily:'"DM Sans",system-ui,sans-serif', color:'#1a1a18', background:'#fafaf8' }}>

      {/* NAV */}
      <nav style={{ position:'sticky', top:0, zIndex:50, background:'rgba(250,250,248,0.85)', backdropFilter:'blur(12px)', borderBottom:'1px solid #f0f0ec' }}>
        <div style={{ maxWidth:1080, margin:'0 auto', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <span style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:18, letterSpacing:'-0.02em' }}>StarPulse</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <Link to="/login" style={{ fontSize:14, fontWeight:500, color:'#666', textDecoration:'none', padding:'8px 16px', borderRadius:10, transition:'color 0.15s' }}>Connexion</Link>
            <Link to="/register" style={{ fontSize:14, fontWeight:600, color:'#fff', textDecoration:'none', padding:'9px 20px', borderRadius:10, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow:'0 2px 8px rgba(37,99,235,0.25)', transition:'transform 0.1s', fontFamily:'"Outfit",system-ui' }}>Commencer</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ maxWidth:1080, margin:'0 auto', padding:'80px 24px 60px', textAlign:'center' }}>
        <div style={{ animation:'fadeUp 0.6s ease-out' }}>
          <div style={{ display:'inline-block', padding:'6px 16px', borderRadius:20, background:'rgba(37,99,235,0.06)', fontSize:13, fontWeight:500, color:'#2563eb', marginBottom:24 }}>
            La solution #1 de gestion d'avis pour les commerces
          </div>
          <h1 style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:'clamp(32px, 5vw, 52px)', lineHeight:1.1, letterSpacing:'-0.03em', margin:'0 0 20px', maxWidth:700, marginLeft:'auto', marginRight:'auto' }}>
            Transformez chaque client en <span style={{ color:'#2563eb' }}>ambassadeur</span>
          </h1>
          <p style={{ fontSize:17, color:'#777', lineHeight:1.7, maxWidth:540, margin:'0 auto 36px' }}>
            Collectez des avis 5 etoiles, interceptez les clients insatisfaits avant qu'ils ne publient, et repondez a tous vos avis avec l'IA.
          </p>
          <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
            <Link to="/register" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'15px 32px', borderRadius:14, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', fontSize:16, fontWeight:600, fontFamily:'"Outfit",system-ui', textDecoration:'none', boxShadow:'0 4px 20px rgba(37,99,235,0.3)', transition:'transform 0.1s', letterSpacing:'-0.01em' }}>
              Essayer gratuitement
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" transform="scale(0.67)"/></svg>
            </Link>
            <a href="#fonctionnement" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'15px 28px', borderRadius:14, border:'1.5px solid #e8e8e4', background:'#fff', color:'#555', fontSize:15, fontWeight:500, textDecoration:'none', transition:'all 0.15s' }}>
              Decouvrir le fonctionnement
            </a>
          </div>
          <p style={{ fontSize:13, color:'#bbb', marginTop:16 }}>Aucune carte bancaire requise</p>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={{ maxWidth:1080, margin:'0 auto', padding:'0 24px 60px' }}>
        <div style={{ display:'flex', justifyContent:'center', gap:40, flexWrap:'wrap', opacity:0.5 }}>
          {['Restaurants','Hotels','Salons','Boutiques','Cafes'].map(t => (
            <span key={t} style={{ fontSize:14, fontWeight:500, color:'#999', letterSpacing:'0.05em', textTransform:'uppercase' as const }}>{t}</span>
          ))}
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <section id="fonctionnement" style={{ maxWidth:1080, margin:'0 auto', padding:'60px 24px 80px' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:32, letterSpacing:'-0.02em', margin:'0 0 12px' }}>Comment ca marche ?</h2>
          <p style={{ fontSize:15, color:'#888', margin:0 }}>3 etapes simples pour booster votre reputation en ligne</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:20 }}>
          {[
            { step:'1', title:'Le client scanne', desc:'Un QR code sur table ou un tag NFC. En une seconde, il accede a votre page d\'avis.', color:'#2563eb' },
            { step:'2', title:'Le smart routing decide', desc:'Satisfait ? Redirige vers Google pour un avis 5 etoiles. Insatisfait ? Formulaire prive, jamais publie.', color:'#059669' },
            { step:'3', title:'L\'IA vous repond', desc:'StarPulse genere des reponses personnalisees a chaque avis Google, dans votre ton de voix.', color:'#7c3aed' },
          ].map(item => (
            <div key={item.step} style={{ background:'#fff', borderRadius:20, padding:'28px 24px', border:'1px solid #f0f0ec', transition:'border-color 0.2s, box-shadow 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget).style.borderColor='#ddd'; (e.currentTarget).style.boxShadow='0 4px 16px rgba(0,0,0,0.04)' }}
              onMouseLeave={(e) => { (e.currentTarget).style.borderColor='#f0f0ec'; (e.currentTarget).style.boxShadow='none' }}>
              <div style={{ width:40, height:40, borderRadius:12, background:`${item.color}10`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                <span style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:18, color:item.color }}>{item.step}</span>
              </div>
              <h3 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:18, margin:'0 0 8px' }}>{item.title}</h3>
              <p style={{ fontSize:14, color:'#777', lineHeight:1.6, margin:0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ background:'#fff', borderTop:'1px solid #f0f0ec', borderBottom:'1px solid #f0f0ec' }}>
        <div style={{ maxWidth:1080, margin:'0 auto', padding:'80px 24px' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:32, letterSpacing:'-0.02em', margin:'0 0 12px' }}>Tout ce qu'il faut pour briller</h2>
            <p style={{ fontSize:15, color:'#888', margin:0 }}>Un outil complet pour gerer votre e-reputation</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:16 }}>
            {[
              { title:'Smart routing intelligent', desc:'Redirigez les clients satisfaits vers Google et interceptez les mecontents en prive.', icon:'route' },
              { title:'QR codes & tags NFC', desc:'Generez des QR codes et encodez vos tags NFC en quelques clics. Zero friction.', icon:'qr' },
              { title:'Reponses IA personnalisees', desc:'L\'IA repond a vos avis dans votre style. Modifiez avant de publier.', icon:'ai' },
              { title:'Dashboard en temps reel', desc:'Suivez vos scans, taux de satisfaction, et avis en attente d\'un coup d\'oeil.', icon:'dash' },
              { title:'Retours prives', desc:'Les clients insatisfaits vous ecrivent en prive. Recontactez-les, reglez le probleme.', icon:'msg' },
              { title:'Programme d\'affiliation', desc:'Recommandez StarPulse et touchez 20% de commission pendant 24 mois.', icon:'aff' },
            ].map(f => (
              <div key={f.title} style={{ padding:'24px 20px', borderRadius:16, border:'1px solid #f0f0ec', background:'#fafaf8' }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'rgba(37,99,235,0.06)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </div>
                <h4 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:15, margin:'0 0 6px' }}>{f.title}</h4>
                <p style={{ fontSize:13, color:'#888', lineHeight:1.6, margin:0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ maxWidth:1080, margin:'0 auto', padding:'80px 24px' }}>
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:32, letterSpacing:'-0.02em', margin:'0 0 12px' }}>Un prix simple, sans surprise</h2>
          <p style={{ fontSize:15, color:'#888', margin:0 }}>Tout inclus. Pas de frais caches. Annulez quand vous voulez.</p>
        </div>
        <div style={{ maxWidth:400, margin:'0 auto' }}>
          <div style={{ background:'#fff', borderRadius:24, border:'2px solid #2563eb', padding:'36px 32px', textAlign:'center', boxShadow:'0 8px 32px rgba(37,99,235,0.1)' }}>
            <div style={{ display:'inline-block', padding:'4px 14px', borderRadius:16, background:'rgba(37,99,235,0.06)', fontSize:12, fontWeight:600, color:'#2563eb', marginBottom:16, fontFamily:'"Outfit",system-ui' }}>RECOMMANDE</div>
            <h3 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:20, margin:'0 0 16px' }}>StarPulse Pro</h3>
            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'center', gap:4, marginBottom:8 }}>
              <span style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:48, letterSpacing:'-0.03em' }}>29</span>
              <span style={{ fontSize:18, fontWeight:600, color:'#888' }}>EUR/mois</span>
            </div>
            <p style={{ fontSize:13, color:'#aaa', marginBottom:28 }}>par etablissement</p>
            <div style={{ textAlign:'left', marginBottom:28 }}>
              {[
                'Smart routing illimite',
                'QR codes & NFC illimites',
                'Reponses IA generees par OpenAI',
                'Dashboard temps reel',
                'Retours prives + recontact',
                'Programme affiliation 20%',
                'Support prioritaire',
              ].map(f => (
                <div key={f} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #f5f5f0' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  <span style={{ fontSize:14, color:'#555' }}>{f}</span>
                </div>
              ))}
            </div>
            <Link to="/register" style={{ display:'block', padding:'15px 0', borderRadius:14, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', fontSize:16, fontWeight:600, fontFamily:'"Outfit",system-ui', textDecoration:'none', textAlign:'center', boxShadow:'0 4px 16px rgba(37,99,235,0.3)', letterSpacing:'-0.01em' }}>
              Commencer maintenant
            </Link>
            <p style={{ fontSize:12, color:'#bbb', marginTop:12 }}>Essai gratuit inclus. Sans engagement.</p>
          </div>
        </div>
      </section>

      {/* TEMOIGNAGES */}
      <section style={{ background:'#fff', borderTop:'1px solid #f0f0ec', borderBottom:'1px solid #f0f0ec' }}>
        <div style={{ maxWidth:1080, margin:'0 auto', padding:'80px 24px' }}>
          <div style={{ textAlign:'center', marginBottom:48 }}>
            <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:32, letterSpacing:'-0.02em', margin:'0 0 12px' }}>Ils nous font confiance</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:20 }}>
            {[
              { name:'Thomas R.', role:'Restaurant Le Comptoir', text:'En 2 semaines, on est passe de 3.8 a 4.4 sur Google. Le smart routing change tout.', stars:5 },
              { name:'Julie M.', role:'Salon Beaute Pure', text:'Les clients mecontents nous ecrivent en prive au lieu de publier. Ca nous sauve la mise.', stars:5 },
              { name:'Marc D.', role:'Hotel du Lac', text:'Les reponses IA sont bluffantes. On gagne 2h par semaine sur la gestion des avis.', stars:5 },
            ].map(t => (
              <div key={t.name} style={{ background:'#fafaf8', borderRadius:20, padding:'24px', border:'1px solid #f0f0ec' }}>
                <div style={{ display:'flex', gap:2, marginBottom:12 }}>
                  {[1,2,3,4,5].map(s => <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill={s<=t.stars?'#FBBF24':'none'} stroke={s<=t.stars?'#F59E0B':'#D1D5DB'} strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
                </div>
                <p style={{ fontSize:14, color:'#555', lineHeight:1.6, margin:'0 0 16px' }}>"{t.text}"</p>
                <div>
                  <p style={{ fontSize:14, fontWeight:600, color:'#1a1a18', margin:'0 0 2px' }}>{t.name}</p>
                  <p style={{ fontSize:12, color:'#999', margin:0 }}>{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section style={{ maxWidth:1080, margin:'0 auto', padding:'80px 24px', textAlign:'center' }}>
        <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:32, letterSpacing:'-0.02em', margin:'0 0 12px' }}>Pret a booster vos avis ?</h2>
        <p style={{ fontSize:15, color:'#888', margin:'0 0 32px' }}>Rejoignez des centaines de commercants qui font confiance a StarPulse.</p>
        <Link to="/register" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'16px 36px', borderRadius:14, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', fontSize:16, fontWeight:600, fontFamily:'"Outfit",system-ui', textDecoration:'none', boxShadow:'0 4px 20px rgba(37,99,235,0.3)', letterSpacing:'-0.01em' }}>
          Commencer gratuitement
        </Link>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:'1px solid #f0f0ec', padding:'32px 24px' }}>
        <div style={{ maxWidth:1080, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:24, height:24, borderRadius:6, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <span style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:14, color:'#888' }}>StarPulse</span>
          </div>
          <p style={{ fontSize:12, color:'#bbb' }}>2026 StarPulse. Tous droits reserves.</p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        *{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth}
      `}</style>
    </div>
  )
}
