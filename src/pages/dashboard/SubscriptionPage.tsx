import { useEffect, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Establishment } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import PricingPage from '../PricingPage'

interface DashboardContext { establishment: Establishment | null; session: Session; refreshEstablishments: () => Promise<void> }

interface Subscription {
  id: string
  plan: string
  plan_interval: string
  status: string
  trial_ends_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancelled_at: string | null
  price_monthly: number
  stripe_subscription_id: string | null
}

export default function SubscriptionPage() {
  const { establishment, session } = useOutletContext<DashboardContext>()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [portalLoading, setPortalLoading] = useState(false)
  const [searchParams] = useSearchParams()

  const checkoutStatus = searchParams.get('checkout')
  const nfcStatus = searchParams.get('nfc_order')

  useEffect(() => { loadSubscription() }, [establishment])

  async function loadSubscription() {
    if (!establishment) { setLoading(false); return }
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('establishment_id', establishment.id)
      .in('status', ['active', 'trialing', 'canceling', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    setSubscription(data)
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

  const statusLabels: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: 'Actif', color: '#059669', bg: '#dcfce7' },
    trialing: { label: 'Essai gratuit', color: '#2563eb', bg: '#dbeafe' },
    canceling: { label: 'Annulation en cours', color: '#d97706', bg: '#fef3c7' },
    past_due: { label: 'Paiement en retard', color: '#dc2626', bg: '#fee2e2' },
    cancelled: { label: 'Annulé', color: '#888', bg: '#f5f5f0' },
  }

  const sectionStyle = { background:'#fff', borderRadius:20, border:'1px solid #f0f0ec', padding:'24px' } as const

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
        <p style={{ fontSize:14, color:'#888', margin:0 }}>Gérez votre abonnement et votre facturation</p>
      </div>

      {/* Success/cancel banners */}
      {checkoutStatus === 'succèss' && (
        <div style={{ background:'#dcfce7', border:'1px solid #bbf7d0', borderRadius:14, padding:'14px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          <span style={{ fontSize:14, color:'#166534', fontWeight:500 }}>Abonnement active avec succès ! Bienvenue dans StarPulse Pro.</span>
        </div>
      )}
      {checkoutStatus === 'cancelled' && (
        <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:14, padding:'14px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:14, color:'#92400e', fontWeight:500 }}>Le paiement a été annule. Vous pouvez réessayer quand vous voulez.</span>
        </div>
      )}
      {nfcStatus === 'succèss' && (
        <div style={{ background:'#dcfce7', border:'1px solid #bbf7d0', borderRadius:14, padding:'14px 20px', marginBottom:20, display:'flex', alignItems:'center', gap:10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
          <span style={{ fontSize:14, color:'#166534', fontWeight:500 }}>Commande de tags NFC confirmée ! Vous recevrez un email de confirmation.</span>
        </div>
      )}

      <div className="space-y-5">
        {/* Current subscription */}
        {subscription ? (
          <section style={sectionStyle}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
              <div>
                <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:18, color:'#1a1a18', margin:'0 0 4px' }}>StarPulse Pro</h2>
                <span style={{
                  display:'inline-block', padding:'3px 10px', borderRadius:8, fontSize:12, fontWeight:600,
                  background: statusLabels[subscription.status]?.bg || '#f5f5f0',
                  color: statusLabels[subscription.status]?.color || '#888',
                }}>
                  {statusLabels[subscription.status]?.label || subscription.status}
                </span>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'"Outfit",system-ui', fontWeight:800, fontSize:32, color:'#1a1a18', letterSpacing:'-0.03em', lineHeight:1 }}>
                  {subscription.plan_interval === 'yearly' ? '249' : '29'}
                  <span style={{ fontSize:14, fontWeight:500, color:'#888' }}> EUR/{subscription.plan_interval === 'yearly' ? 'an' : 'mois'}</span>
                </div>
              </div>
            </div>

            <div style={{ background:'#f5f5f0', borderRadius:14, padding:'16px 20px', marginBottom:16 }}>
              {subscription.status === 'trialing' && subscription.trial_ends_at && (
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                  <span style={{ fontSize:13, color:'#666' }}>Fin de l'essai gratuit</span>
                  <span style={{ fontSize:13, fontWeight:600, color:'#2563eb' }}>
                    {new Date(subscription.trial_ends_at).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })}
                  </span>
                </div>
              )}
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:13, color:'#666' }}>Periode actuelle</span>
                <span style={{ fontSize:13, color:'#555' }}>
                  {subscription.current_period_start ? new Date(subscription.current_period_start).toLocaleDateString('fr-FR') : '—'}
                  {' → '}
                  {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString('fr-FR') : '—'}
                </span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:13, color:'#666' }}>Formule</span>
                <span style={{ fontSize:13, fontWeight:500, color:'#555' }}>
                  {subscription.plan_interval === 'yearly' ? 'Annuel' : 'Mensuel'}
                </span>
              </div>
              {subscription.cancelled_at && (
                <div style={{ display:'flex', justifyContent:'space-between' }}>
                  <span style={{ fontSize:13, color:'#666' }}>Annulation demandee le</span>
                  <span style={{ fontSize:13, color:'#d97706', fontWeight:500 }}>
                    {new Date(subscription.cancelled_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </div>

            {subscription.status === 'canceling' && (
              <div style={{ background:'#fef3c7', borderRadius:12, padding:'12px 16px', marginBottom:16 }}>
                <p style={{ fontSize:13, color:'#92400e', margin:0 }}>
                  Votre abonnement reste actif jusqu'au {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }) : '—'}. Vous pouvez le réactiver à tout moment.
                </p>
              </div>
            )}

            {subscription.status === 'past_due' && (
              <div style={{ background:'#fee2e2', borderRadius:12, padding:'12px 16px', marginBottom:16 }}>
                <p style={{ fontSize:13, color:'#991b1b', margin:0 }}>
                  Le dernier paiement a échoué. Veuillez mettre a jour votre moyen de paiement pour éviter l'interruption du service.
                </p>
              </div>
            )}

            <button onClick={openBillingPortal} disabled={portalLoading}
              style={{
                display:'flex', alignItems:'center', gap:8, padding:'12px 24px', borderRadius:12, border:'1.5px solid #e8e8e4',
                background:'#fff', color:'#555', fontSize:14, fontWeight:500, cursor: portalLoading ? 'wait' : 'pointer',
                fontFamily:'"Outfit",system-ui', transition:'all 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget).style.borderColor='#ccc'; (e.currentTarget).style.boxShadow='0 2px 8px rgba(0,0,0,0.04)' }}
              onMouseLeave={(e) => { (e.currentTarget).style.borderColor='#e8e8e4'; (e.currentTarget).style.boxShadow='none' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              {portalLoading ? 'Ouverture...' : 'Gérer la facturation (Stripe)'}
            </button>
            <p style={{ fontSize:11, color:'#aaa', marginTop:8 }}>
              Changement de plan, mise a jour du moyen de paiement, annulation, factures...
            </p>
          </section>
        ) : (
          /* No subscription - show pricing */
          <section style={sectionStyle}>
            <div style={{ textAlign:'center', marginBottom:24 }}>
              <div style={{ width:56, height:56, borderRadius:16, background:'rgba(37,99,235,0.06)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </div>
              <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:20, color:'#1a1a18', margin:'0 0 8px' }}>Activez StarPulse Pro</h2>
              <p style={{ fontSize:14, color:'#888', margin:'0 0 4px' }}>
                {establishment ? 'Choisissez votre formule pour débloquer toutes les fonctionnalités.' : 'Créez d\'abord votre établissement dans les Réglages.'}
              </p>
            </div>
            {establishment && (
              <PricingPage session={session} establishmentId={establishment.id} embedded />
            )}
          </section>
        )}
      </div>
    </div>
  )
}
