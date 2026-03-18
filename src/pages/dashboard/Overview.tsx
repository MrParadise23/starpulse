import { useEffect, useState } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Establishment } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'

interface DashboardContext { establishment: Establishment | null; session: Session }
interface Stats { totalScans: number; scansThisWeek: number; unreadFeedbacks: number; totalFeedbacks: number; pendingReplies: number; positiveRate: number }

export default function Overview() {
  const { establishment } = useOutletContext<DashboardContext>()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (establishment) loadStats(); else setLoading(false) }, [establishment])

  async function loadStats() {
    const estId = establishment!.id
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const [scansAll, scansWeek, fbAll, fbUnread, revPending] = await Promise.all([
      supabase.from('scans').select('id', { count: 'exact', head: true }).eq('establishment_id', estId),
      supabase.from('scans').select('id', { count: 'exact', head: true }).eq('establishment_id', estId).gte('created_at', weekAgo),
      supabase.from('feedbacks').select('id', { count: 'exact', head: true }).eq('establishment_id', estId),
      supabase.from('feedbacks').select('id', { count: 'exact', head: true }).eq('establishment_id', estId).eq('status', 'unread'),
      supabase.from('google_reviews').select('id', { count: 'exact', head: true }).eq('establishment_id', estId).eq('reply_status', 'pending'),
    ])
    const { data: redirectScans } = await supabase.from('scans').select('result').eq('establishment_id', estId)
    const total = redirectScans?.length || 0
    const positive = redirectScans?.filter(s => s.result === 'redirect').length || 0
    setStats({
      totalScans: scansAll.count || 0, scansThisWeek: scansWeek.count || 0,
      totalFeedbacks: fbAll.count || 0, unreadFeedbacks: fbUnread.count || 0,
      pendingReplies: revPending.count || 0, positiveRate: total > 0 ? Math.round((positive / total) * 100) : 0
    })
    setLoading(false)
  }

  if (!establishment) return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      <div style={{ textAlign: 'center', maxWidth: 420, margin: '80px auto', padding: '0 20px' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 32px rgba(37,99,235,0.25)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
        <h1 style={{ fontFamily: '"Outfit",system-ui', fontWeight: 700, fontSize: 24, color: '#1a1a18', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Bienvenue sur StarPulse</h1>
        <p style={{ fontSize: 15, color: '#888', lineHeight: 1.6, margin: '0 0 28px' }}>Configurez votre premier etablissement pour commencer a collecter et gerer vos avis clients.</p>
        <Link to="/dashboard/settings" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 14, border: 'none',
          background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff', fontSize: 15, fontWeight: 600,
          fontFamily: '"Outfit",system-ui', textDecoration: 'none', boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
          transition: 'transform 0.1s', letterSpacing: '-0.01em'
        }}>
          Configurer mon etablissement
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e8e8e4', borderTopColor: '#2563eb', animation: 'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const cards = [
    { label: 'Scans cette semaine', value: stats?.scansThisWeek || 0, sub: `${stats?.totalScans || 0} au total`, color: '#2563eb', bg: 'rgba(37,99,235,0.06)', icon: 'scan', link: '' },
    { label: 'Taux positif', value: `${stats?.positiveRate || 0}%`, sub: 'Rediriges vers Google', color: '#059669', bg: 'rgba(5,150,105,0.06)', icon: 'trend', link: '' },
    { label: 'Retours non lus', value: stats?.unreadFeedbacks || 0, sub: `sur ${stats?.totalFeedbacks || 0} total`, color: '#d97706', bg: 'rgba(217,119,6,0.06)', icon: 'msg', link: '/dashboard/retours' },
    { label: 'Avis en attente', value: stats?.pendingReplies || 0, sub: 'de reponse', color: '#7c3aed', bg: 'rgba(124,58,237,0.06)', icon: 'star', link: '/dashboard/reviews' },
  ]

  function CardIcon({ type, color }: { type: string; color: string }) {
    const p = { width: 18, height: 18, fill: 'none', stroke: color, strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
    switch (type) {
      case 'scan': return <svg {...p} viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
      case 'trend': return <svg {...p} viewBox="0 0 24 24"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
      case 'msg': return <svg {...p} viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
      case 'star': return <svg {...p} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      default: return null
    }
  }

  return (
    <div style={{ animation: 'fadeUp 0.5s ease-out' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: '"Outfit",system-ui', fontWeight: 700, fontSize: 24, color: '#1a1a18', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Vue d'ensemble</h1>
        <p style={{ fontSize: 14, color: '#999', margin: 0 }}>{establishment.name}</p>
      </div>

      {/* Note Google si dispo */}
      {establishment.current_google_rating && (
        <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f0f0ec', padding: '18px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14, animation: 'fadeUp 0.5s ease-out 0.05s both' }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {[1,2,3,4,5].map(s => (
              <svg key={s} width="20" height="20" viewBox="0 0 24 24" fill={s <= Math.round(establishment.current_google_rating!) ? '#FBBF24' : 'none'} stroke={s <= Math.round(establishment.current_google_rating!) ? '#F59E0B' : '#D1D5DB'} strokeWidth="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ))}
          </div>
          <span style={{ fontFamily: '"Outfit",system-ui', fontWeight: 700, fontSize: 22, color: '#1a1a18' }}>{establishment.current_google_rating}</span>
          <span style={{ fontSize: 13, color: '#999' }}>({establishment.total_google_reviews} avis Google)</span>
        </div>
      )}

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {cards.map((card, i) => {
          const Tag = card.link ? Link : 'div'
          const linkProps = card.link ? { to: card.link } : {}
          return (
            <Tag key={card.label} {...linkProps as any} style={{
              background: '#fff', borderRadius: 16, border: '1px solid #f0f0ec', padding: '20px',
              textDecoration: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
              cursor: card.link ? 'pointer' : 'default',
              animation: `fadeUp 0.5s ease-out ${0.05 + i * 0.05}s both`
            }}
              onMouseEnter={(e: any) => { if (card.link) { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)' } }}
              onMouseLeave={(e: any) => { if (card.link) { e.currentTarget.style.borderColor = '#f0f0ec'; e.currentTarget.style.boxShadow = 'none' } }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <CardIcon type={card.icon} color={card.color}/>
              </div>
              <p style={{ fontFamily: '"Outfit",system-ui', fontWeight: 700, fontSize: 26, color: '#1a1a18', margin: '0 0 2px', letterSpacing: '-0.02em' }}>{card.value}</p>
              <p style={{ fontSize: 13, color: '#666', margin: '0 0 2px', fontWeight: 500 }}>{card.label}</p>
              <p style={{ fontSize: 12, color: '#bbb', margin: 0 }}>{card.sub}</p>
            </Tag>
          )
        })}
      </div>

      {/* Quick actions */}
      <div style={{ marginTop: 28, display: 'flex', gap: 10, flexWrap: 'wrap', animation: 'fadeUp 0.5s ease-out 0.3s both' }}>
        <Link to="/dashboard/plates" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: '1px solid #e8e8e4', background: '#fff', fontSize: 13, fontWeight: 500, color: '#555', textDecoration: 'none', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.borderColor = '#2563eb'; (e.target as HTMLElement).style.color = '#2563eb' }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.borderColor = '#e8e8e4'; (e.target as HTMLElement).style.color = '#555' }}>
          Gerer mes QR codes
        </Link>
        <Link to="/dashboard/reviews" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: '1px solid #e8e8e4', background: '#fff', fontSize: 13, fontWeight: 500, color: '#555', textDecoration: 'none', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.borderColor = '#2563eb'; (e.target as HTMLElement).style.color = '#2563eb' }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.borderColor = '#e8e8e4'; (e.target as HTMLElement).style.color = '#555' }}>
          Voir les avis Google
        </Link>
        <Link to="/dashboard/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: '1px solid #e8e8e4', background: '#fff', fontSize: 13, fontWeight: 500, color: '#555', textDecoration: 'none', transition: 'all 0.15s' }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.borderColor = '#2563eb'; (e.target as HTMLElement).style.color = '#2563eb' }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.borderColor = '#e8e8e4'; (e.target as HTMLElement).style.color = '#555' }}>
          Reglages
        </Link>
      </div>

      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
