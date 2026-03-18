import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Affiliate } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { Users, Copy, Check, Link as LinkIcon, Euro } from 'lucide-react'

interface DashboardContext {
  session: Session
}

interface Referral {
  id: string
  referred_user_id: string
  status: string
  created_at: string
  profiles?: { email: string; full_name: string } | null
}

export default function AffiliatePage() {
  const { session } = useOutletContext<DashboardContext>()
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<'link' | 'code' | null>(null)

  useEffect(() => {
    loadAffiliate()
  }, [])

  async function loadAffiliate() {
    const { data: affData } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', session.user.id)
      .single()

    if (affData) {
      setAffiliate(affData)

      const { data: refData } = await supabase
        .from('referrals')
        .select('*')
        .eq('affiliate_id', affData.id)
        .order('created_at', { ascending: false })

      setReferrals(refData || [])
    }
    setLoading(false)
  }

  async function copyToClipboard(text: string, type: 'link' | 'code') {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!affiliate) return null

  const baseUrl = window.location.origin
  const referralLink = `${baseUrl}/register?ref=${affiliate.referral_code}`
  const activeReferrals = referrals.filter(r => r.status === 'active').length
  const monthlyCommission = activeReferrals * 29 * affiliate.commission_rate // estimation

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Affiliation</h1>
        <p className="text-gray-500 text-sm mt-1">
          Recommandez notre solution et touchez {affiliate.commission_rate * 100}% sur chaque abonnement pendant {affiliate.commission_duration_months} mois.
        </p>
      </div>

      {/* Lien et code */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
        <h2 className="font-display font-semibold text-gray-900 mb-4">Votre lien de parrainage</h2>

        <div className="space-y-3">
          {/* Lien */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Lien d'inscription</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 rounded-xl p-3 text-sm text-gray-700 font-mono truncate">
                {referralLink}
              </div>
              <button
                onClick={() => copyToClipboard(referralLink, 'link')}
                className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shrink-0"
              >
                {copied === 'link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Code */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Code parrainage</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 rounded-xl p-3 text-sm text-gray-900 font-mono font-bold">
                {affiliate.referral_code}
              </div>
              <button
                onClick={() => copyToClipboard(affiliate.referral_code, 'code')}
                className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shrink-0"
              >
                {copied === 'code' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
            <Users className="w-[18px] h-[18px] text-blue-600" />
          </div>
          <p className="text-2xl font-display font-bold text-gray-900">{activeReferrals}</p>
          <p className="text-sm text-gray-500">Filleul(s) actif(s)</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
            <Euro className="w-[18px] h-[18px] text-emerald-600" />
          </div>
          <p className="text-2xl font-display font-bold text-gray-900">{monthlyCommission.toFixed(0)} EUR</p>
          <p className="text-sm text-gray-500">Commission estimee / mois</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
            <LinkIcon className="w-[18px] h-[18px] text-purple-600" />
          </div>
          <p className="text-2xl font-display font-bold text-gray-900">{affiliate.total_earned.toFixed(0)} EUR</p>
          <p className="text-sm text-gray-500">Total gagne</p>
        </div>
      </div>

      {/* Liste des filleuls */}
      {referrals.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h2 className="font-display font-semibold text-gray-900 mb-4">Vos filleuls</h2>
          <div className="space-y-3">
            {referrals.map((ref) => (
              <div key={ref.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Filleul inscrit le {new Date(ref.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  ref.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {ref.status === 'active' ? 'Actif' : 'Inactif'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
