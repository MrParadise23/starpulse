import { Link } from 'react-router-dom'
import { useState } from 'react'

export default function LandingPage() {
  const [yearly, setYearly] = useState(false)
  return (
    <div style={{ fontFamily:'"DM Sans",system-ui,sans-serif', color:'#1a1a18', background:'#fafaf8' }}>

      {/* NAV */}
      <nav style={{ position:'sticky', top:0, zIndex:50, background:'rgba(250,250,248,0.85)', backdropFilter:'blur(12px)', borderBottom:'1px solid #f0f0ec' }}>
        <div className="nav-inner" style={{ maxWidth:1080, margin:'0 auto', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <span className="nav-brand" style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:18, letterSpacing:'-0.02em' }}>StarPulse</span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
            <a href="#pricing" className="nav-link-hide" style={{ fontSize:14, fontWeight:500, color:'#666', textDecoration:'none', padding:'8px 12px', borderRadius:10 }}>Tarifs</a>
            <Link to="/login" className="nav-link-hide" style={{ fontSize:14, fontWeight:500, color:'#666', textDecoration:'none', padding:'8px 12px', borderRadius:10, transition:'color 0.15s' }}>Connexion</Link>
            <Link to="/register" style={{ fontSize:13, fontWeight:600, color:'#fff', textDecoration:'none', padding:'9px 14px', borderRadius:10, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow:'0 2px 8px rgba(37,99,235,0.25)', transition:'transform 0.1s', fontFamily:'"Outfit",system-ui', whiteSpace:'nowrap' }}>Commencer</Link>
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
            Collectez des avis 5 étoiles, interceptez les clients insatisfaits avant qu'ils ne publient, et répondez à tous vos avis avec l'IA.
          </p>
          <div style={{ display:'flex', justifyContent:'center', gap:12, flexWrap:'wrap' }}>
            <Link to="/register" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'15px 32px', borderRadius:14, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', fontSize:16, fontWeight:600, fontFamily:'"Outfit",system-ui', textDecoration:'none', boxShadow:'0 4px 20px rgba(37,99,235,0.3)', transition:'transform 0.1s', letterSpacing:'-0.01em' }}>
              Essayer gratuitement
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" transform="scale(0.67)"/></svg>
            </Link>
            <a href="#fonctionnement" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'15px 28px', borderRadius:14, border:'1.5px solid #e8e8e4', background:'#fff', color:'#555', fontSize:15, fontWeight:500, textDecoration:'none', transition:'all 0.15s' }}>
              Découvrir le fonctionnement
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
          <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:32, letterSpacing:'-0.02em', margin:'0 0 12px' }}>Comment ça marche ?</h2>
          <p style={{ fontSize:15, color:'#888', margin:0 }}>3 étapes simples pour booster votre réputation en ligne</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:20 }}>
          {[
            { step:'1', title:'Le client scanne', desc:'Un QR code sur table ou un tag NFC. En une seconde, il accède à votre page d\'avis.', color:'#2563eb' },
            { step:'2', title:'Le smart routing décide', desc:'Satisfait ? Redirigé vers Google pour un avis 5 étoiles. Insatisfait ? Formulaire privé, jamais publié.', color:'#059669' },
            { step:'3', title:'L\'IA vous répond', desc:'StarPulse génère des réponses personnalisées à chaque avis Google, dans votre ton de voix.', color:'#7c3aed' },
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
            <p style={{ fontSize:15, color:'#888', margin:0 }}>Un outil complet pour gérer votre e-réputation</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))', gap:16 }}>
            {[
              { title:'Smart routing intelligent', desc:'Redirigez les clients satisfaits vers Google et interceptez les mécontents en privé.', icon:'route' },
              { title:'QR codes & tags NFC', desc:'Générez des QR codes et encodez vos tags NFC en quelques clics. Zéro friction.', icon:'qr' },
              { title:'Réponses IA personnalisées', desc:'L\'IA répond à vos avis dans votre style. Modifiez avant de publier.', icon:'ai' },
              { title:'Dashboard en temps réel', desc:'Suivez vos scans, taux de satisfaction, et avis en attente d\'un coup d\'œil.', icon:'dash' },
              { title:'Retours privés', desc:'Les clients insatisfaits vous écrivent en privé. Recontactez-les, réglez le problème.', icon:'msg' },
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
      <section id="pricing" style={{ maxWidth:1080, margin:'0 auto', padding:'80px 24px' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:32, letterSpacing:'-0.02em', margin:'0 0 12px' }}>Un prix simple, sans surprise</h2>
          <p style={{ fontSize:15, color:'#888', margin:'0 0 28px' }}>Tout inclus. Pas de frais cachés. Essai gratuit 7 jours. Annulez quand vous voulez.</p>

          {/* Toggle */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:0, background:'#f0f0ec', borderRadius:14, padding:4 }}>
            <button onClick={() => setYearly(false)}
              style={{ padding:'10px 24px', borderRadius:11, border:'none', fontSize:14, fontWeight:600, fontFamily:'"Outfit",system-ui', cursor:'pointer', transition:'all 0.2s', background: !yearly?'#fff':'transparent', color: !yearly?'#1a1a18':'#888', boxShadow: !yearly?'0 2px 8px rgba(0,0,0,0.06)':'none' }}>
              Mensuel
            </button>
            <button onClick={() => setYearly(true)}
              style={{ padding:'10px 24px', borderRadius:11, border:'none', fontSize:14, fontWeight:600, fontFamily:'"Outfit",system-ui', cursor:'pointer', transition:'all 0.2s', background: yearly?'#fff':'transparent', color: yearly?'#1a1a18':'#888', boxShadow: yearly?'0 2px 8px rgba(0,0,0,0.06)':'none' }}>
              Annuel
              <span style={{ display:'inline-block', marginLeft:6, padding:'2px 8px', borderRadius:6, background:'#dcfce7', color:'#16a34a', fontSize:11, fontWeight:700 }}>-28%</span>
            </button>
          </div>
        </div>

        <div style={{ maxWidth:420, margin:'0 auto' }}>
          <div style={{ background:'#fff', borderRadius:24, border:'2px solid #2563eb', padding:'36px 32px', textAlign:'center', boxShadow:'0 8px 32px rgba(37,99,235,0.1)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(37,99,235,0.03)', pointerEvents:'none' }}/>
            <div style={{ position:'relative' }}>
              <div style={{ display:'inline-block', padding:'4px 14px', borderRadius:16, background:'rgba(37,99,235,0.06)', fontSize:12, fontWeight:600, color:'#2563eb', marginBottom:16, fontFamily:'"Outfit",system-ui' }}>{yearly ? 'MEILLEURE OFFRE' : 'RECOMMANDE'}</div>
              <h3 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:20, margin:'0 0 16px' }}>StarPulse Pro</h3>
              <div style={{ display:'flex', alignItems:'baseline', justifyContent:'center', gap:4, marginBottom:4 }}>
                <span style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:52, letterSpacing:'-0.04em', lineHeight:1 }}>{yearly ? '249' : '29'}</span>
                <span style={{ fontSize:18, fontWeight:600, color:'#888' }}>EUR{yearly ? '/an' : '/mois'}</span>
              </div>
              {yearly && <p style={{ fontSize:13, color:'#16a34a', fontWeight:500, marginBottom:4 }}>soit ~20,75 EUR/mois au lieu de 29 EUR</p>}
              <p style={{ fontSize:13, color:'#aaa', marginBottom:28 }}>par établissement</p>
              <div style={{ textAlign:'left', marginBottom:28 }}>
                {[
                  'Smart routing illimité (NFC + QR)',
                  'QR codes illimités',
                  'Réponses IA (OpenAI GPT-4)',
                  'Dashboard temps réel',
                  'Retours privés + recontact client',
                  'Programme affiliation 20%',
                  'Essai gratuit 7 jours',
                  ...(yearly ? ['1 tag NFC offert avec votre abonnement'] : []),
                  'Support prioritaire',
                ].map((f, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid #f5f5f0' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={f.includes('offert') ? '#2563eb' : '#059669'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    <span style={{ fontSize:14, color:'#555', fontWeight: f.includes('offert') ? 600 : 400 }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link to="/register" style={{ display:'block', padding:'15px 0', borderRadius:14, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', fontSize:16, fontWeight:600, fontFamily:'"Outfit",system-ui', textDecoration:'none', textAlign:'center', boxShadow:'0 4px 16px rgba(37,99,235,0.3)', letterSpacing:'-0.01em' }}>
                Commencer l'essai gratuit
              </Link>
              <p style={{ fontSize:12, color:'#bbb', marginTop:12 }}>Aucune carte bancaire requise à l'inscription.</p>
            </div>
          </div>
        </div>

        {/* NFC Tags */}
        <div style={{ textAlign:'center', marginTop:56, marginBottom:24 }}>
          <h3 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:22, letterSpacing:'-0.02em', margin:'0 0 8px' }}>Tags NFC</h3>
          <p style={{ fontSize:14, color:'#888', margin:0 }}>Pré-encodés, prêts à coller. Livraison en 3-5 jours.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(155px, 1fr))', gap:12, maxWidth:700, margin:'0 auto' }}>
          {[
            { label:'1 tag', price:'24.90', unit:'' },
            { label:'3 tags', price:'59', unit:'19.67' },
            { label:'5 tags', price:'89', unit:'17.80' },
            { label:'10 tags', price:'149', unit:'14.90', pop:true },
            { label:'25 tags', price:'299', unit:'11.96' },
          ].map((p, i) => (
            <div key={i} style={{ background:'#fff', borderRadius:16, padding:'18px 14px', textAlign:'center', border: p.pop ? '2px solid #2563eb' : '1px solid #f0f0ec', position:'relative' }}>
              {p.pop && <div style={{ position:'absolute', top:-9, left:'50%', transform:'translateX(-50%)', padding:'2px 10px', borderRadius:6, background:'#2563eb', color:'#fff', fontSize:10, fontWeight:700, fontFamily:'"Outfit",system-ui' }}>POPULAIRE</div>}
              <div style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:13, color:'#1a1a18', marginBottom:4 }}>{p.label}</div>
              <div style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:26, color:'#1a1a18', letterSpacing:'-0.03em' }}>{p.price}<span style={{ fontSize:13, fontWeight:500, color:'#888' }}>EUR</span></div>
              {p.unit && <p style={{ fontSize:11, color:'#16a34a', fontWeight:500, margin:'2px 0 0' }}>{p.unit} EUR/tag</p>}
            </div>
          ))}
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
              { name:'Thomas R.', role:'Restaurant Le Comptoir', text:'En 2 semaines, on est passé de 3.8 à 4.4 sur Google. Le smart routing change tout.', stars:5 },
              { name:'Julie M.', role:'Salon Beauté Pure', text:'Les clients mécontents nous écrivent en privé au lieu de publier. Ça nous sauve la mise.', stars:5 },
              { name:'Marc D.', role:'Hôtel du Lac', text:'Les réponses IA sont bluffantes. On gagne 2h par semaine sur la gestion des avis.', stars:5 },
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
        <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:32, letterSpacing:'-0.02em', margin:'0 0 12px' }}>Prêt à booster vos avis ?</h2>
        <p style={{ fontSize:15, color:'#888', margin:'0 0 32px' }}>Rejoignez des centaines de commerçants qui font confiance à StarPulse.</p>
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
        @media(max-width:640px){.nav-link-hide{display:none !important;}.nav-inner{padding:14px 12px !important;}}
        @media(max-width:380px){.nav-brand{font-size:15px !important;}}
      `}</style>
    </div>
  )
}
