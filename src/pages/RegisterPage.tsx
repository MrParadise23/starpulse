import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { UserPlus, Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard/settings'
  const refCode = searchParams.get('ref') || ''
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [referralCode, setReferralCode] = useState(refCode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('Mot de passe : 6 caracteres minimum.'); return }
    setLoading(true); setError('')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim(), password, options: { data: { full_name: fullName.trim() } }
    })
    if (authError) {
      setError(authError.message === 'User already registered' ? 'Un compte existe deja.' : 'Erreur.')
      setLoading(false); return
    }
    if (referralCode.trim() && authData.user) {
      const { data: aff } = await supabase.from('affiliates').select('id').eq('referral_code', referralCode.trim().toUpperCase()).single()
      if (aff) {
        await supabase.from('referrals').insert({
          affiliate_id: aff.id, referred_user_id: authData.user.id,
          commission_end_date: new Date(Date.now() + 24 * 30 * 24 * 60 * 60 * 1000).toISOString()
        })
      }
    }
    navigate(redirectTo)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-display font-bold text-lg">A</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900">Creer un compte</h1>
        </div>
        <form onSubmit={handleRegister} className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom complet</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Jean Dupont"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vous@restaurant.fr"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mot de passe</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="6 caracteres min."
                className="w-full border border-gray-200 rounded-xl p-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Code parrainage <span className="text-gray-400 font-normal">(optionnel)</span></label>
            <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} placeholder="ex: LOUIS42"
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><UserPlus className="w-4 h-4" />Creer mon compte</>}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          Deja un compte ? <Link to="/login" className="text-blue-600 font-medium hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
