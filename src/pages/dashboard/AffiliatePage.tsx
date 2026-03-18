import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface DashboardContext { session: Session }

interface Affiliate {
  id: string
  referral_code: string
  commission_rate: number
  commission_duration_months: number
  total_earned: number
  iban: string | null
  payment_email: string | null
  is_active: boolean
}

interface Referral {
  id: string
  referred_user_id: string
  status: string
  created_at: string
  commission_end_date: string | null
  referred_profiles?: { email: string; full_name: string | null } | null
  referred_subscriptions?: { status: string; plan_interval: string; price_monthly: number } | null
}

interface Commission {
  id: string
  referral_id: string
  amount: number
  period_start: string
  period_end: string
  status: string
  paid_at: string | null
  created_at: string
}

export default function AffiliatePage() {
  const { session } = useOutletContext<DashboardContext>()
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<'link' | 'code' | null>(null)
  const [iban, setIban] = useState('')
  const [savingIban, setSavingIban] = useState(false)
  const [savedIban, setSavedIban] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: affData } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (affData) {
      setAffiliate(affData)
      setIban(affData.iban || '')

      // Load referrals
      const { data: refData } = await supabase
        .from('referrals')
        .select('*')
        .eq('affiliate_id', affData.id)
        .order('created_at', { ascending: false })
      setReferrals(refData || [])

      // Load commissions
      const { data: commData } = await supabase
        .from('commissions')
        .select('*')
        .eq('affiliate_id', affData.id)
        .order('created_at', { ascending: false })
      setCommissions(commData || [])
    }
    setLoading(false)
  }

  async function copyToClipboard(text: string, type: 'link' | 'code') {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  async function saveIban() {
    if (!affiliate) return
    setSavingIban(true)
    await supabase.from('affiliates').update({ iban: iban.trim() || null }).eq('id', affiliate.id)
    setSavingIban(false)
    setSavedIban(true)
    setTimeout(() => setSavedIban(false), 2000)
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
      <div style={{ width:28, height:28, borderRadius:'50%', border:'3px solid #e8e8e4', borderTopColor:'#2563eb', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!affiliate) return null

  const baseUrl = window.location.origin
  const referralLink = `${baseUrl}/register?ref=${affiliate.referral_code}`
  const activeReferrals = referrals.filter(r => r.status === 'active').length
  const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0)
  const paidCommissions = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0)

  const sectionStyle = { background:'#fff', borderRadius:20, border:'1px solid #f0f0ec', padding:'24px', marginBottom:20 } as const

  return (
    <div>
      <div className="mb-6">
        <h1 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:24, letterSpacing:'-0.02em', color:'#1a1a18', margin:'0 0 4px' }}>Affiliation</h1>
        <p style={{ fontSize:14, color:'#888', margin:0 }}>
          Recommandez StarPulse et touchez {affiliate.commission_rate * 100}% sur chaque abonnement pendant {affiliate.commission_duration_months} mois.
        </p>
      </div>

      {/* Lien et code */}
      <section style={sectionStyle}>
        <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', margin:'0 0 16px' }}>Votre lien de parrainage</h2>

        <div style={{ marginBottom:12 }}>
          <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#888', marginBottom:4 }}>Lien d'inscription</label>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1, background:'#f5f5f0', borderRadius:12, padding:'12px 14px', fontSize:13, color:'#555', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {referralLink}
            </div>
            <button onClick={() => copyToClipboard(referralLink, 'link')}
              style={{ padding:'12px 16px', borderRadius:12, border:'none', background: copied==='link' ? '#dcfce7' : 'rgba(37,99,235,0.06)', color: copied==='link' ? '#16a34a' : '#2563eb', fontSize:13, fontWeight:600, cursor:'pointer', flexShrink:0, transition:'all 0.2s' }}>
              {copied === 'link' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>

        <div>
          <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#888', marginBottom:4 }}>Code parrainage</label>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1, background:'#f5f5f0', borderRadius:12, padding:'12px 14px', fontSize:15, fontWeight:700, color:'#1a1a18', fontFamily:'monospace', letterSpacing:'0.1em' }}>
              {affiliate.referral_code}
            </div>
            <button onClick={() => copyToClipboard(affiliate.referral_code, 'code')}
              style={{ padding:'12px 16px', borderRadius:12, border:'none', background: copied==='code' ? '#dcfce7' : 'rgba(37,99,235,0.06)', color: copied==='code' ? '#16a34a' : '#2563eb', fontSize:13, fontWeight:600, cursor:'pointer', flexShrink:0, transition:'all 0.2s' }}>
              {copied === 'code' ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:12, marginBottom:20 }}>
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f0f0ec', padding:'20px' }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(37,99,235,0.06)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:28, color:'#1a1a18', letterSpacing:'-0.03em', margin:'0 0 2px' }}>{activeReferrals}</p>
          <p style={{ fontSize:12, color:'#888', margin:0 }}>Filleul(s) actif(s)</p>
        </div>

        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f0f0ec', padding:'20px' }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(245,158,11,0.06)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:28, color:'#1a1a18', letterSpacing:'-0.03em', margin:'0 0 2px' }}>{pendingCommissions.toFixed(2)} €</p>
          <p style={{ fontSize:12, color:'#888', margin:0 }}>Commissions à encaisser</p>
        </div>

        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f0f0ec', padding:'20px' }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(5,150,105,0.06)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
          </div>
          <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:28, color:'#1a1a18', letterSpacing:'-0.03em', margin:'0 0 2px' }}>{paidCommissions.toFixed(2)} €</p>
          <p style={{ fontSize:12, color:'#888', margin:0 }}>Déjà encaissé</p>
        </div>
      </div>

      {/* IBAN pour paiement */}
      <section style={sectionStyle}>
        <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', margin:'0 0 4px' }}>Coordonnées bancaires</h2>
        <p style={{ fontSize:13, color:'#888', margin:'0 0 16px' }}>Pour recevoir vos commissions par virement bancaire.</p>
        <div style={{ display:'flex', gap:8 }}>
          <input type="text" value={iban} onChange={(e) => setIban(e.target.value.toUpperCase())}
            placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
            style={{ flex:1, border:'1.5px solid #e8e8e4', borderRadius:12, padding:'12px 14px', fontSize:14, fontFamily:'monospace', letterSpacing:'0.05em', color:'#1a1a18', background:'#fafaf8', outline:'none' }}/>
          <button onClick={saveIban} disabled={savingIban}
            style={{ padding:'12px 20px', borderRadius:12, border:'none', background: savedIban ? '#dcfce7' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: savedIban ? '#16a34a' : '#fff', fontSize:13, fontWeight:600, fontFamily:'"Outfit",system-ui', cursor:'pointer', flexShrink:0 }}>
            {savingIban ? '...' : savedIban ? '✓ Enregistré' : 'Enregistrer'}
          </button>
        </div>
      </section>

      {/* Historique commissions */}
      {commissions.length > 0 && (
        <section style={sectionStyle}>
          <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', margin:'0 0 16px' }}>Historique des commissions</h2>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid #f0f0ec' }}>
                  <th style={{ textAlign:'left', padding:'8px 12px', fontWeight:500, color:'#888' }}>Période</th>
                  <th style={{ textAlign:'right', padding:'8px 12px', fontWeight:500, color:'#888' }}>Montant</th>
                  <th style={{ textAlign:'right', padding:'8px 12px', fontWeight:500, color:'#888' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map(c => (
                  <tr key={c.id} style={{ borderBottom:'1px solid #f5f5f0' }}>
                    <td style={{ padding:'10px 12px', color:'#555' }}>
                      {new Date(c.period_start).toLocaleDateString('fr-FR')} → {new Date(c.period_end).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:600, color:'#1a1a18', fontFamily:'"Outfit",system-ui' }}>
                      {c.amount.toFixed(2)} €
                    </td>
                    <td style={{ padding:'10px 12px', textAlign:'right' }}>
                      <span style={{
                        display:'inline-block', padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:600,
                        background: c.status === 'paid' ? '#dcfce7' : c.status === 'pending' ? '#fef3c7' : '#f5f5f0',
                        color: c.status === 'paid' ? '#16a34a' : c.status === 'pending' ? '#d97706' : '#888',
                      }}>
                        {c.status === 'paid' ? 'Versé' : c.status === 'pending' ? 'En attente' : c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Liste filleuls */}
      <section style={sectionStyle}>
        <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', margin:'0 0 16px' }}>
          Vos filleuls ({referrals.length})
        </h2>
        {referrals.length === 0 ? (
          <div style={{ textAlign:'center', padding:'32px 20px' }}>
            <p style={{ fontSize:14, color:'#888', margin:'0 0 8px' }}>Aucun filleul pour le moment.</p>
            <p style={{ fontSize:13, color:'#aaa', margin:0 }}>Partagez votre lien ou code parrainage pour commencer à gagner des commissions.</p>
          </div>
        ) : (
          <div>
            {referrals.map(ref => (
              <div key={ref.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid #f5f5f0' }}>
                <div>
                  <p style={{ fontSize:14, fontWeight:500, color:'#1a1a18', margin:'0 0 2px' }}>
                    Filleul inscrit le {new Date(ref.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
                  </p>
                  {ref.commission_end_date && (
                    <p style={{ fontSize:12, color:'#888', margin:0 }}>
                      Commissions jusqu'au {new Date(ref.commission_end_date).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                <span style={{
                  padding:'4px 12px', borderRadius:8, fontSize:12, fontWeight:600,
                  background: ref.status === 'active' ? '#dcfce7' : '#f5f5f0',
                  color: ref.status === 'active' ? '#16a34a' : '#888',
                }}>
                  {ref.status === 'active' ? 'Actif' : 'Inactif'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Explication */}
      <div style={{ background:'#f5f5f0', borderRadius:16, padding:'20px 24px' }}>
        <h3 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:14, color:'#1a1a18', margin:'0 0 8px' }}>Comment fonctionne l'affiliation ?</h3>
        <div style={{ fontSize:13, color:'#666', lineHeight:1.7 }}>
          <p style={{ margin:'0 0 6px' }}>1. Partagez votre lien ou code à un commerçant intéressé</p>
          <p style={{ margin:'0 0 6px' }}>2. Il s'inscrit et souscrit un abonnement StarPulse</p>
          <p style={{ margin:'0 0 6px' }}>3. À chaque paiement, vous touchez {affiliate.commission_rate * 100}% de commission</p>
          <p style={{ margin:0 }}>4. Les commissions sont versées par virement bancaire mensuel</p>
        </div>
      </div>
    </div>
  )
}
