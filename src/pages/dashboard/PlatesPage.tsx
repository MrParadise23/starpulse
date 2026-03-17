import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Establishment, Plate } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { Nfc, QrCode, Copy, Check, ExternalLink, Tag, Download, Plus } from 'lucide-react'

interface DashboardContext { establishment: Establishment | null; session: Session }

export default function PlatesPage() {
  const { establishment } = useOutletContext<DashboardContext>()
  const [plates, setPlates] = useState<(Plate & { scan_count?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showCreateQr, setShowCreateQr] = useState(false)
  const [newQrLabel, setNewQrLabel] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => { if (establishment) loadPlates(); else setLoading(false) }, [establishment])

  async function loadPlates() {
    const { data } = await supabase.from('plates').select('*').eq('establishment_id', establishment!.id).order('created_at', { ascending: false })
    if (data) {
      const withScans = await Promise.all(data.map(async (p) => {
        const { count } = await supabase.from('scans').select('id', { count: 'exact', head: true }).eq('plate_id', p.id)
        return { ...p, scan_count: count || 0 }
      }))
      setPlates(withScans)
    }
    setLoading(false)
  }

  function getPlateUrl(plate: Plate & { scan_count?: number }) {
    // CDC: NFC = /t/:code, QR = /r/:code
    const prefix = plate.plate_type === 'qr' ? '/r/' : '/t/'
    return `${window.location.origin}${prefix}${plate.code}`
  }

  async function copyUrl(plate: Plate & { scan_count?: number }) {
    await navigator.clipboard.writeText(getPlateUrl(plate))
    setCopiedId(plate.id); setTimeout(() => setCopiedId(null), 2000)
  }

  function getQrImageUrl(plate: Plate & { scan_count?: number }) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(getPlateUrl(plate))}`
  }

  function downloadQr(plate: Plate & { scan_count?: number }) {
    const link = document.createElement('a')
    link.href = getQrImageUrl(plate)
    link.download = `qr-${plate.label || plate.code}.png`
    link.click()
  }

  async function createQrCode() {
    if (!establishment) return
    setCreating(true)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()
    await supabase.from('plates').insert({
      code, establishment_id: establishment.id, label: newQrLabel.trim() || null,
      plate_type: 'qr', is_active: true, activated_at: new Date().toISOString()
    })
    setNewQrLabel(''); setShowCreateQr(false); setCreating(false)
    loadPlates()
  }

  const nfcPlates = plates.filter(p => p.plate_type === 'nfc')
  const qrPlates = plates.filter(p => p.plate_type === 'qr')

  if (!establishment) return (
    <div>
      <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">Tags NFC & QR Codes</h1>
      <p className="text-gray-500">Configurez d'abord votre etablissement.</p>
    </div>
  )

  const PlateCard = ({ plate }: { plate: Plate & { scan_count?: number } }) => (
    <div className="bg-white rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plate.plate_type === 'nfc' ? 'bg-blue-50' : 'bg-purple-50'}`}>
            {plate.plate_type === 'nfc' ? <Nfc className="w-5 h-5 text-blue-600" /> : <QrCode className="w-5 h-5 text-purple-600" />}
          </div>
          <div>
            <p className="font-medium text-gray-900">{plate.label || `${plate.plate_type === 'nfc' ? 'Tag' : 'QR'} ${plate.code}`}</p>
            <p className="text-xs text-gray-400 font-mono">{plate.code}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-900">{plate.scan_count}</p>
            <p className="text-xs text-gray-400">scans</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => copyUrl(plate)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Copier le lien">
              {copiedId === plate.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button onClick={() => downloadQr(plate)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Telecharger le QR code">
              <Download className="w-4 h-4" />
            </button>
            <a href={getPlateUrl(plate)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Tester">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
      {/* Apercu QR */}
      {plate.plate_type === 'qr' && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-3">
          <img src={getQrImageUrl(plate)} alt="QR Code" className="w-16 h-16 rounded-lg" />
          <p className="text-xs text-gray-400">Telechargez ce QR code et imprimez-le pour vos clients.</p>
        </div>
      )}
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-gray-900">Tags NFC & QR Codes</h1>
        <p className="text-gray-500 text-sm mt-1">{plates.length} support(s) actif(s)</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-8">
          {/* Section Tags NFC */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-gray-900 flex items-center gap-2">
                <Nfc className="w-4 h-4 text-blue-600" /> Tags NFC
              </h2>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 mb-3">
              <p className="text-xs text-blue-800">Scannez un tag NFC avec votre telephone pour l'activer. Le tag sera automatiquement lie a votre etablissement.</p>
            </div>
            {nfcPlates.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                <Tag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucun tag NFC active. Scannez votre premier tag pour l'activer.</p>
              </div>
            ) : (
              <div className="space-y-3">{nfcPlates.map(p => <PlateCard key={p.id} plate={p} />)}</div>
            )}
          </section>

          {/* Section QR Codes */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-gray-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-purple-600" /> QR Codes
              </h2>
              <button onClick={() => setShowCreateQr(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100">
                <Plus className="w-3.5 h-3.5" /> Creer un QR code
              </button>
            </div>

            {/* Formulaire de creation */}
            {showCreateQr && (
              <div className="bg-white rounded-2xl border border-blue-200 p-4 mb-3">
                <p className="text-sm font-medium text-gray-900 mb-3">Nouveau QR code</p>
                <input type="text" value={newQrLabel} onChange={(e) => setNewQrLabel(e.target.value)}
                  placeholder="Emplacement (ex: Table 5, Comptoir, Sortie...)"
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3" />
                <div className="flex items-center gap-2">
                  <button onClick={createQrCode} disabled={creating}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {creating ? 'Creation...' : 'Creer'}
                  </button>
                  <button onClick={() => setShowCreateQr(false)} className="px-4 py-2 text-gray-600 text-sm font-medium hover:bg-gray-50 rounded-xl">
                    Annuler
                  </button>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 mb-3">Creez des QR codes intelligents qui redirigent vers votre smart routing. Telechargez-les et imprimez-les ou vous voulez.</p>

            {qrPlates.length === 0 && !showCreateQr ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                <QrCode className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Aucun QR code. Creez votre premier QR code ci-dessus.</p>
              </div>
            ) : (
              <div className="space-y-3">{qrPlates.map(p => <PlateCard key={p.id} plate={p} />)}</div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
