import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Establishment, Feedback } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { Star, Mail, Phone, Check, Clock, Inbox, User } from 'lucide-react'

interface DashboardContext { establishment: Establishment | null; session: Session }

export default function RetourPrivesPage() {
  const { establishment } = useOutletContext<DashboardContext>()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'treated'>('all')

  useEffect(() => { if (establishment) loadFeedbacks(); else setLoading(false) }, [establishment, filter])

  async function loadFeedbacks() {
    let query = supabase.from('feedbacks').select('*').eq('establishment_id', establishment!.id).order('created_at', { ascending: false })
    if (filter === 'unread') query = query.eq('status', 'unread')
    if (filter === 'treated') query = query.eq('status', 'treated')
    const { data } = await query
    setFeedbacks(data || [])
    setLoading(false)
  }

  async function markAs(id: string, status: string) {
    await supabase.from('feedbacks').update({ status }).eq('id', id)
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status } : f))
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return 'Il y a moins d\'1h'
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${Math.floor(hours / 24)}j`
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Retours prives</h1>
        <p className="text-gray-500 text-sm mt-1">Les retours des clients insatisfaits, visibles uniquement par vous. Ces retours ne sont jamais publies.</p>
      </div>

      <div className="flex gap-2 mb-6">
        {([['all', 'Tous'], ['unread', 'Non lus'], ['treated', 'Traites']] as const).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === key ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : feedbacks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Aucun retour</p>
          <p className="text-gray-400 text-sm mt-1">Les retours de vos clients insatisfaits apparaitront ici.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((fb) => (
            <div key={fb.id} className={`bg-white rounded-2xl border p-5 ${fb.status === 'unread' ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {fb.rating && (
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => <Star key={s} className="w-3.5 h-3.5" fill={s <= fb.rating! ? '#facc15' : 'none'} color={s <= fb.rating! ? '#facc15' : '#d1d5db'} />)}
                    </div>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    fb.status === 'unread' ? 'bg-amber-100 text-amber-700' : fb.status === 'treated' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                  }`}>{fb.status === 'unread' ? 'Non lu' : fb.status === 'treated' ? 'Traite' : 'Lu'}</span>
                </div>
                <span className="text-xs text-gray-400">{timeAgo(fb.created_at)}</span>
              </div>

              {fb.comment && <p className="text-sm text-gray-700 mb-3">{fb.comment}</p>}

              {/* Informations de contact */}
              {(fb.client_first_name || fb.client_email || fb.client_phone) ? (
                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Le client souhaite etre recontacte</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    {fb.client_first_name && (
                      <span className="flex items-center gap-1 text-xs text-gray-700"><User className="w-3.5 h-3.5 text-gray-400" />{fb.client_first_name}</span>
                    )}
                    {fb.client_email && (
                      <a href={`mailto:${fb.client_email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Mail className="w-3.5 h-3.5" />{fb.client_email}</a>
                    )}
                    {fb.client_phone && (
                      <a href={`tel:${fb.client_phone}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Phone className="w-3.5 h-3.5" />{fb.client_phone}</a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 mb-3">Retour anonyme (pas de contact laisse)</p>
              )}

              <div className="flex items-center gap-1">
                {fb.status !== 'treated' && (
                  <button onClick={() => markAs(fb.id, 'treated')}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100">
                    <Check className="w-3.5 h-3.5" />Traite
                  </button>
                )}
                {fb.status === 'unread' && (
                  <button onClick={() => markAs(fb.id, 'read')}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <Clock className="w-3.5 h-3.5" />Marquer lu
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
