import { useEffect, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'louis23rs@gmail.com'

interface DashboardContext { session: Session }

interface SubRow {
  id: string
  status: string
  plan_interval: string
  price_monthly: number
  trial_ends_at: string | null
  cancelled_at: string | null
  current_period_end: string | null
  establishment_id: string
  stripe_subscription_id: string | null
  created_at: string
}

interface EstRow {
  id: string
  name: string
  is_active: boolean
  user_id: string
}

interface Client {
  id: string
  email: string
  full_name: string | null
  created_at: string
  stripe_customer_id: string | null
  establishments: EstRow[]
  subscriptions: (SubRow & { establishment_name: string })[]
}

interface AffiliateWithDetails {
  id: string
  user_id: string
  referral_code: string
  commission_rate: number
  iban: string | null
  profile: { full_name: string | null; email: string } | null
  pendingTotal: number
  paidTotal: number
  pendingCommissions: CommissionRow[]
}

interface CommissionRow {
  id: string
  affiliate_id: string
  amount: number
  period_start: string
  period_end: string
  status: string
  paid_at: string | null
  created_at: string
}

type Tab = 'overview' | 'clients' | 'commissions' | 'history'

export default function AdminPage() {
  const { session } = useOutletContext<DashboardContext>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [clients, setClients] = useState<Client[]>([])
  const [affiliates, setAffiliates] = useState<AffiliateWithDetails[]>([])
  const [allCommissions, setAllCommissions] = useState<CommissionRow[]>([])
  const [search, setSearch] = useState('')
  const [markingPaid, setMarkingPaid] = useState<string | null>(null)

  useEffect(() => {
    if (session.user.email !== ADMIN_EMAIL) { navigate('/dashboard'); return }
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    await Promise.all([loadClients(), loadAffiliates(), loadAllCommissions()])
    setLoading(false)
  }

  async function loadClients() {
    const { data: profiles } = await supabase.from('profiles').select('id, email, full_name, created_at, stripe_customer_id').order('created_at', { ascending: false })
    if (!profiles) return
    const { data: establishments } = await supabase.from('establishments').select('id, name, is_active, user_id')
    const { data: subscriptions } = await supabase.from('subscriptions').select('id, status, plan_interval, price_monthly, trial_ends_at, cancelled_at, current_period_end, establishment_id, user_id, stripe_subscription_id, created_at')

    const merged: Client[] = profiles.map(p => {
      const userEsts = (establishments || []).filter(e => e.user_id === p.id)
      const userSubs = (subscriptions || []).filter(s => s.user_id === p.id).map(s => {
        const est = userEsts.find(e => e.id === s.establishment_id)
        return { ...s, establishment_name: est?.name || 'Établissement' }
      })
      return { ...p, establishments: userEsts.filter(e => e.is_active), subscriptions: userSubs }
    })
    setClients(merged)
  }

  async function loadAffiliates() {
    const { data: affs } = await supabase.from('affiliates').select('id, user_id, referral_code, commission_rate, iban')
    if (!affs) return
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email')
    const { data: comms } = await supabase.from('commissions').select('*')
    const detailed: AffiliateWithDetails[] = affs.map(a => {
      const profile = (profiles || []).find(p => p.id === a.user_id) || null
      const affComms = (comms || []).filter(c => c.affiliate_id === a.id)
      return {
        ...a, profile,
        pendingTotal: affComms.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0),
        paidTotal: affComms.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0),
        pendingCommissions: affComms.filter(c => c.status === 'pending'),
      }
    })
    setAffiliates(detailed)
  }

  async function loadAllCommissions() {
    const { data } = await supabase.from('commissions').select('*').order('created_at', { ascending: false })
    setAllCommissions(data || [])
  }

  async function markAsPaid(commissionId: string) {
    setMarkingPaid(commissionId)
    await supabase.from('commissions').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', commissionId)
    await loadAll()
    setMarkingPaid(null)
  }

  async function markAllPaidForAffiliate(affiliateId: string) {
    setMarkingPaid(affiliateId)
    const aff = affiliates.find(a => a.id === affiliateId)
    if (aff) {
      for (const c of aff.pendingCommissions) {
        await supabase.from('commissions').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', c.id)
      }
    }
    await loadAll()
    setMarkingPaid(null)
  }

  if (session.user.email !== ADMIN_EMAIL) return null

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
      <div style={{ width:28, height:28, borderRadius:'50%', border:'3px solid #e8e8e4', borderTopColor:'#2563eb', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // Stats
  const totalClients = clients.length
  const allSubs = clients.flatMap(c => c.subscriptions)
  const activeSubs = allSubs.filter(s => ['active', 'trialing'].includes(s.status) && !s.cancelled_at)
  const cancelledSubs = allSubs.filter(s => (s.cancelled_at || s.status === 'cancelled') && s.status !== 'refunded')
  const refundedSubs = allSubs.filter(s => s.status === 'refunded')
  const mrr = activeSubs.reduce((sum, s) => {
    if (s.plan_interval === 'yearly' || s.plan_interval === 'year') return sum + 20.75
    return sum + s.price_monthly
  }, 0)
  const totalPendingComm = allCommissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0)
  const totalPaidComm = allCommissions.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0)

  const filteredClients = clients.filter(c => {
    const q = search.toLowerCase()
    if (!q) return true
    return (c.full_name?.toLowerCase().includes(q)) || c.email.toLowerCase().includes(q) || c.establishments.some(e => e.name.toLowerCase().includes(q))
  })

  function getSubStatusLabel(sub: SubRow & { establishment_name: string }) {
    if (sub.status === 'refunded') return { label: 'Remboursé', color: '#7c3aed', bg: '#ede9fe' }
    if (sub.status === 'cancelled' && !sub.cancelled_at) return { label: 'Résilié', color: '#dc2626', bg: '#fee2e2' }
    if (sub.status === 'cancelled') return { label: 'Résilié', color: '#dc2626', bg: '#fee2e2' }
    if (sub.status === 'canceling' || (sub.cancelled_at && sub.status !== 'cancelled' && sub.status !== 'refunded')) return { label: 'En résiliation', color: '#ea580c', bg: '#fff7ed' }
    if (sub.status === 'trialing') return { label: 'Essai', color: '#2563eb', bg: '#dbeafe' }
    if (sub.status === 'active') return { label: 'Actif', color: '#059669', bg: '#dcfce7' }
    if (sub.status === 'past_due') return { label: 'Impayé', color: '#dc2626', bg: '#fee2e2' }
    return { label: sub.status, color: '#888', bg: '#f5f5f0' }
  }

  const sectionStyle = { background:'#fff', borderRadius:20, border:'1px solid #f0f0ec', padding:'24px', marginBottom:20 } as const

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Vue d\'ensemble' },
    { key: 'clients', label: `Clients (${totalClients})` },
    { key: 'commissions', label: 'Commissions' },
    { key: 'history', label: 'Historique' },
  ]

  return (
    <div>
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <h1 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:24, letterSpacing:'-0.02em', color:'#1a1a18', margin:0 }}>Administration</h1>
          <span style={{ padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:600, background:'#fee2e2', color:'#dc2626' }}>Admin</span>
        </div>
        <p style={{ fontSize:14, color:'#888', margin:0 }}>Gestion complète de StarPulse</p>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, overflowX:'auto', paddingBottom:4 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding:'8px 16px', borderRadius:10, border:'none', fontSize:13, fontWeight:600, cursor:'pointer',
            fontFamily:'"Outfit",system-ui', whiteSpace:'nowrap', transition:'all 0.15s',
            background: activeTab === t.key ? '#1a1a18' : '#f5f5f0', color: activeTab === t.key ? '#fff' : '#888',
          }}>{t.label}</button>
        ))}
      </div>

      {/* ===== VUE D'ENSEMBLE ===== */}
      {activeTab === 'overview' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:12, marginBottom:20 }}>
            {[
              { value: totalClients.toString(), label: 'Clients inscrits', color: '#2563eb' },
              { value: activeSubs.length.toString(), label: 'Abonnements actifs', color: '#059669' },
              { value: `${mrr.toFixed(0)}€`, label: 'MRR', color: '#8b5cf6' },
              { value: cancelledSubs.length.toString(), label: 'Résiliés', color: '#dc2626' },
              { value: refundedSubs.length.toString(), label: 'Remboursés', color: '#7c3aed' },
            ].map((stat, i) => (
              <div key={i} style={{ background:'#fff', borderRadius:16, border:'1px solid #f0f0ec', padding:'18px' }}>
                <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:24, color:'#1a1a18', letterSpacing:'-0.03em', margin:'0 0 2px' }}>{stat.value}</p>
                <p style={{ fontSize:11, color:'#888', margin:0 }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {totalPendingComm > 0 && (
            <section style={sectionStyle}>
              <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', margin:'0 0 12px' }}>Actions rapides</h2>
              <button onClick={() => setActiveTab('commissions')} style={{ padding:'10px 18px', borderRadius:10, border:'none', background:'#fef3c7', color:'#92400e', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'"Outfit",system-ui' }}>
                {totalPendingComm.toFixed(2)}€ de commissions à payer →
              </button>
            </section>
          )}

          {/* Derniers inscrits avec TOUS les abonnements */}
          <section style={sectionStyle}>
            <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', margin:'0 0 16px' }}>Derniers inscrits</h2>
            {clients.slice(0, 5).map(c => (
              <div key={c.id} style={{ padding:'12px 0', borderBottom:'1px solid #f5f5f0' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
                  <div>
                    <p style={{ fontSize:14, fontWeight:600, color:'#1a1a18', margin:'0 0 2px', fontFamily:'"Outfit",system-ui' }}>{c.full_name || 'Sans nom'}</p>
                    <p style={{ fontSize:12, color:'#888', margin:0 }}>{c.email}</p>
                  </div>
                  <span style={{ fontSize:12, color:'#888' }}>
                    {new Date(c.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })}
                  </span>
                </div>
                {c.subscriptions.length > 0 && (
                  <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:4 }}>
                    {c.subscriptions.map(sub => {
                      const st = getSubStatusLabel(sub)
                      const yearly = sub.plan_interval === 'yearly' || sub.plan_interval === 'year'
                      return (
                        <div key={sub.id} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, flexWrap:'wrap' }}>
                          <span style={{ color:'#555', fontWeight:500 }}>{sub.establishment_name}</span>
                          <span style={{ color:'#888' }}>·</span>
                          <span style={{ fontWeight:600, color:'#1a1a18' }}>{yearly ? '249€/an' : '29€/mois'}</span>
                          <span style={{ padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:600, background:st.bg, color:st.color }}>{st.label}</span>
                          {sub.status === 'trialing' && sub.trial_ends_at && !sub.cancelled_at && (
                            <span style={{ fontSize:10, color:'#888' }}>→ {new Date(sub.trial_ends_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </section>
        </>
      )}

      {/* ===== CLIENTS ===== */}
      {activeTab === 'clients' && (
        <>
          <div style={{ marginBottom:16 }}>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un client (nom, email, établissement)..."
              style={{ width:'100%', border:'1.5px solid #e8e8e4', borderRadius:12, padding:'12px 14px', fontSize:14, fontFamily:'"DM Sans",system-ui', color:'#1a1a18', background:'#fafaf8', outline:'none' }}
            />
          </div>
          {filteredClients.map(c => (
            <section key={c.id} style={{ ...sectionStyle, padding:'20px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom: c.subscriptions.length > 0 ? 12 : 0, flexWrap:'wrap' }}>
                <div>
                  <p style={{ fontSize:15, fontWeight:700, color:'#1a1a18', margin:'0 0 2px', fontFamily:'"Outfit",system-ui' }}>{c.full_name || 'Sans nom'}</p>
                  <p style={{ fontSize:12, color:'#888', margin:'0 0 2px' }}>{c.email}</p>
                  {c.stripe_customer_id && <p style={{ fontSize:10, color:'#bbb', margin:0, fontFamily:'monospace' }}>{c.stripe_customer_id}</p>}
                </div>
                <span style={{ fontSize:12, color:'#888', flexShrink:0 }}>
                  Inscrit le {new Date(c.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })}
                </span>
              </div>

              {c.subscriptions.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {c.subscriptions.map(sub => {
                    const st = getSubStatusLabel(sub)
                    const yearly = sub.plan_interval === 'yearly' || sub.plan_interval === 'year'
                    const isCancelled = !!sub.cancelled_at
                    return (
                      <div key={sub.id} style={{
                        background: isCancelled ? '#fefce8' : '#f9f9f6',
                        border: isCancelled ? '1px solid #fde68a' : '1px solid #f0f0ec',
                        borderRadius:10, padding:'12px 14px',
                        display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8
                      }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                          <p style={{ fontSize:13, fontWeight:600, color:'#1a1a18', margin:0 }}>{sub.establishment_name}</p>
                          <span style={{ padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:600, background:st.bg, color:st.color }}>{st.label}</span>
                          {sub.status === 'trialing' && sub.trial_ends_at && !isCancelled && (
                            <span style={{ fontSize:10, color:'#888' }}>→ {new Date(sub.trial_ends_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}</span>
                          )}
                          {isCancelled && (
                            <span style={{ fontSize:10, color:'#dc2626' }}>
                              Fin: {sub.status === 'trialing' && sub.trial_ends_at
                                ? new Date(sub.trial_ends_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })
                                : sub.current_period_end
                                  ? new Date(sub.current_period_end).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })
                                  : '—'}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize:14, fontWeight:700, color: isCancelled ? '#888' : '#1a1a18', fontFamily:'"Outfit",system-ui', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                          {yearly ? '249€/an' : '29€/mois'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p style={{ fontSize:12, color:'#bbb', margin:0 }}>Aucun abonnement</p>
              )}

              {c.establishments.length > 0 && (
                <p style={{ fontSize:11, color:'#aaa', margin:'8px 0 0' }}>
                  Établissements : {c.establishments.map(e => e.name).join(', ')}
                </p>
              )}
            </section>
          ))}
          {filteredClients.length === 0 && (
            <p style={{ textAlign:'center', color:'#888', fontSize:14, padding:20 }}>Aucun client trouvé.</p>
          )}
        </>
      )}

      {/* ===== COMMISSIONS À PAYER ===== */}
      {activeTab === 'commissions' && (
        <>
          {affiliates.filter(a => a.pendingTotal > 0).length === 0 ? (
            <section style={sectionStyle}>
              <div style={{ textAlign:'center', padding:'40px 20px' }}>
                <p style={{ fontSize:16, fontWeight:600, color:'#1a1a18', margin:'0 0 8px', fontFamily:'"Outfit",system-ui' }}>Aucune commission en attente</p>
                <p style={{ fontSize:14, color:'#888', margin:0 }}>Toutes les commissions ont été réglées.</p>
              </div>
            </section>
          ) : (
            affiliates.filter(a => a.pendingTotal > 0).map(aff => (
              <section key={aff.id} style={sectionStyle}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:12 }}>
                  <div>
                    <p style={{ fontSize:16, fontWeight:700, color:'#1a1a18', margin:'0 0 2px', fontFamily:'"Outfit",system-ui' }}>{aff.profile?.full_name || aff.profile?.email || 'Affilié inconnu'}</p>
                    <p style={{ fontSize:12, color:'#888', margin:'0 0 4px' }}>{aff.profile?.email}</p>
                    <p style={{ fontSize:12, color:'#555', margin:0 }}>Code: <span style={{ fontFamily:'monospace', fontWeight:600 }}>{aff.referral_code}</span> · Taux: {aff.commission_rate * 100}%</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:24, color:'#d97706', margin:'0 0 4px' }}>{aff.pendingTotal.toFixed(2)}€</p>
                    <p style={{ fontSize:11, color:'#888', margin:0 }}>à verser</p>
                  </div>
                </div>

                <div style={{ background:'#f9f9f6', borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
                  <p style={{ fontSize:11, color:'#888', margin:'0 0 4px' }}>IBAN pour virement</p>
                  <p style={{ fontSize:14, fontFamily:'monospace', fontWeight:600, color: aff.iban ? '#1a1a18' : '#dc2626', margin:0, letterSpacing:'0.05em' }}>
                    {aff.iban || 'Non renseigné — demander à l\'affilié'}
                  </p>
                </div>

                <div style={{ marginBottom:14 }}>
                  {aff.pendingCommissions.map(c => (
                    <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f5f5f0', gap:8, flexWrap:'wrap' }}>
                      <p style={{ fontSize:13, color:'#555', margin:0 }}>
                        {new Date(c.period_start).toLocaleDateString('fr-FR')} → {new Date(c.period_end).toLocaleDateString('fr-FR')}
                      </p>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:14, fontWeight:700, color:'#1a1a18', fontFamily:'"Outfit",system-ui' }}>{c.amount.toFixed(2)}€</span>
                        <button onClick={() => markAsPaid(c.id)} disabled={markingPaid === c.id}
                          style={{ padding:'6px 14px', borderRadius:8, border:'none', background:'#dcfce7', color:'#16a34a', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'"Outfit",system-ui' }}>
                          {markingPaid === c.id ? '...' : '✓ Payé'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={() => markAllPaidForAffiliate(aff.id)} disabled={markingPaid === aff.id}
                  style={{ width:'100%', padding:'12px', borderRadius:12, border:'none', background:'linear-gradient(135deg,#059669,#047857)', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'"Outfit",system-ui' }}>
                  {markingPaid === aff.id ? 'Traitement...' : `Tout marquer comme payé (${aff.pendingTotal.toFixed(2)}€)`}
                </button>
              </section>
            ))
          )}
        </>
      )}

      {/* ===== HISTORIQUE ===== */}
      {activeTab === 'history' && (
        <section style={sectionStyle}>
          <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', margin:'0 0 16px' }}>Historique des paiements affiliés</h2>
          {allCommissions.filter(c => c.status === 'paid').length === 0 ? (
            <div style={{ textAlign:'center', padding:'40px 20px' }}>
              <p style={{ fontSize:14, color:'#888', margin:0 }}>Aucun paiement effectué pour le moment.</p>
            </div>
          ) : (
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid #f0f0ec' }}>
                    <th style={{ textAlign:'left', padding:'10px 12px', fontWeight:600, color:'#555', fontFamily:'"Outfit",system-ui' }}>Affilié</th>
                    <th style={{ textAlign:'left', padding:'10px 12px', fontWeight:600, color:'#555', fontFamily:'"Outfit",system-ui' }}>Période</th>
                    <th style={{ textAlign:'right', padding:'10px 12px', fontWeight:600, color:'#555', fontFamily:'"Outfit",system-ui' }}>Montant</th>
                    <th style={{ textAlign:'right', padding:'10px 12px', fontWeight:600, color:'#555', fontFamily:'"Outfit",system-ui' }}>Payé le</th>
                  </tr>
                </thead>
                <tbody>
                  {allCommissions.filter(c => c.status === 'paid').map(c => {
                    const aff = affiliates.find(a => a.id === c.affiliate_id)
                    return (
                      <tr key={c.id} style={{ borderBottom:'1px solid #f5f5f0' }}>
                        <td style={{ padding:'10px 12px' }}>
                          <p style={{ fontSize:13, fontWeight:600, color:'#1a1a18', margin:0 }}>{aff?.profile?.full_name || aff?.profile?.email || '—'}</p>
                        </td>
                        <td style={{ padding:'10px 12px', color:'#555' }}>
                          {new Date(c.period_start).toLocaleDateString('fr-FR')} → {new Date(c.period_end).toLocaleDateString('fr-FR')}
                        </td>
                        <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:700, color:'#1a1a18', fontFamily:'"Outfit",system-ui' }}>{c.amount.toFixed(2)}€</td>
                        <td style={{ padding:'10px 12px', textAlign:'right', color:'#888' }}>
                          {c.paid_at ? new Date(c.paid_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop:16, padding:'14px 18px', background:'#f5f5f0', borderRadius:12, display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <p style={{ fontSize:12, color:'#888', margin:'0 0 2px' }}>Total versé aux affiliés</p>
              <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:20, color:'#059669', margin:0 }}>{totalPaidComm.toFixed(2)}€</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:12, color:'#888', margin:'0 0 2px' }}>Encore en attente</p>
              <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:20, color:'#d97706', margin:0 }}>{totalPendingComm.toFixed(2)}€</p>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
