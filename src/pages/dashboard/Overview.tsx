import { useEffect, useState } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Establishment } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { Scan, Star, MessageSquareText, TrendingUp, ArrowRight } from 'lucide-react'

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
    <div>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">Bienvenue !</h1>
      <p className="text-gray-500 mb-6">Configurez votre premier etablissement pour commencer.</p>
      <Link to="/dashboard/settings" className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700">
        Configurer mon etablissement <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>

  const cards = [
    { label: 'Scans cette semaine', value: stats?.scansThisWeek || 0, sub: `${stats?.totalScans || 0} au total`, icon: Scan, color: 'bg-blue-50 text-blue-600', link: '' },
    { label: 'Taux positif', value: `${stats?.positiveRate || 0}%`, sub: 'Rediriges vers Google', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600', link: '' },
    { label: 'Retours non lus', value: stats?.unreadFeedbacks || 0, sub: `sur ${stats?.totalFeedbacks || 0} total`, icon: MessageSquareText, color: 'bg-amber-50 text-amber-600', link: '/dashboard/retours' },
    { label: 'Avis en attente', value: stats?.pendingReplies || 0, sub: 'de reponse', icon: Star, color: 'bg-purple-50 text-purple-600', link: '/dashboard/reviews' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Vue d'ensemble</h1>
        <p className="text-gray-500 text-sm mt-1">{establishment.name}</p>
      </div>
      {establishment.current_google_rating && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 flex items-center gap-4">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(s => <Star key={s} className="w-5 h-5" fill={s <= Math.round(establishment.current_google_rating!) ? '#facc15' : 'none'} color={s <= Math.round(establishment.current_google_rating!) ? '#facc15' : '#d1d5db'} />)}
          </div>
          <span className="text-2xl font-display font-bold text-gray-900">{establishment.current_google_rating}</span>
          <span className="text-gray-500 text-sm">({establishment.total_google_reviews} avis)</span>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map(card => {
          const Wrapper = card.link ? Link : 'div' as any
          return (
            <Wrapper key={card.label} to={card.link || undefined} className={`bg-white rounded-2xl border border-gray-200 p-5 ${card.link ? 'hover:border-gray-300 cursor-pointer' : ''}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}><card.icon className="w-[18px] h-[18px]" /></div>
              <p className="text-2xl font-display font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
              <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
            </Wrapper>
          )
        })}
      </div>
    </div>
  )
}
