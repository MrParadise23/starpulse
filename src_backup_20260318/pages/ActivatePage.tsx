import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import type { Establishment } from '../lib/supabase'
import { Nfc, CheckCircle, LogIn } from 'lucide-react'

export default function ActivatePage({ session }: { session: Session | null }) {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [selectedEst, setSelectedEst] = useState('')
  const [label, setLabel] = useState('')
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [activated, setActivated] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (session) loadEstablishments()
    else setLoading(false)
  }, [session])

  async function loadEstablishments() {
    const { data } = await supabase.from('establishments').select('*')
      .eq('user_id', session!.user.id).order('created_at', { ascending: false })
    if (data && data.length > 0) { setEstablishments(data); setSelectedEst(data[0].id) }
    setLoading(false)
  }

  async function handleActivate() {
    if (!selectedEst || !code) return
    setActivating(true); setError('')
    const { data, error: rpcError } = await supabase.rpc('claim_plate', {
      plate_code: code, target_establishment_id: selectedEst, plate_label: label.trim() || null
    })
    if (rpcError) { setError('Erreur. Reessayez.'); setActivating(false); return }
    const result = data as { success: boolean; error?: string }
    if (!result.success) { setError(result.error || 'Erreur'); setActivating(false); return }
    setActivated(true); setActivating(false)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (activated) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center animate-fade-up">
        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-display font-bold text-gray-900 mb-2">Tag active !</h2>
        <p className="text-gray-600 mb-6">Vos clients peuvent maintenant scanner ce tag.</p>
        <button onClick={() => navigate('/dashboard/plates')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700">
          Voir mes tags
        </button>
      </div>
    </div>
  )

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Nfc className="w-7 h-7 text-blue-600" />
        </div>
        <h1 className="text-xl font-display font-bold text-gray-900 mb-2">Activer ce tag</h1>
        <p className="text-gray-500 text-sm mb-6">Connectez-vous pour activer ce tag NFC.</p>
        <div className="space-y-3">
          <Link to={`/login?redirect=/activate/${code}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700">
            <LogIn className="w-4 h-4" />Se connecter
          </Link>
          <Link to={`/register?redirect=/activate/${code}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50">
            Creer un compte
          </Link>
        </div>
      </div>
    </div>
  )

  if (establishments.length === 0) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm text-center">
        <Nfc className="w-14 h-14 text-blue-600 mx-auto mb-4" />
        <h1 className="text-xl font-display font-bold text-gray-900 mb-2">Presque la !</h1>
        <p className="text-gray-500 text-sm mb-6">Configurez d'abord votre etablissement.</p>
        <button onClick={() => navigate('/dashboard/settings')}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700">
          Configurer
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Nfc className="w-7 h-7 text-blue-600" />
          </div>
          <h1 className="text-xl font-display font-bold text-gray-900 mb-1">Activer le tag</h1>
          <p className="text-gray-500 text-sm">Code : <span className="font-mono font-semibold">{code}</span></p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-6">
          {establishments.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Etablissement</label>
              <select value={selectedEst} onChange={(e) => setSelectedEst(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {establishments.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          )}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Emplacement (optionnel)</label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder="ex: Table 3, Comptoir, Sortie..."
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button onClick={handleActivate} disabled={activating}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {activating ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><CheckCircle className="w-4 h-4" />Activer ce tag</>}
          </button>
        </div>
      </div>
    </div>
  )
}
