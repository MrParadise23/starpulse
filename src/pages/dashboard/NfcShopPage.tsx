import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Establishment } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface DashboardContext { establishment: Establishment | null; session: Session; refreshEstablishments: () => Promise<void> }

const NFC_PACKS = [
  { type: 'single', label: '1 tag', qty: 1, price: 24.90, unitPrice: '', desc: 'Ideal pour tester' },
  { type: 'pack3', label: '3 tags', qty: 3, price: 59, unitPrice: '19.67', desc: 'Petit etablissement' },
  { type: 'pack5', label: '5 tags', qty: 5, price: 89, unitPrice: '17.80', desc: 'Restaurant moyen' },
  { type: 'pack10', label: '10 tags', qty: 10, price: 149, unitPrice: '14.90', desc: 'Multi-zones', popular: true },
  { type: 'pack25', label: '25 tags', qty: 25, price: 299, unitPrice: '11.96', desc: 'Grande surface' },
]

export default function NfcShopPage() {
  const { establishment, session } = useOutletContext<DashboardContext>()
  const [loading, setLoading] = useState<string | null>(null)

  async function handleOrder(pack: typeof NFC_PACKS[0]) {
    setLoading(pack.type)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          mode: 'payment',
          pack_type: pack.type,
          quantity: pack.qty,
          unit_price: pack.price / pack.qty,
          total_price: pack.price,
          establishment_id: establishment?.id || null,
        }
      })
      if (error) throw error
      if (data?.url) window.location.href = data.url
    } catch (err: any) {
      alert("Erreur : " + (err.message || "Impossible de creer la commande"))
    }
    setLoading(null)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:24, letterSpacing:'-0.02em', color:'#1a1a18', margin:'0 0 4px' }}>Boutique NFC</h1>
        <p style={{ fontSize:14, color:'#888', margin:0 }}>Commandez vos tags NFC pre-encodes, prets a coller.</p>
      </div>

      {/* Info banner */}
      <div style={{ background:'linear-gradient(135deg, rgba(37,99,235,0.04), rgba(37,99,235,0.08))', borderRadius:16, padding:'20px 24px', marginBottom:28, border:'1px solid rgba(37,99,235,0.1)' }}>
        <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'rgba(37,99,235,0.1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"><path d="M6 8.32a7.43 7.43 0 010 7.36"/><path d="M9.46 6.21a11.76 11.76 0 010 11.58"/><path d="M12.91 4.1a16.1 16.1 0 010 15.8"/><path d="M16.37 2a20.16 20.16 0 010 20"/></svg>
          </div>
          <div>
            <p style={{ fontSize:14, fontWeight:600, color:'#1a1a18', margin:'0 0 4px' }}>Comment ca marche ?</p>
            <p style={{ fontSize:13, color:'#666', margin:0, lineHeight:1.6 }}>
              Chaque tag NFC est pre-encode avec un lien unique vers votre page d'avis StarPulse. 
              Collez-les sur vos tables, comptoir ou menu. Le client pose son telephone dessus → il arrive directement sur votre smart routing.
              Livraison en 3-5 jours ouvres.
            </p>
          </div>
        </div>
      </div>

      {/* Packs grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:32 }}>
        {NFC_PACKS.map((pack) => (
          <div key={pack.type} style={{
            background:'#fff', borderRadius:20, padding:'24px 20px', textAlign:'center',
            border: pack.popular ? '2px solid #2563eb' : '1px solid #f0f0ec',
            position:'relative', transition:'all 0.2s',
            boxShadow: pack.popular ? '0 4px 20px rgba(37,99,235,0.08)' : 'none',
          }}
            onMouseEnter={(e) => { if (!pack.popular) { (e.currentTarget).style.borderColor='#ddd'; (e.currentTarget).style.boxShadow='0 4px 16px rgba(0,0,0,0.04)' }}}
            onMouseLeave={(e) => { if (!pack.popular) { (e.currentTarget).style.borderColor='#f0f0ec'; (e.currentTarget).style.boxShadow='none' }}}>
            
            {pack.popular && (
              <div style={{ position:'absolute', top:-11, left:'50%', transform:'translateX(-50%)', padding:'4px 14px', borderRadius:8, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', color:'#fff', fontSize:11, fontWeight:700, fontFamily:'"Outfit",system-ui', whiteSpace:'nowrap' }}>
                POPULAIRE
              </div>
            )}

            <div style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:16, color:'#1a1a18', marginBottom:2 }}>
              {pack.label}
            </div>
            <p style={{ fontSize:12, color:'#999', margin:'0 0 12px' }}>{pack.desc}</p>
            
            <div style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:36, color:'#1a1a18', letterSpacing:'-0.03em', lineHeight:1 }}>
              {pack.price % 1 === 0 ? pack.price : pack.price.toFixed(2)}
              <span style={{ fontSize:16, fontWeight:500, color:'#888' }}>EUR</span>
            </div>
            {pack.unitPrice && (
              <p style={{ fontSize:12, color:'#16a34a', fontWeight:500, margin:'4px 0 16px' }}>
                {pack.unitPrice} EUR/tag
              </p>
            )}
            {!pack.unitPrice && <div style={{ height:16 }}/>}

            <button onClick={() => handleOrder(pack)} disabled={loading === pack.type}
              style={{
                width:'100%', padding:'12px 0', borderRadius:12, border:'none',
                background: loading === pack.type ? '#e5e5e5' : pack.popular ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : '#f5f5f0',
                color: pack.popular ? '#fff' : '#555', fontSize:14, fontWeight:600,
                fontFamily:'"Outfit",system-ui', cursor: loading === pack.type ? 'wait' : 'pointer',
                transition:'all 0.15s',
                boxShadow: pack.popular ? '0 4px 16px rgba(37,99,235,0.25)' : 'none',
              }}
              onMouseEnter={(e) => { if (!pack.popular && loading !== pack.type) { (e.currentTarget).style.background='#e8e8e4' }}}
              onMouseLeave={(e) => { if (!pack.popular && loading !== pack.type) { (e.currentTarget).style.background='#f5f5f0' }}}>
              {loading === pack.type ? 'Redirection...' : 'Commander'}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div style={{ background:'#fff', borderRadius:20, border:'1px solid #f0f0ec', padding:'24px' }}>
        <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', margin:'0 0 16px' }}>Questions frequentes</h2>
        {[
          { q: 'Les tags sont-ils compatibles avec tous les telephones ?', a: 'Oui, tous les smartphones recents (iPhone XS+ et Android avec NFC) peuvent lire nos tags sans application.' },
          { q: 'Comment activer un tag NFC ?', a: 'Les tags arrivent pre-encodes. Collez-les et ils sont immediatement operationnels — aucune configuration necessaire.' },
          { q: 'Puis-je commander pour plusieurs etablissements ?', a: 'Oui, vous pouvez passer plusieurs commandes. Chaque tag sera lie a votre compte et configurable depuis le dashboard.' },
          { q: 'Quel est le delai de livraison ?', a: '3 a 5 jours ouvres en France metropolitaine. Livraison egalement disponible en Belgique, Suisse et Luxembourg.' },
        ].map((item, i) => (
          <div key={i} style={{ padding:'12px 0', borderBottom: i < 3 ? '1px solid #f5f5f0' : 'none' }}>
            <p style={{ fontSize:14, fontWeight:600, color:'#1a1a18', margin:'0 0 4px' }}>{item.q}</p>
            <p style={{ fontSize:13, color:'#666', margin:0, lineHeight:1.6 }}>{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
