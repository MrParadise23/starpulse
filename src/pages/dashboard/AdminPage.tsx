import { useEffect, useState } from 'react'
import { useOutletContext, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'louis23rs@gmail.com'

interface DashboardContext { session: Session }

interface Client {
  id: string
  email: string
  full_name: string | null
  created_at: string
  stripe_customer_id: string | null
  establishments: { id: string; name: string }[]
  subscriptions: { id: string; status: string; plan_interval: string; price_monthly: number; trial_ends_at: string | null; cancelled_at: string | null; current_period_end: string | null; establishment_id: string }[]
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
  amount: number
  period_start: string
  period_end: string
  status: string
  created_at: string
  referral_id: string
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
    if (session.user.email !== ADMIN_EMAIL) {
      navigate('/dashboard')
      return
    }
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

    const { data: establishments } = await supabase.from('establishments').select('id, name, user_id')
    const { data: subscriptions } = await supabase.from('subscriptions').select('id, status, plan_interval, price_monthly, trial_ends_at, cancelled_at, current_period_end, establishment_id, user_id')

    const merged: Client[] = profiles.map(p => ({
      ...p,
      establishments: (establishments || []).filter(e => e.user_id === p.id).map(e => ({ id: e.id, name: e.name })),
      subscriptions: (subscriptions || []).filter(s => s.user_id === p.id),
    }))
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
      const pending = affComms.filter(c => c.status === 'pending')
      const paid = affComms.filter(c => c.status === 'paid')
      return {
        ...a,
        profile,
        pendingTotal: pending.reduce((s, c) => s + c.amount, 0),
        paidTotal: paid.reduce((s, c) => s + c.amount, 0),
        pendingCommissions: pending,
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
  const activeSubs = clients.flatMap(c => c.subscriptions).filter(s => ['active', 'trialing'].includes(s.status) && !s.cancelled_at)
  const cancelledSubs = clients.flatMap(c => c.subscriptions).filter(s => s.cancelled_at)
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

  const sectionStyle = { background:'#fff', borderRadius:20, border:'1px solid #f0f0ec', padding:'24px', marginBottom:20 } as const

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Vue d\'ensemble' },
    { key: 'clients', label: `Clients (${totalClients})` },
    { key: 'commissions', label: `Commissions` },
    { key: 'history', label: 'Historique' },
  ]

  return (
    <div>
      {/* Header */}
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
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{
              padding:'8px 16px', borderRadius:10, border:'none', fontSize:13, fontWeight:600, cursor:'pointer',
              fontFamily:'"Outfit",system-ui', whiteSpace:'nowrap', transition:'all 0.15s',
              background: activeTab === t.key ? '#1a1a18' : '#f5f5f0',
              color: activeTab === t.key ? '#fff' : '#888',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== VUE D'ENSEMBLE ===== */}
      {activeTab === 'overview' && (
        <>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:12, marginBottom:20 }}>
            {[
              { value: totalClients.toString(), label: 'Clients inscrits', color: '#2563eb', bg: 'rgba(37,99,235,0.06)' },
              { value: activeSubs.length.toString(), label: 'Abonnements actifs', color: '#059669', bg: 'rgba(5,150,105,0.06)' },
              { value: `${mrr.toFixed(0)}€`, label: 'MRR', color: '#8b5cf6', bg: 'rgba(139,92,246,0.06)' },
              { value: cancelledSubs.length.toString(), label: 'Résiliés', color: '#dc2626', bg: 'rgba(220,38,38,0.06)' },
            ].map((stat, i) => (
              <div key={i} style={{ background:'#fff', borderRadius:16, border:'1px solid #f0f0ec', padding:'18px' }}>
                <div style={{ width:34, height:34, borderRadius:10, background:stat.bg, marginBottom:10 }} />
                <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:24, color:'#1a1a18', letterSpacing:'-0.03em', margin:'0 0 2px' }}>{stat.value}</p>
                <p style={{ fontSize:11, color:'#888', margin:0 }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <section style={sectionStyle}>
            <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', margin:'0 0 16px' }}>Actions rapides</h2>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {totalPendingComm > 0 && (
                <button onClick={() => setActiveTab('commissions')} style={{ padding:'10px 18px', borderRadius:10, border:'none', background:'#fef3c7', color:'#92400e', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'"Outfit",system-ui' }}>
                  {totalPendingComm.toFixed(2)}€ de commissions à payer →
                </button>
              )}
              <button onClick={() => setActiveTab('clients')} style={{ padding:'10px 18px', borderRadius:10, border:'1px solid #e8e8e4', background:'#fff', color:'#555', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'"Outfit",system-ui' }}>
                Voir tous les clients →
              </button>
            </div>
          </section>

          {/* Derniers inscrits */}
          <section style={sectionStyle}>
            <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', margin:'0 0 16px' }}>Derniers inscrits</h2>
            {clients.slice(0, 5).map(c => (
              <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid #f5f5f0', flexWrap:'wrap', gap:8 }}>
                <div>
                  <p style={{ fontSize:14, fontWeight:600, color:'#1a1a18', margin:'0 0 2px', fontFamily:'"Outfit",system-ui' }}>{c.full_name || 'Sans nom'}</p>
                  <p style={{ fontSize:12, color:'#888', margin:0 }}>{c.email}</p>
                </div>
                <div style={{ textAlign:'right' }}>
                  <p style={{ fontSize:12, color:'#888', margin:0 }}>
                    {new Date(c.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })}
                  </p>
                  {c.subscriptions.length > 0 && (
                    <span style={{
                      padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:600,
                      background: c.subscriptions[0].cancelled_at ? '#fee2e2' : ['active', 'trialing'].includes(c.subscriptions[0].status) ? '#dcfce7' : '#f5f5f0',
                      color: c.subscriptions[0].cancelled_at ? '#dc2626' : ['active', 'trialing'].includes(c.subscriptions[0].status) ? '#16a34a' : '#888',
                    }}>
                      {c.subscriptions[0].cancelled_at ? 'Résilié' : c.subscriptions[0].status === 'trialing' ? 'Essai' : c.subscriptions[0].status === 'active' ? 'Actif' : c.subscriptions[0].status}
                    </span>
                  )}
                </div>
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
          <section style={sectionStyle}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid #f0f0ec' }}>
                    <th style={{ textAlign:'left', padding:'10px 12px', fontWeight:600, color:'#555', fontFamily:'"Outfit",system-ui' }}>Client</th>
                    <th style={{ textAlign:'left', padding:'10px 12px', fontWeight:600, color:'#555', fontFamily:'"Outfit",system-ui' }}>Établissement</th>
                    <th style={{ textAlign:'center', padding:'10px 12px', fontWeight:600, color:'#555', fontFamily:'"Outfit",system-ui' }}>Plan</th>
                    <th style={{ textAlign:'center', padding:'10px 12px', fontWeight:600, color:'#555', fontFamily:'"Outfit",system-ui' }}>Statut</th>
                    <th style={{ textAlign:'right', padding:'10px 12px', fontWeight:600, color:'#555', fontFamily:'"Outfit",system-ui' }}>Inscription</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map(c => {
                    const sub = c.subscriptions[0]
                    const isCancelled = sub?.cancelled_at
                    const statusLabel = !sub ? 'Aucun' : isCancelled ? 'Résilié' : sub.status === 'trialing' ? 'Essai' : sub.status === 'active' ? 'Actif' : sub.status
                    const statusColor = !sub ? '#888' : isCancelled ? '#dc2626' : ['active', 'trialing'].includes(sub?.status) ? '#16a34a' : '#888'
                    const statusBg = !sub ? '#f5f5f0' : isCancelled ? '#fee2e2' : ['active', 'trialing'].includes(sub?.status) ? '#dcfce7' : '#f5f5f0'

                    return (
                      <tr key={c.id} style={{ borderBottom:'1px solid #f5f5f0' }}>
                        <td style={{ padding:'12px', verticalAlign:'top' }}>
                          <p style={{ fontSize:13, fontWeight:600, color:'#1a1a18', margin:'0 0 1px' }}>{c.full_name || '—'}</p>
                          <p style={{ fontSize:11, color:'#888', margin:0 }}>{c.email}</p>
                          {c.stripe_customer_id && <p style={{ fontSize:10, color:'#bbb', margin:'2px 0 0', fontFamily:'monospace' }}>{c.stripe_customer_id}</p>}
                        </td>
                        <td style={{ padding:'12px', verticalAlign:'top' }}>
                          {c.establishments.length > 0
                            ? c.establishments.map(e => <p key={e.id} style={{ fontSize:12, color:'#555', margin:'0 0 2px' }}>{e.name}</p>)
                            : <span style={{ fontSize:12, color:'#bbb' }}>—</span>
                          }
                        </td>
                        <td style={{ padding:'12px', textAlign:'center', verticalAlign:'top' }}>
                          {sub ? (
                            <span style={{ fontSize:12, fontWeight:600, color:'#1a1a18' }}>
                              {sub.plan_interval === 'yearly' || sub.plan_interval === 'year' ? '249€/an' : '29€/mois'}
                            </span>
                          ) : <span style={{ fontSize:12, color:'#bbb' }}>—</span>}
                        </td>
                        <td style={{ padding:'12px', textAlign:'center', verticalAlign:'top' }}>
                          <span style={{ padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:600, background:statusBg, color:statusColor }}>
                            {statusLabel}
                          </span>
                          {sub?.status === 'trialing' && sub.trial_ends_at && !isCancelled && (
                            <p style={{ fontSize:10, color:'#888', margin:'4px 0 0' }}>→ {new Date(sub.trial_ends_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}</p>
                          )}
                          {isCancelled && sub?.trial_ends_at && sub.status === 'trialing' && (
                            <p style={{ fontSize:10, color:'#dc2626', margin:'4px 0 0' }}>Fin: {new Date(sub.trial_ends_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}</p>
                          )}
                        </td>
                        <td style={{ padding:'12px', textAlign:'right', verticalAlign:'top' }}>
                          <span style={{ fontSize:12, color:'#888' }}>
                            {new Date(c.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filteredClients.length === 0 && (
              <p style={{ textAlign:'center', color:'#888', fontSize:14, padding:20 }}>Aucun client trouvé.</p>
            )}
          </section>
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
                    <p style={{ fontSize:16, fontWeight:700, color:'#1a1a18', margin:'0 0 2px', fontFamily:'"Outfit",system-ui' }}>
                      {aff.profile?.full_name || aff.profile?.email || 'Affilié inconnu'}
                    </p>
                    <p style={{ fontSize:12, color:'#888', margin:'0 0 4px' }}>{aff.profile?.email}</p>
                    <p style={{ fontSize:12, color:'#555', margin:0 }}>
                      Code: <span style={{ fontFamily:'monospace', fontWeight:600 }}>{aff.referral_code}</span> · Taux: {aff.commission_rate * 100}%
                    </p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:24, color:'#d97706', margin:'0 0 4px' }}>
                      {aff.pendingTotal.toFixed(2)}€
                    </p>
                    <p style={{ fontSize:11, color:'#888', margin:0 }}>à verser</p>
                  </div>
                </div>

                {/* IBAN */}
                <div style={{ background:'#f9f9f6', borderRadius:10, padding:'12px 14px', marginBottom:14 }}>
                  <p style={{ fontSize:11, color:'#888', margin:'0 0 4px' }}>IBAN pour virement</p>
                  <p style={{ fontSize:14, fontFamily:'monospace', fontWeight:600, color: aff.iban ? '#1a1a18' : '#dc2626', margin:0, letterSpacing:'0.05em' }}>
                    {aff.iban || 'Non renseigné — demander à l\'affilié'}
                  </p>
                </div>

                {/* Commissions détaillées */}
                <div style={{ marginBottom:14 }}>
                  {aff.pendingCommissions.map(c => (
                    <div key={c.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f5f5f0', gap:8, flexWrap:'wrap' }}>
                      <div>
                        <p style={{ fontSize:13, color:'#555', margin:0 }}>
                          {new Date(c.period_start).toLocaleDateString('fr-FR')} → {new Date(c.period_end).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
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

                {/* Bulk pay */}
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
                    const aff = affiliates.find(a => a.id === (c as any).affiliate_id)
                    return (
                      <tr key={c.id} style={{ borderBottom:'1px solid #f5f5f0' }}>
                        <td style={{ padding:'10px 12px' }}>
                          <p style={{ fontSize:13, fontWeight:600, color:'#1a1a18', margin:0 }}>{aff?.profile?.full_name || aff?.profile?.email || '—'}</p>
                        </td>
                        <td style={{ padding:'10px 12px', color:'#555' }}>
                          {new Date(c.period_start).toLocaleDateString('fr-FR')} → {new Date(c.period_end).toLocaleDateString('fr-FR')}
                        </td>
                        <td style={{ padding:'10px 12px', textAlign:'right', fontWeight:700, color:'#1a1a18', fontFamily:'"Outfit",system-ui' }}>
                          {c.amount.toFixed(2)}€
                        </td>
                        <td style={{ padding:'10px 12px', textAlign:'right', color:'#888' }}>
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Totaux */}
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
