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

interface SubInfo {
  id: string
  status: string
  price_monthly: number
  billing_period: string
  plan_interval: string
  trial_ends_at: string | null
  cancelled_at: string | null
  current_period_end: string | null
  establishment_id: string
  establishment_name?: string
}

interface Referral {
  id: string
  referred_user_id: string
  status: string
  created_at: string
  commission_end_date: string | null
  profiles?: { full_name: string | null; email: string } | null
  subscriptions: SubInfo[]
}

interface Commission {
  id: string
  referral_id: string
  establishment_id: string | null
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

      const { data: refData } = await supabase
        .from('referrals')
        .select(`*, profiles:referred_user_id ( full_name, email )`)
        .eq('affiliate_id', affData.id)
        .order('created_at', { ascending: false })

      const referralsWithSubs: Referral[] = []
      if (refData) {
        for (const ref of refData) {
          // Get ALL subscriptions for this referred user
          const { data: subData } = await supabase
            .from('subscriptions')
            .select('id, status, price_monthly, billing_period, plan_interval, trial_ends_at, cancelled_at, current_period_end, establishment_id')
            .eq('user_id', ref.referred_user_id)
            .order('created_at', { ascending: false })

          // Get establishment names for each subscription
          const subs: SubInfo[] = []
          if (subData) {
            for (const sub of subData) {
              const { data: estData } = await supabase
                .from('establishments')
                .select('name')
                .eq('id', sub.establishment_id)
                .single()
              subs.push({ ...sub, establishment_name: estData?.name || 'Établissement' })
            }
          }

          referralsWithSubs.push({ ...ref, subscriptions: subs })
        }
      }
      setReferrals(referralsWithSubs)

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

  function getSubStatus(sub: SubInfo): 'active' | 'cancelled' | 'inactive' {
    if (sub.cancelled_at) return 'cancelled'
    if (['active', 'trialing'].includes(sub.status)) return 'active'
    return 'inactive'
  }

  function isYearly(sub: SubInfo) {
    return sub.billing_period === 'yearly' || sub.plan_interval === 'yearly' || sub.plan_interval === 'year'
  }

  function getSubPrice(sub: SubInfo) {
    return isYearly(sub) ? sub.price_monthly * 12 : sub.price_monthly
  }

  // Overall referral status: active if at least one sub is active and not cancelled
  function getReferralStatus(ref: Referral): 'active' | 'partial' | 'inactive' | 'expired' {
    const commissionExpired = ref.commission_end_date && new Date(ref.commission_end_date) < new Date()
    if (commissionExpired) return 'expired'
    if (ref.subscriptions.length === 0) return 'inactive'
    const activeSubs = ref.subscriptions.filter(s => getSubStatus(s) === 'active')
    const cancelledSubs = ref.subscriptions.filter(s => getSubStatus(s) === 'cancelled')
    if (activeSubs.length > 0 && cancelledSubs.length > 0) return 'partial'
    if (activeSubs.length > 0) return 'active'
    return 'inactive'
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
  const rate = affiliate.commission_rate * 100
  const pendingCommissions = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0)
  const paidCommissions = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0)

  const sectionStyle = { background:'#fff', borderRadius:20, border:'1px solid #f0f0ec', padding:'24px', marginBottom:20 } as const

  const statusBadge = {
    active: { bg: '#dcfce7', color: '#16a34a', label: 'Actif' },
    partial: { bg: '#fef3c7', color: '#d97706', label: 'Partiel' },
    cancelled: { bg: '#fee2e2', color: '#dc2626', label: 'Résilié' },
    inactive: { bg: '#f5f5f0', color: '#888', label: 'Inactif' },
    expired: { bg: '#f5f5f0', color: '#888', label: 'Expiré' },
  }

  const subStatusBadge = {
    active: { bg: '#dcfce7', color: '#16a34a', label: 'Actif' },
    cancelled: { bg: '#fee2e2', color: '#dc2626', label: 'Résilié' },
    inactive: { bg: '#f5f5f0', color: '#888', label: 'Inactif' },
  }

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:24, letterSpacing:'-0.02em', color:'#1a1a18', margin:'0 0 4px' }}>Affiliation</h1>
        <p style={{ fontSize:14, color:'#888', margin:0 }}>
          Vous touchez {rate}% sur chaque paiement de vos filleuls pendant {affiliate.commission_duration_months} mois.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:20 }}>
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f0f0ec', padding:'18px' }}>
          <div style={{ width:34, height:34, borderRadius:10, background:'rgba(245,158,11,0.06)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:24, color:'#1a1a18', letterSpacing:'-0.03em', margin:'0 0 2px' }}>{pendingCommissions.toFixed(2)} €</p>
          <p style={{ fontSize:11, color:'#888', margin:0 }}>À recevoir</p>
        </div>
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f0f0ec', padding:'18px' }}>
          <div style={{ width:34, height:34, borderRadius:10, background:'rgba(5,150,105,0.06)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
          </div>
          <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:24, color:'#1a1a18', letterSpacing:'-0.03em', margin:'0 0 2px' }}>{paidCommissions.toFixed(2)} €</p>
          <p style={{ fontSize:11, color:'#888', margin:'0 0 2px' }}>Déjà encaissé</p>
          <p style={{ fontSize:10, color:'#aaa', margin:0 }}>Versé sur votre compte</p>
        </div>
      </div>

      {/* Lien et code */}
      <section style={sectionStyle}>
        <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', margin:'0 0 16px' }}>Votre lien de parrainage</h2>
        <div style={{ marginBottom:12 }}>
          <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#888', marginBottom:4 }}>Lien d'inscription</label>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1, background:'#f5f5f0', borderRadius:12, padding:'12px 14px', fontSize:13, color:'#555', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{referralLink}</div>
            <button onClick={() => copyToClipboard(referralLink, 'link')} style={{ padding:'12px 16px', borderRadius:12, border:'none', background: copied==='link' ? '#dcfce7' : 'rgba(37,99,235,0.06)', color: copied==='link' ? '#16a34a' : '#2563eb', fontSize:13, fontWeight:600, cursor:'pointer', flexShrink:0, transition:'all 0.2s' }}>{copied === 'link' ? '✓ Copié' : 'Copier'}</button>
          </div>
        </div>
        <div>
          <label style={{ display:'block', fontSize:12, fontWeight:500, color:'#888', marginBottom:4 }}>Code parrainage</label>
          <div style={{ display:'flex', gap:8 }}>
            <div style={{ flex:1, background:'#f5f5f0', borderRadius:12, padding:'12px 14px', fontSize:15, fontWeight:700, color:'#1a1a18', fontFamily:'monospace', letterSpacing:'0.1em' }}>{affiliate.referral_code}</div>
            <button onClick={() => copyToClipboard(affiliate.referral_code, 'code')} style={{ padding:'12px 16px', borderRadius:12, border:'none', background: copied==='code' ? '#dcfce7' : 'rgba(37,99,235,0.06)', color: copied==='code' ? '#16a34a' : '#2563eb', fontSize:13, fontWeight:600, cursor:'pointer', flexShrink:0, transition:'all 0.2s' }}>{copied === 'code' ? '✓ Copié' : 'Copier'}</button>
          </div>
        </div>
      </section>

      {/* Filleuls */}
      <section style={sectionStyle}>
        <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', margin:'0 0 16px' }}>Vos filleuls ({referrals.length})</h2>
        {referrals.length === 0 ? (
          <div style={{ textAlign:'center', padding:'32px 20px' }}>
            <p style={{ fontSize:14, color:'#888', margin:'0 0 8px' }}>Aucun filleul pour le moment.</p>
            <p style={{ fontSize:13, color:'#aaa', margin:0 }}>Partagez votre lien pour commencer à gagner des commissions.</p>
          </div>
        ) : (
          <div>
            {referrals.map(ref => {
              const name = ref.profiles?.full_name || ref.profiles?.email || 'Utilisateur inconnu'
              const email = ref.profiles?.email || ''
              const activeSubs = ref.subscriptions.filter(s => getSubStatus(s) === 'active')
              const inactiveSubs = ref.subscriptions.filter(s => getSubStatus(s) === 'cancelled')

              return (
                <div key={ref.id} style={{ padding:'14px 0', borderBottom:'1px solid #f0f0ec' }}>
                  {/* Header */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <p style={{ fontSize:14, fontWeight:600, color:'#1a1a18', margin:0, fontFamily:'"Outfit",system-ui' }}>{name}</p>
                        {activeSubs.length === 0 && <span style={{ padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:600, background:'#fee2e2', color:'#dc2626' }}>Résilié</span>}
                      </div>
                      <p style={{ fontSize:11, color:'#aaa', margin:'2px 0 0' }}>
                        {email && name !== email ? email + ' · ' : ''}Inscrit le {new Date(ref.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Active subs */}
                  {activeSubs.length > 0 && (
                    <div style={{ marginTop:10, display:'flex', flexDirection:'column', gap:6 }}>
                      {activeSubs.map(sub => {
                        const yearly = isYearly(sub)
                        const commission = getSubPrice(sub) * affiliate.commission_rate
                        const isTrial = sub.status === 'trialing'

                        return (
                          <div key={sub.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#f9f9f6', borderRadius:10, border:'1px solid #f0f0ec', gap:8, flexWrap:'wrap' }}>
                            <div style={{ minWidth:0 }}>
                              <p style={{ fontSize:13, fontWeight:500, color:'#1a1a18', margin:0 }}>{sub.establishment_name}</p>
                              {isTrial && sub.trial_ends_at ? (
                                <p style={{ fontSize:11, color:'#888', margin:'2px 0 0' }}>Essai gratuit · Facturation le {new Date(sub.trial_ends_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long' })}</p>
                              ) : (
                                <p style={{ fontSize:11, color:'#888', margin:'2px 0 0' }}>{yearly ? 'Annuel' : 'Mensuel'}</p>
                              )}
                            </div>
                            <div style={{ textAlign:'right', flexShrink:0 }}>
                              <p style={{ fontSize:14, fontWeight:700, color:'#2563eb', margin:0, fontFamily:'"Outfit",system-ui' }}>
                                +{commission.toFixed(2)}€<span style={{ fontSize:10, fontWeight:400, color:'#888' }}>/{yearly ? 'an' : 'mois'}</span>
                              </p>
                              <p style={{ fontSize:10, color:'#888', margin:'1px 0 0' }}>Votre commission</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Inactive subs — just names, always "Résilié", never "Remboursé" */}
                  {inactiveSubs.length > 0 && (
                    <div style={{ marginTop:8, paddingTop:8, borderTop: activeSubs.length > 0 ? '1px solid #f5f5f0' : 'none' }}>
                      {inactiveSubs.map(sub => (
                        <div key={sub.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'3px 0' }}>
                          <span style={{ fontSize:11, color:'#ccc' }}>{sub.establishment_name}</span>
                          <span style={{ fontSize:9, color:'#aaa', background:'#f5f5f0', padding:'1px 6px', borderRadius:4, fontWeight:500 }}>Résilié</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* IBAN */}
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
                <tr style={{ borderBottom:'2px solid #f0f0ec' }}>
                  <th style={{ textAlign:'left', padding:'8px 12px', fontWeight:600, color:'#555' }}>Commerce</th>
                  <th style={{ textAlign:'left', padding:'8px 12px', fontWeight:600, color:'#555' }}>Période</th>
                  <th style={{ textAlign:'right', padding:'8px 12px', fontWeight:600, color:'#555' }}>Montant</th>
                  <th style={{ textAlign:'right', padding:'8px 12px', fontWeight:600, color:'#555' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map(c => {
                  const sameDate = c.period_start === c.period_end
                  const ref = referrals.find(r => r.id === c.referral_id)
                  const refName = ref?.profiles?.full_name || ref?.profiles?.email || '—'
                  // Find establishment name from referral's subscriptions
                  const estName = c.establishment_id
                    ? ref?.subscriptions.find(s => s.establishment_id === c.establishment_id)?.establishment_name
                    : null

                  return (
                    <tr key={c.id} style={{ borderBottom:'1px solid #f5f5f0' }}>
                      <td style={{ padding:'10px 12px', color:'#555' }}>
                        <p style={{ margin:0, fontWeight:500, fontSize:13 }}>{estName || refName}</p>
                        {estName && <p style={{ margin:'1px 0 0', fontSize:11, color:'#aaa' }}>{refName}</p>}
                      </td>
                      <td style={{ padding:'10px 12px', color:'#888' }}>
                        {sameDate
                          ? new Date(c.period_start).toLocaleDateString('fr-FR')
                          : <>{new Date(c.period_start).toLocaleDateString('fr-FR')} → {new Date(c.period_end).toLocaleDateString('fr-FR')}</>
                        }
                      </td>
                      <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:700, color: c.status === 'refunded' ? '#aaa' : '#1a1a18', fontFamily:'"Outfit",system-ui', textDecoration: c.status === 'refunded' ? 'line-through' : 'none' }}>{c.amount.toFixed(2)}€</td>
                      <td style={{ padding:'10px 12px', textAlign:'right' }}>
                        <span style={{
                          display:'inline-block', padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:600,
                          background: c.status === 'paid' ? '#dcfce7' : c.status === 'pending' ? '#fef3c7' : c.status === 'refunded' ? '#fee2e2' : '#f5f5f0',
                          color: c.status === 'paid' ? '#16a34a' : c.status === 'pending' ? '#d97706' : c.status === 'refunded' ? '#dc2626' : '#888',
                        }}>
                          {c.status === 'paid' ? 'Versé' : c.status === 'pending' ? 'En attente' : c.status === 'refunded' ? 'Annulé' : c.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Explication */}
      <div style={{ background:'#f5f5f0', borderRadius:16, padding:'20px 24px' }}>
        <h3 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:14, color:'#1a1a18', margin:'0 0 8px' }}>Comment ça marche ?</h3>
        <div style={{ fontSize:13, color:'#666', lineHeight:1.7 }}>
          <p style={{ margin:'0 0 6px' }}>1. Partagez votre lien ou code à un commerçant</p>
          <p style={{ margin:'0 0 6px' }}>2. Il s'inscrit et s'abonne à StarPulse</p>
          <p style={{ margin:'0 0 6px' }}>3. Vous touchez {rate}% sur chaque paiement pendant {affiliate.commission_duration_months} mois</p>
          <p style={{ margin:0 }}>4. Vos commissions sont versées par virement</p>
        </div>
      </div>
    </div>
  )
}
