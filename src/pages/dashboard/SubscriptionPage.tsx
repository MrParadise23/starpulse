import { useEffect, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Establishment } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import PricingPage from '../PricingPage'

interface DashboardContext { establishment: Establishment | null; session: Session; refreshEstablishments: () => Promise<void> }

interface SubWithEst {
  id: string
  establishment_id: string
  plan: string
  plan_interval: string
  status: string
  trial_ends_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancelled_at: string | null
  price_monthly: number
  stripe_subscription_id: string | null
  establishment_name: string
  establishment_logo: string | null
  establishment_color: string
}

export default function SubscriptionPage() {
  const { establishment, session } = useOutletContext<DashboardContext>()
  const [allSubs, setAllSubs] = useState<SubWithEst[]>([])
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [switchingPlan, setSwitchingPlan] = useState<string | null>(null)
  const [searchParams] = useSearchParams()

  const checkoutStatus = searchParams.get('checkout')
  const nfcStatus = searchParams.get('nfc_order')

  useEffect(() => { loadAllSubscriptions() }, [])

  async function loadAllSubscriptions() {
    const { data: establishments } = await supabase
      .from('establishments')
      .select('id, name, logo_url, primary_color')
      .eq('user_id', session.user.id)

    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .in('status', ['active', 'trialing', 'canceling', 'past_due', 'refunded'])
      .order('created_at', { ascending: false })

    if (subs && establishments) {
      const merged: SubWithEst[] = subs.map(sub => {
        const est = establishments.find(e => e.id === sub.establishment_id)
        return {
          ...sub,
          establishment_name: est?.name || 'Établissement',
          establishment_logo: est?.logo_url || null,
          establishment_color: est?.primary_color || '#2563eb',
        }
      })
      setAllSubs(merged)
    }
    setLoading(false)
  }

  async function openBillingPortal() {
    setPortalLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { mode: 'portal' }
      })
      if (error) throw error
      if (data?.url) window.location.href = data.url
    } catch (err: any) {
      alert("Erreur : " + (err.message || "Impossible d'ouvrir le portail de facturation"))
    }
    setPortalLoading(false)
  }

  async function switchPlan(subId: string, targetInterval: 'monthly' | 'yearly') {
    const sub = allSubs.find(s => s.id === subId)
    const isTrialing = sub?.status === 'trialing'

    const message = targetInterval === 'yearly'
      ? isTrialing
        ? 'Passer à l\'abonnement annuel (249€/an au lieu de 348€/an) ? Votre essai gratuit continue jusqu\'à la fin prévue.'
        : 'Passer à l\'abonnement annuel (249€/an au lieu de 348€/an) ? Un prorata sera appliqué pour la période en cours.'
      : 'Passer à l\'abonnement mensuel (29€/mois) ? Le changement prendra effet à la prochaine facturation.'

    if (!confirm(message)) return

    setSwitchingPlan(subId)
    try {
      const { data, error } = await supabase.functions.invoke('switch-plan', {
        body: { subscription_id: subId, target_interval: targetInterval }
      })
      if (error) throw error
      if (data?.ok) {
        await loadAllSubscriptions()
      }
    } catch (err: any) {
      alert("Erreur : " + (err.message || "Impossible de changer de plan"))
    }
    setSwitchingPlan(null)
  }

  function getEndDate(sub: SubWithEst): string | null {
    if (sub.cancelled_at) {
      // If trialing and cancelled, it ends at trial_ends_at
      if (sub.status === 'trialing' && sub.trial_ends_at) {
        return new Date(sub.trial_ends_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      }
      // If active and cancelled, it ends at current_period_end
      if (sub.current_period_end) {
        return new Date(sub.current_period_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      }
    }
    return null
  }

  function getStatusInfo(sub: SubWithEst): { label: string; color: string; bg: string } {
    if (sub.status === 'refunded') {
      return { label: 'Remboursé', color: '#7c3aed', bg: '#ede9fe' }
    }
    if (sub.cancelled_at) {
      return { label: 'Annulé', color: '#dc2626', bg: '#fee2e2' }
    }
    const map: Record<string, { label: string; color: string; bg: string }> = {
      active: { label: 'Actif', color: '#059669', bg: '#dcfce7' },
      trialing: { label: 'Essai gratuit', color: '#2563eb', bg: '#dbeafe' },
      canceling: { label: 'Annulation en cours', color: '#d97706', bg: '#fef3c7' },
      past_due: { label: 'Paiement en retard', color: '#dc2626', bg: '#fee2e2' },
    }
    return map[sub.status] || { label: sub.status, color: '#888', bg: '#f5f5f0' }
  }

  const sectionStyle = { background:'#fff', borderRadius:20, border:'1px solid #f0f0ec', padding:'24px' } as const

  const activeSubs = allSubs.filter(s => ['active', 'trialing'].includes(s.status) && !s.cancelled_at)
  const cancelingSubs = allSubs.filter(s => s.status === 'canceling' || (s.cancelled_at && !['cancelled', 'refunded'].includes(s.status)))
  const allTrialing = activeSubs.length > 0 && activeSubs.every(s => s.status === 'trialing')

  // Separate monthly and yearly subs (counting trialing too for "after trial" display)
  const yearlySubs = activeSubs.filter(s => s.plan_interval === 'yearly' || s.plan_interval === 'year')
  const monthlySubs = activeSubs.filter(s => s.plan_interval === 'monthly' || s.plan_interval === 'month')
  const totalPerMonth = monthlySubs.length * 29
  const totalPerYear = yearlySubs.length * 249
  const monthlyEquivOfYearly = Math.round(totalPerYear / 12 * 100) / 100
  const savingsPerYear = yearlySubs.length * 99 // 99€ saved per yearly sub vs monthly
  const hasYearly = yearlySubs.length > 0
  const hasMonthly = monthlySubs.length > 0

  // Check if any sub is cancelled but still running
  const hasCancelledSub = allSubs.some(s => s.cancelled_at !== null)

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
      <div style={{ width:28, height:28, borderRadius:'50%', border:'3px solid #e8e8e4', borderTopColor:'#2563eb', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:24, letterSpacing:'-0.02em', color:'#1a1a18', margin:'0 0 4px' }}>Abonnement</h1>
        <p style={{ fontSize:14, color:'#888', margin:0 }}>Gérez vos abonnements et votre facturation</p>
      </div>

      {(checkoutStatus === 'success' || checkoutStatus === 'succèss') && (
        <div style={{ background:'#dcfce7', border:'1px solid #bbf7d0', borderRadius:14, padding:'14px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          <span style={{ fontSize:14, color:'#166534', fontWeight:500 }}>Abonnement activé avec succès ! Bienvenue dans StarPulse Pro.</span>
        </div>
      )}
      {checkoutStatus === 'cancelled' && (
        <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:14, padding:'14px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:14, color:'#92400e', fontWeight:500 }}>Le paiement a été annulé. Vous pouvez réessayer quand vous voulez.</span>
        </div>
      )}
      {(nfcStatus === 'success' || nfcStatus === 'succèss') && (
        <div style={{ background:'#dcfce7', border:'1px solid #bbf7d0', borderRadius:14, padding:'14px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          <span style={{ fontSize:14, color:'#166534', fontWeight:500 }}>Commande de tags NFC confirmée !</span>
        </div>
      )}

      <div className="space-y-5">
        {allSubs.length > 0 ? (
          <>
            {/* Récap global */}
            <section style={sectionStyle}>
              <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:18, color:'#1a1a18', margin:'0 0 16px' }}>Vos abonnements</h2>

              {/* Summary bar */}
              <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
                <div style={{ flex:1, minWidth:120, background:'#f9f9f6', borderRadius:12, padding:'14px 16px' }}>
                  <p style={{ fontSize:11, color:'#888', margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>Établissements</p>
                  <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:20, color:'#1a1a18', margin:0 }}>{activeSubs.length}</p>
                </div>
                <div style={{ flex:1, minWidth:120, background:'#f9f9f6', borderRadius:12, padding:'14px 16px' }}>
                  <p style={{ fontSize:11, color:'#888', margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>
                    {allTrialing ? 'Après l\'essai' : 'Facturation'}
                  </p>
                  <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:20, color:'#1a1a18', margin:0 }}>
                    {allTrialing ? (
                      <>
                        {hasYearly && !hasMonthly && `${totalPerYear}€/an`}
                        {!hasYearly && hasMonthly && `${totalPerMonth}€/mois`}
                        {hasYearly && hasMonthly && `${totalPerYear}€/an`}
                      </>
                    ) : (
                      <>
                        {hasYearly && !hasMonthly && `${totalPerYear}€/an`}
                        {!hasYearly && hasMonthly && `${totalPerMonth}€/mois`}
                        {hasYearly && hasMonthly && `~${(monthlyEquivOfYearly + totalPerMonth).toFixed(0)}€/mois`}
                      </>
                    )}
                  </p>
                </div>
                {savingsPerYear > 0 && (
                  <div style={{ flex:1, minWidth:120, background:'#f0fdf4', borderRadius:12, padding:'14px 16px' }}>
                    <p style={{ fontSize:11, color:'#059669', margin:'0 0 4px', textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:500 }}>Économies</p>
                    <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:20, color:'#059669', margin:0 }}>{savingsPerYear}€/an</p>
                    <p style={{ fontSize:10, color:'#059669', margin:'3px 0 0', opacity:0.7 }}>sur {yearlySubs.length > 1 ? `vos ${yearlySubs.length} abonnements annuels` : 'votre abonnement annuel'}</p>
                  </div>
                )}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {allSubs.map(sub => {
                  const statusInfo = getStatusInfo(sub)
                  const endDate = getEndDate(sub)
                  const isCancelled = sub.cancelled_at !== null

                  return (
                    <div key={sub.id} style={{ background: isCancelled ? '#fefce8' : '#f5f5f0', borderRadius:14, padding:'16px 18px', border: isCancelled ? '1px solid #fde68a' : '1px solid transparent' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
                          {sub.establishment_logo ? (
                            <img src={sub.establishment_logo} alt="" style={{ width:32, height:32, borderRadius:8, objectFit:'cover', flexShrink:0 }}/>
                          ) : (
                            <div style={{ width:32, height:32, borderRadius:8, background:`${sub.establishment_color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              <span style={{ fontSize:13, fontWeight:700, color:sub.establishment_color }}>{sub.establishment_name.charAt(0)}</span>
                            </div>
                          )}
                          <div style={{ minWidth:0 }}>
                            <p style={{ fontSize:14, fontWeight:600, color:'#1a1a18', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sub.establishment_name}</p>
                            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2, flexWrap:'wrap' }}>
                              <span style={{
                                display:'inline-block', padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:600,
                                background: statusInfo.bg, color: statusInfo.color,
                              }}>
                                {statusInfo.label}
                              </span>
                              {!isCancelled && sub.status === 'trialing' && sub.trial_ends_at && (
                                <span style={{ fontSize:11, color:'#888' }}>
                                  jusqu'au {new Date(sub.trial_ends_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          {!isCancelled && sub.status === 'trialing' ? (
                            <>
                              <span style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:18, color:'#1a1a18' }}>0€</span>
                              <p style={{ fontSize:11, color:'#888', margin:'2px 0 0' }}>puis {sub.plan_interval === 'yearly' ? '249€/an' : '29€/mois'}</p>
                            </>
                          ) : (
                            <>
                              <span style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:18, color: isCancelled ? '#888' : '#1a1a18', textDecoration: isCancelled ? 'line-through' : 'none' }}>
                                {sub.plan_interval === 'yearly' ? '249' : '29'}
                              </span>
                              <span style={{ fontSize:12, color:'#888' }}> EUR/{sub.plan_interval === 'yearly' ? 'an' : 'mois'}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Cancellation notice */}
                      {isCancelled && sub.status !== 'refunded' && endDate && (
                        <div style={{ marginTop:10, padding:'10px 14px', background:'#fff', borderRadius:10, display:'flex', alignItems:'center', gap:8 }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                          <p style={{ fontSize:13, color:'#92400e', margin:0 }}>
                            Abonnement annulé · {sub.status === 'trialing' ? 'Période d\'essai active' : 'Accès maintenu'} jusqu'au <span style={{ fontWeight:600 }}>{endDate}</span>
                          </p>
                        </div>
                      )}

                      {/* Refund notice */}
                      {sub.status === 'refunded' && (
                        <div style={{ marginTop:10, padding:'10px 14px', background:'#f5f3ff', borderRadius:10, display:'flex', alignItems:'center', gap:8, border:'1px solid #e9e5ff' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                          <p style={{ fontSize:13, color:'#5b21b6', margin:0 }}>
                            Abonnement remboursé{sub.cancelled_at ? ` le ${new Date(sub.cancelled_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}` : ''} · Le montant a été recrédité sur votre moyen de paiement.
                          </p>
                        </div>
                      )}

                      {/* Upgrade to yearly banner */}
                      {!isCancelled && (sub.plan_interval === 'monthly' || sub.plan_interval === 'month') && ['active', 'trialing'].includes(sub.status) && (
                        <div style={{ marginTop:10, padding:'12px 16px', background:'linear-gradient(135deg, #eff6ff, #f0fdf4)', borderRadius:10, border:'1px solid #dbeafe', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                          <div style={{ minWidth:0 }}>
                            <p style={{ fontSize:13, fontWeight:600, color:'#1a1a18', margin:'0 0 2px' }}>
                              Passez à l'annuel et économisez 99€/an
                            </p>
                            <p style={{ fontSize:11, color:'#888', margin:0 }}>
                              249€/an au lieu de 348€ · soit 20,75€/mois
                            </p>
                          </div>
                          <button
                            onClick={() => switchPlan(sub.id, 'yearly')}
                            disabled={switchingPlan === sub.id}
                            style={{
                              padding:'8px 18px', borderRadius:10, border:'none', cursor: switchingPlan === sub.id ? 'wait' : 'pointer',
                              background:'linear-gradient(135deg, #2563eb, #1d4ed8)', color:'#fff', fontSize:13, fontWeight:600,
                              fontFamily:'"Outfit",system-ui', whiteSpace:'nowrap', flexShrink:0, opacity: switchingPlan === sub.id ? 0.7 : 1,
                            }}>
                            {switchingPlan === sub.id ? 'Changement...' : 'Passer à l\'annuel'}
                          </button>
                        </div>
                      )}

                    </div>
                  )
                })}
              </div>
            </section>

            {/* Billing portal */}
            <section style={sectionStyle}>
              <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', margin:'0 0 12px' }}>Facturation</h2>
              <button onClick={openBillingPortal} disabled={portalLoading}
                style={{
                  display:'flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:12, border:'1.5px solid #e8e8e4',
                  background:'#fff', color:'#555', fontSize:14, fontWeight:500, cursor: portalLoading ? 'wait' : 'pointer',
                  fontFamily:'"Outfit",system-ui', transition:'all 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget).style.borderColor='#ccc'; (e.currentTarget).style.boxShadow='0 2px 8px rgba(0,0,0,0.04)' }}
                onMouseLeave={(e) => { (e.currentTarget).style.borderColor='#e8e8e4'; (e.currentTarget).style.boxShadow='none' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                {portalLoading ? 'Ouverture...' : hasCancelledSub ? 'Réactiver ou gérer la facturation (Stripe)' : 'Gérer la facturation (Stripe)'}
              </button>
              <p style={{ fontSize:11, color:'#aaa', marginTop:8 }}>
                {hasCancelledSub
                  ? 'Vous pouvez réactiver votre abonnement, changer de plan ou consulter vos factures.'
                  : 'Changement de plan, moyen de paiement, annulation, factures...'}
              </p>
            </section>
          </>
        ) : (
          <section style={sectionStyle}>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ width:56, height:56, borderRadius:16, background:'rgba(37,99,235,0.06)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:20, color:'#1a1a18', margin:'0 0 8px' }}>Activez StarPulse Pro</h2>
              <p style={{ fontSize:14, color:'#888', margin:'0 0 4px' }}>
                Choisissez votre formule pour débloquer toutes les fonctionnalités. Essai gratuit 7 jours.
              </p>
            </div>
            <PricingPage session={session} establishmentId={establishment?.id} embedded />
          </section>
        )}
      </div>
    </div>
  )
}
