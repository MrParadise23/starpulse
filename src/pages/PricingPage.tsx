import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'

const PRICE_MONTHLY = 'price_1TCJcSLMRsVfhf6RykLYqoSx'
const PRICE_YEARLY = 'price_1TCJdCLMRsVfhf6RCBzCAUP3'

const NFC_PACKS = [
  { type: 'single', label: '1 tag', qty: 1, price: 24.90 },
  { type: 'pack3', label: '3 tags', qty: 3, price: 59, unitPrice: '19.67' },
  { type: 'pack5', label: '5 tags', qty: 5, price: 89, unitPrice: '17.80' },
  { type: 'pack10', label: '10 tags', qty: 10, price: 149, unitPrice: '14.90', popular: true },
  { type: 'pack25', label: '25 tags', qty: 25, price: 299, unitPrice: '11.96' },
]

interface Props {
  session?: Session | null
  establishmentId?: string
  embedded?: boolean
}

export default function PricingPage({ session, establishmentId, embedded }: Props) {
  const navigate = useNavigate()
  const [yearly, setYearly] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nfcLoading, setNfcLoading] = useState<string | null>(null)

  async function handleSubscribe() {
    if (!session) {
      navigate('/register')
      return
    }

    if (!establishmentId) {
      alert("Veuillez d'abord créer votre établissement dans les Réglages.")
      navigate('/dashboard/settings')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          mode: 'subscription',
          price_id: yearly ? PRICE_YEARLY : PRICE_MONTHLY,
          plan_interval: yearly ? 'yearly' : 'monthly',
          establishment_id: establishmentId,
        }
      })
      if (error) throw error
      if (data?.url) window.location.href = data.url
    } catch (err: any) {
      alert("Erreur : " + (err.message || "Impossible de créer la session de paiement"))
    }
    setLoading(false)
  }

  async function handleNfcOrder(pack: typeof NFC_PACKS[0]) {
    if (!session) {
      navigate('/register')
      return
    }

    setNfcLoading(pack.type)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          mode: 'payment',
          pack_type: pack.type,
          quantity: pack.qty,
          unit_price: pack.price / pack.qty,
          total_price: pack.price,
          establishment_id: establishmentId || null,
        }
      })
      if (error) throw error
      if (data?.url) window.location.href = data.url
    } catch (err: any) {
      alert("Erreur : " + (err.message || "Impossible de créer la commande"))
    }
    setNfcLoading(null)
  }

  const content = (
    <div style={{ fontFamily:'"DM Sans",system-ui,sans-serif', color:'#1a1a18' }}>

      {/* SUBSCRIPTION PRICING */}
      <div style={{ textAlign:'center', marginBottom:48 }}>
        {!embedded && (
          <>
            <div style={{ display:'inline-block', padding:'6px 16px', borderRadius:20, background:'rgba(37,99,235,0.06)', fontSize:13, fontWeight:500, color:'#2563eb', marginBottom:20 }}>
              Tarification transparente
            </div>
            <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:'clamp(28px, 4vw, 40px)', lineHeight:1.15, letterSpacing:'-0.03em', margin:'0 0 12px' }}>
              Un prix simple,<br/>sans surprise
            </h2>
            <p style={{ fontSize:15, color:'#888', margin:'0 0 28px', maxWidth:480, marginLeft:'auto', marginRight:'auto' }}>
              Tout inclus. Pas de frais caches. Essai gratuit 14 jours. Annulez quand vous voulez.
            </p>
          </>
        )}

        {/* Toggle mensuel / annuel */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:0, background:'#f5f5f0', borderRadius:14, padding:4, marginBottom:32 }}>
          <button onClick={() => setYearly(false)}
            style={{
              padding:'10px 24px', borderRadius:11, border:'none', fontSize:14, fontWeight:600,
              fontFamily:'"Outfit",system-ui', cursor:'pointer', transition:'all 0.2s',
              background: !yearly ? '#fff' : 'transparent',
              color: !yearly ? '#1a1a18' : '#888',
              boxShadow: !yearly ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            }}>
            Mensuel
          </button>
          <button onClick={() => setYearly(true)}
            style={{
              padding:'10px 24px', borderRadius:11, border:'none', fontSize:14, fontWeight:600,
              fontFamily:'"Outfit",system-ui', cursor:'pointer', transition:'all 0.2s',
              background: yearly ? '#fff' : 'transparent',
              color: yearly ? '#1a1a18' : '#888',
              boxShadow: yearly ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
            }}>
            Annuel
            <span style={{ display:'inline-block', marginLeft:6, padding:'2px 8px', borderRadius:6, background:'#dcfce7', color:'#16a34a', fontSize:11, fontWeight:700 }}>-28%</span>
          </button>
        </div>
      </div>

      {/* PLAN CARD */}
      <div style={{ maxWidth:420, margin:'0 auto', marginBottom:64 }}>
        <div style={{
          background:'#fff', borderRadius:24, border: '2px solid #2563eb', padding:'36px 32px',
          textAlign:'center', position:'relative', overflow:'hidden',
          boxShadow:'0 8px 40px rgba(37,99,235,0.1)',
        }}>
          {/* Subtle gradient bg */}
          <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(37,99,235,0.03)', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', bottom:-40, left:-40, width:160, height:160, borderRadius:'50%', background:'rgba(37,99,235,0.02)', pointerEvents:'none' }}/>

          <div style={{ position:'relative' }}>
            <div style={{ display:'inline-block', padding:'4px 14px', borderRadius:16, background:'rgba(37,99,235,0.06)', fontSize:12, fontWeight:600, color:'#2563eb', marginBottom:16, fontFamily:'"Outfit",system-ui' }}>
              {yearly ? 'MEILLEURE OFFRE' : 'RECOMMANDE'}
            </div>
            <h3 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:20, margin:'0 0 20px' }}>StarPulse Pro</h3>

            <div style={{ display:'flex', alignItems:'baseline', justifyContent:'center', gap:4, marginBottom:4 }}>
              <span style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:52, letterSpacing:'-0.04em', lineHeight:1 }}>
                {yearly ? '249' : '29'}
              </span>
              <span style={{ fontSize:18, fontWeight:600, color:'#888' }}>EUR{yearly ? '/an' : '/mois'}</span>
            </div>
            {yearly && (
              <p style={{ fontSize:13, color:'#16a34a', fontWeight:500, marginBottom:4 }}>
                soit ~20,75 EUR/mois au lieu de 29 EUR
              </p>
            )}
            <p style={{ fontSize:13, color:'#aaa', marginBottom:24 }}>par etablissement</p>

            <div style={{ textAlign:'left', marginBottom:24 }}>
              {[
                'Smart routing illimite (NFC + QR)',
                'QR codes illimites',
                'Reponses IA (OpenAI GPT-4)',
                'Dashboard temps reel',
                'Retours prives + recontact client',
                'Programme affiliation 20%',
                'Essai gratuit 14 jours',
                ...(yearly ? ['1 tag NFC offert avec votre abonnement'] : []),
                'Support prioritaire',
              ].map((f, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom:'1px solid #f5f5f0' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={f.includes('offert') ? '#2563eb' : '#059669'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  <span style={{ fontSize:14, color:'#555', fontWeight: f.includes('offert') ? 600 : 400 }}>{f}</span>
                </div>
              ))}
            </div>

            <button onClick={handleSubscribe} disabled={loading}
              style={{
                display:'block', width:'100%', padding:'16px 0', borderRadius:14, border:'none',
                background: loading ? '#93a3b8' : 'linear-gradient(135deg,#2563eb,#1d4ed8)',
                color:'#fff', fontSize:16, fontWeight:600, fontFamily:'"Outfit",system-ui',
                cursor: loading ? 'wait' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(37,99,235,0.3)',
                transition:'all 0.15s', letterSpacing:'-0.01em',
              }}>
              {loading ? 'Redirection...' : session ? 'S\'abonner maintenant' : 'Commencer l\'essai gratuit'}
            </button>
            <p style={{ fontSize:12, color:'#bbb', marginTop:12 }}>
              {session ? 'Paiement securise par Stripe. Annulez a tout moment.' : 'Essai gratuit 14 jours. Aucune carte requise a l\'inscription.'}
            </p>
          </div>
        </div>
      </div>

      {/* NFC TAGS SHOP */}
      <div style={{ textAlign:'center', marginBottom:32 }}>
        <h3 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:24, letterSpacing:'-0.02em', margin:'0 0 8px' }}>
          Tags NFC
        </h3>
        <p style={{ fontSize:14, color:'#888', margin:'0 0 28px', maxWidth:420, marginLeft:'auto', marginRight:'auto' }}>
          Tags pre-encodes, prets a coller. Livraison en 3-5 jours ouvrés.
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(170px, 1fr))', gap:12, maxWidth:720, margin:'0 auto' }}>
        {NFC_PACKS.map((pack) => (
          <div key={pack.type} style={{
            background:'#fff', borderRadius:18, padding:'20px 16px', textAlign:'center',
            border: pack.popular ? '2px solid #2563eb' : '1px solid #f0f0ec',
            position:'relative', transition:'border-color 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={(e) => { if (!pack.popular) { (e.currentTarget).style.borderColor='#ddd'; (e.currentTarget).style.boxShadow='0 4px 16px rgba(0,0,0,0.04)' }}}
            onMouseLeave={(e) => { if (!pack.popular) { (e.currentTarget).style.borderColor='#f0f0ec'; (e.currentTarget).style.boxShadow='none' }}}>
            {pack.popular && (
              <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)', padding:'3px 12px', borderRadius:8, background:'#2563eb', color:'#fff', fontSize:10, fontWeight:700, fontFamily:'"Outfit",system-ui', whiteSpace:'nowrap' }}>
                POPULAIRE
              </div>
            )}
            <div style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:14, color:'#1a1a18', marginBottom:4 }}>
              {pack.label}
            </div>
            <div style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:28, color:'#1a1a18', letterSpacing:'-0.03em' }}>
              {pack.price.toFixed(0)}<span style={{ fontSize:14, fontWeight:500, color:'#888' }}>EUR</span>
            </div>
            {pack.unitPrice && (
              <p style={{ fontSize:11, color:'#16a34a', fontWeight:500, margin:'2px 0 12px' }}>
                {pack.unitPrice} EUR/tag
              </p>
            )}
            {!pack.unitPrice && <div style={{ height:12 }}/>}
            <button onClick={() => handleNfcOrder(pack)} disabled={nfcLoading === pack.type}
              style={{
                width:'100%', padding:'10px 0', borderRadius:10, border:'none',
                background: nfcLoading === pack.type ? '#e5e5e5' : pack.popular ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#f5f5f0',
                color: pack.popular ? '#fff' : '#555', fontSize:13, fontWeight:600,
                fontFamily:'"Outfit",system-ui', cursor: nfcLoading === pack.type ? 'wait' : 'pointer',
                transition:'all 0.15s',
              }}>
              {nfcLoading === pack.type ? '...' : 'Commander'}
            </button>
          </div>
        ))}
      </div>

      {/* Garantie */}
      <div style={{ textAlign:'center', marginTop:40, padding:'20px', background:'#f5f5f0', borderRadius:16, maxWidth:500, margin:'40px auto 0' }}>
        <p style={{ fontSize:13, color:'#666', lineHeight:1.6, margin:0 }}>
          <span style={{ fontWeight:600 }}>Garantie satisfait ou rembourse 30 jours.</span> Si StarPulse ne vous convient pas, on vous rembourse integralement. Sans condition.
        </p>
      </div>
    </div>
  )

  if (embedded) return content

  return (
    <div style={{ minHeight:'100vh', background:'#fafaf8' }}>
      {/* Nav */}
      <nav style={{ position:'sticky', top:0, zIndex:50, background:'rgba(250,250,248,0.85)', backdropFilter:'blur(12px)', borderBottom:'1px solid #f0f0ec' }}>
        <div style={{ maxWidth:1080, margin:'0 auto', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <span style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:18, letterSpacing:'-0.02em', color:'#1a1a18' }}>StarPulse</span>
          </Link>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <Link to="/login" style={{ fontSize:14, fontWeight:500, color:'#666', textDecoration:'none', padding:'8px 16px', borderRadius:10 }}>Connexion</Link>
            <Link to="/register" style={{ fontSize:14, fontWeight:600, color:'#fff', textDecoration:'none', padding:'9px 20px', borderRadius:10, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', boxShadow:'0 2px 8px rgba(37,99,235,0.25)', fontFamily:'"Outfit",system-ui' }}>Commencer</Link>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth:1080, margin:'0 auto', padding:'60px 24px 80px' }}>
        {content}
      </div>
    </div>
  )
}
