import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import type { Establishment, Plate } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { Wifi, QrCode } from 'lucide-react'

interface DashboardContext { establishment: Establishment | null; session: Session }

export default function PlatesPage() {
  const { establishment } = useOutletContext<DashboardContext>()
  const [plates, setPlates] = useState<(Plate & { scan_count?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showCreateQr, setShowCreateQr] = useState(false)
  const [newQrLabel, setNewQrLabel] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [previewPlate, setPreviewPlate] = useState<(Plate & { scan_count?: number }) | null>(null)
  const [previewRating, setPreviewRating] = useState(0)
  const [previewHover, setPreviewHover] = useState(0)
  const [previewResult, setPreviewResult] = useState<'none' | 'positive' | 'negative'>('none')

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
    await supabase.from('plates').insert({ code, establishment_id: establishment.id, label: newQrLabel.trim() || null, plate_type: 'qr', is_active: true, activated_at: new Date().toISOString() })
    setNewQrLabel(''); setShowCreateQr(false); setCreating(false)
    loadPlates()
  }

  async function saveRename(plateId: string) {
    await supabase.from('plates').update({ label: editLabel.trim() || null }).eq('id', plateId)
    setEditingId(null); setEditLabel('')
    loadPlates()
  }

  async function toggleActive(plate: Plate & { scan_count?: number }) {
    const newState = !plate.is_active
    await supabase.from('plates').update({ is_active: newState }).eq('id', plate.id)
    loadPlates()
  }

  async function archivePlate(plate: Plate & { scan_count?: number }) {
    if (!confirm(`Archiver "${plate.label || plate.code}" ? Il ne sera plus visible mais restera fonctionnel si scanné (page "service indisponible").`)) return
    await supabase.from('plates').update({ archived: true, is_active: false }).eq('id', plate.id)
    loadPlates()
  }

  async function restorePlate(plate: Plate & { scan_count?: number }) {
    await supabase.from('plates').update({ archived: false, is_active: true }).eq('id', plate.id)
    loadPlates()
  }

  function openPreview(plate: Plate & { scan_count?: number }) {
    setPreviewPlate(plate)
    setPreviewRating(0)
    setPreviewHover(0)
    setPreviewResult('none')
  }

  function handlePreviewStar(rating: number) {
    if (!establishment) return
    setPreviewRating(rating)
    const threshold = establishment.satisfaction_threshold || 4
    if (rating >= threshold) {
      setPreviewResult('positive')
    } else {
      setPreviewResult('negative')
    }
  }

  function resetPreview() {
    setPreviewRating(0)
    setPreviewHover(0)
    setPreviewResult('none')
  }

  const activePlates = plates.filter(p => !(p as any).archived)
  const archivedPlates = plates.filter(p => (p as any).archived)
  const nfcPlates = activePlates.filter(p => p.plate_type === 'nfc')
  const qrPlates = activePlates.filter(p => p.plate_type === 'qr')

  if (!establishment) return (
    <div>
      <h1 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:24, color:'#1a1a18', letterSpacing:'-0.02em' }}>Tags NFC & QR Codes</h1>
      <p style={{ color:'#888', fontSize:14, marginTop:4 }}>Configurez d'abord votre établissement dans les Réglages.</p>
    </div>
  )

  const iconBtn: React.CSSProperties = { background:'none', border:'none', padding:6, borderRadius:8, cursor:'pointer', color:'#999', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center' }
  const threshold = establishment.satisfaction_threshold || 4

  const PlateCard = ({ plate, isArchived }: { plate: Plate & { scan_count?: number }, isArchived?: boolean }) => {
    const isEditing = editingId === plate.id
    const isActive = plate.is_active
    return (
      <div style={{ background:'#fff', borderRadius:16, border: isActive ? '1px solid #f0f0ec' : '1px solid #fde68a', padding:16, opacity: isArchived ? 0.7 : 1 }}>
        {!isActive && !isArchived && (
          <div style={{ background:'#fffbeb', borderRadius:8, padding:'6px 10px', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
            <svg width="14" height="14" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="6"/><path d="M7 4.5V7.5M7 9.5h.01"/></svg>
            <span style={{ fontSize:11, color:'#92400e', fontWeight:500 }}>Désactivé</span>
          </div>
        )}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 }}>
            <div style={{ width:40, height:40, borderRadius:10, background: plate.plate_type==='nfc'?'rgba(37,99,235,0.06)':'rgba(124,58,237,0.06)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {plate.plate_type === 'nfc'
                ? <Wifi size={18} color={isActive ? "#2563eb" : "#999"} strokeWidth={1.5} />
                : <QrCode size={18} color={isActive ? "#7c3aed" : "#999"} strokeWidth={1.5} />
              }
            </div>
            <div style={{ minWidth:0, flex:1 }}>
              {isEditing ? (
                <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                  <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="Nouveau nom..."
                    autoFocus onKeyDown={(e) => { if (e.key==='Enter') saveRename(plate.id); if (e.key==='Escape') setEditingId(null) }}
                    style={{ border:'1.5px solid #2563eb', borderRadius:8, padding:'6px 10px', fontSize:13, fontFamily:'inherit', outline:'none', flex:1, minWidth:0 }}/>
                  <button onClick={() => saveRename(plate.id)} style={{ ...iconBtn, color:'#059669' }} title="Sauvegarder">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 6L9 17l-5-5" transform="scale(0.67)"/></svg>
                  </button>
                  <button onClick={() => setEditingId(null)} style={{ ...iconBtn, color:'#999' }} title="Annuler">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" transform="scale(0.67)"/></svg>
                  </button>
                </div>
              ) : (
                <>
                  <p style={{ fontWeight:500, fontSize:14, color: isActive ? '#1a1a18' : '#999', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{plate.label || `${plate.plate_type==='nfc'?'Tag':'QR'} ${plate.code}`}</p>
                  <p style={{ fontSize:12, color:'#bbb', fontFamily:'monospace', margin:0 }}>{plate.code}</p>
                </>
              )}
            </div>
          </div>
          {!isEditing && (
            <div style={{ display:'flex', alignItems:'center', gap:4, flexWrap:'wrap', justifyContent:'flex-end' }}>
              <div style={{ textAlign:'right', marginRight:8 }}>
                <p style={{ fontSize:14, fontWeight:600, color:'#1a1a18', margin:0 }}>{plate.scan_count}</p>
                <p style={{ fontSize:11, color:'#bbb', margin:0 }}>scans</p>
              </div>

              {isArchived ? (
                <button onClick={() => restorePlate(plate)}
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 12px', borderRadius:8, border:'1px solid #d1d5db', background:'#fff', fontSize:12, fontWeight:500, color:'#059669', cursor:'pointer' }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 4v6h6M23 20v-6h-6" transform="scale(0.58)"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" transform="scale(0.58)"/></svg>
                  Restaurer
                </button>
              ) : (
                <>
                  {/* Toggle activer/désactiver */}
                  <button onClick={() => toggleActive(plate)}
                    style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:8, border:'none', background: isActive ? 'rgba(5,150,105,0.08)' : 'rgba(217,119,6,0.08)', fontSize:12, fontWeight:500, color: isActive ? '#059669' : '#d97706', cursor:'pointer' }}
                    title={isActive ? 'Désactiver' : 'Réactiver'}>
                    {isActive ? (
                      <><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="5"/><path d="M5 7l1.5 1.5L9 5.5" /></svg>Actif</>
                    ) : (
                      <><svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="7" r="5"/><path d="M5.5 5.5l3 3M8.5 5.5l-3 3"/></svg>Inactif</>
                    )}
                  </button>

                  {/* Télécharger QR - seulement pour QR codes */}
                  {plate.plate_type === 'qr' && (
                    <button onClick={() => downloadQr(plate)}
                      style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', borderRadius:8, border:'none', background:'rgba(37,99,235,0.08)', fontSize:12, fontWeight:500, color:'#2563eb', cursor:'pointer' }}
                      title="Télécharger le QR">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" transform="scale(0.58)"/></svg>
                      QR
                    </button>
                  )}

                  {/* Prévisualiser */}
                  <button onClick={() => openPreview(plate)} style={iconBtn} title="Prévisualiser le parcours client">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" transform="scale(0.67)"/><circle cx="8" cy="8" r="2"/></svg>
                  </button>

                  {/* Renommer */}
                  <button onClick={() => { setEditingId(plate.id); setEditLabel(plate.label || '') }} style={iconBtn} title="Renommer">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" transform="scale(0.58)"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" transform="scale(0.58)"/></svg>
                  </button>

                  {/* Copier le lien */}
                  <button onClick={() => copyUrl(plate)} style={iconBtn} title="Copier le lien">
                    {copiedId === plate.id
                      ? <svg width="16" height="16" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round"><path d="M20 6L9 17l-5-5" transform="scale(0.67)"/></svg>
                      : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" transform="scale(0.58)"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" transform="scale(0.58)"/></svg>
                    }
                  </button>

                  {/* Archiver */}
                  <button onClick={() => archivePlate(plate)} style={{ ...iconBtn, color:'#ddd' }} title="Archiver">
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" transform="scale(0.67)"/></svg>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {plate.plate_type === 'qr' && !isEditing && !isArchived && (
          <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #f5f5f0', display:'flex', alignItems:'center', gap:14 }}>
            <img src={getQrImageUrl(plate)} alt="QR Code" style={{ width:72, height:72, borderRadius:10, border:'1px solid #f0f0ec' }}/>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:12, color:'#888', marginBottom:4 }}>Téléchargez et imprimez ce QR code.</p>
              <p style={{ fontSize:11, fontFamily:'monospace', color:'#bbb', wordBreak:'break-all' }}>{getPlateUrl(plate)}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:24, color:'#1a1a18', letterSpacing:'-0.02em', margin:'0 0 4px' }}>Tags NFC & QR Codes</h1>
        <p style={{ color:'#999', fontSize:14, margin:0 }}>{activePlates.length} support(s) actif(s){archivedPlates.length > 0 ? ` · ${archivedPlates.length} archivé(s)` : ''}</p>
      </div>

      {!establishment.redirect_url && (
        <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:12, padding:14, marginBottom:20, display:'flex', gap:10 }}>
          <svg width="18" height="18" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink:0, marginTop:1 }}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01" transform="scale(0.75)"/></svg>
          <div>
            <p style={{ fontSize:13, fontWeight:600, color:'#92400e', margin:'0 0 2px' }}>Lien de redirection non configuré</p>
            <p style={{ fontSize:12, color:'#b45309', margin:0 }}>Allez dans Réglages pour configurer votre lien Google.</p>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:'48px 0' }}>
          <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid #e8e8e4', borderTopColor:'#2563eb', animation:'spin 0.8s linear infinite' }}/>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:32 }}>
          <section>
            <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
              <Wifi size={16} color="#2563eb" strokeWidth={1.5} />
              Tags NFC
            </h2>
            <div style={{ background:'#eff6ff', borderRadius:10, padding:12, marginBottom:12 }}>
              <p style={{ fontSize:12, color:'#1e40af', margin:0 }}>Vos tags NFC encodés arrivent bientôt. Ils apparaîtront ici après activation.</p>
            </div>
            {nfcPlates.length === 0 ? (
              <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f0f0ec', padding:32, textAlign:'center' }}>
                <p style={{ fontSize:13, color:'#999', margin:0 }}>Aucun tag NFC activé.</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>{nfcPlates.map(p => <PlateCard key={p.id} plate={p}/>)}</div>
            )}
          </section>

          <section>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
              <h2 style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', display:'flex', alignItems:'center', gap:8, margin:0 }}>
                <QrCode size={16} color="#7c3aed" strokeWidth={1.5} />
                QR Codes
              </h2>
              <button onClick={() => setShowCreateQr(true)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, border:'1px solid #e8e8e4', background:'#fff', fontSize:12, fontWeight:500, color:'#2563eb', cursor:'pointer' }}>
                + Créer un QR code
              </button>
            </div>

            {showCreateQr && (
              <div style={{ background:'#fff', borderRadius:14, border:'1.5px solid rgba(37,99,235,0.15)', padding:16, marginBottom:12 }}>
                <p style={{ fontSize:14, fontWeight:500, color:'#1a1a18', marginBottom:10 }}>Nouveau QR code</p>
                <input type="text" value={newQrLabel} onChange={(e) => setNewQrLabel(e.target.value)} placeholder="Emplacement (ex: Table 5, Comptoir, Caisse...)"
                  style={{ width:'100%', border:'1.5px solid #e8e8e4', borderRadius:10, padding:'10px 12px', fontSize:13, fontFamily:'inherit', outline:'none', marginBottom:10 }}/>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={createQrCode} disabled={creating} style={{ padding:'8px 18px', borderRadius:10, border:'none', background:'#2563eb', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'"Outfit",system-ui' }}>
                    {creating ? 'Création...' : 'Créer'}
                  </button>
                  <button onClick={() => setShowCreateQr(false)} style={{ padding:'8px 18px', borderRadius:10, border:'1px solid #e8e8e4', background:'#fff', fontSize:13, color:'#666', cursor:'pointer' }}>Annuler</button>
                </div>
              </div>
            )}

            {qrPlates.length === 0 && !showCreateQr ? (
              <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f0f0ec', padding:40, textAlign:'center' }}>
                <p style={{ fontSize:14, fontWeight:500, color:'#555', marginBottom:4 }}>Aucun QR code</p>
                <p style={{ fontSize:13, color:'#999', marginBottom:16 }}>Créez votre premier QR code pour commencer.</p>
                <button onClick={() => setShowCreateQr(true)} style={{ padding:'10px 22px', borderRadius:12, border:'none', background:'#2563eb', color:'#fff', fontSize:14, fontWeight:600, fontFamily:'"Outfit",system-ui', cursor:'pointer', boxShadow:'0 2px 8px rgba(37,99,235,0.25)' }}>
                  + Créer mon premier QR code
                </button>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>{qrPlates.map(p => <PlateCard key={p.id} plate={p}/>)}</div>
            )}
          </section>

          {archivedPlates.length > 0 && (
            <section>
              <button onClick={() => setShowArchived(!showArchived)}
                style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', padding:0, marginBottom: showArchived ? 10 : 0 }}>
                <svg width="16" height="16" fill="none" stroke="#999" strokeWidth="1.5" strokeLinecap="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" transform="scale(0.67)"/></svg>
                <span style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#999' }}>
                  Archivés ({archivedPlates.length})
                </span>
                <svg width="12" height="12" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round"
                  style={{ transform: showArchived ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.2s' }}>
                  <path d="M2 4l4 4 4-4"/>
                </svg>
              </button>
              {showArchived && (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {archivedPlates.map(p => <PlateCard key={p.id} plate={p} isArchived/>)}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Modale de prévisualisation interactive */}
      {previewPlate && establishment && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={() => setPreviewPlate(null)}>
          <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:380, overflow:'hidden', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderBottom:'1px solid #f0f0ec', background:'#fafaf8' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:13, fontWeight:500, color:'#666' }}>Aperçu client</span>
                <span style={{ fontSize:10, background:'#eff6ff', color:'#1e40af', padding:'2px 8px', borderRadius:10, fontWeight:500 }}>Mode démo</span>
              </div>
              <button onClick={() => setPreviewPlate(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'#999', padding:4 }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="4" x2="4" y2="12"/><line x1="4" y1="4" x2="12" y2="12"/></svg>
              </button>
            </div>
            <div style={{ padding:24, background:`radial-gradient(ellipse at 50% 20%,${establishment.primary_color}08 0%,#fafaf8 60%)` }}>
              <div style={{ textAlign:'center', marginBottom:16 }}>
                {establishment.logo_url && <img src={establishment.logo_url} alt="" style={{ width:48, height:48, borderRadius:12, objectFit:'cover', margin:'0 auto 8px', display:'block' }}/>}
                <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:18, color:'#1a1a18', margin:0 }}>{establishment.name}</p>
              </div>

              {previewResult === 'none' && (
                <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
                  <p style={{ textAlign:'center', fontSize:14, fontWeight:500, color:'#333', marginBottom:14 }}>{establishment.routing_question}</p>
                  <div style={{ display:'flex', justifyContent:'center', gap:6 }}>
                    {[1,2,3,4,5].map(s => {
                      const display = previewHover || previewRating
                      const active = display >= s
                      return (
                        <button key={s} onClick={() => handlePreviewStar(s)}
                          onMouseEnter={() => setPreviewHover(s)} onMouseLeave={() => setPreviewHover(0)}
                          style={{ background:'none', border:'none', padding:4, cursor:'pointer', transition:'transform 0.15s', transform: (previewHover === s) ? 'scale(1.2)' : 'scale(1)' }}>
                          <svg width="30" height="30" viewBox="0 0 24 24" fill={active?'#facc15':'none'} stroke={active?'#facc15':'#d1d5db'} strokeWidth="1.5" strokeLinejoin="round">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        </button>
                      )
                    })}
                  </div>
                  <p style={{ textAlign:'center', fontSize:11, color:'#bbb', marginTop:10 }}>Cliquez pour simuler le parcours client</p>
                </div>
              )}

              {previewResult === 'positive' && (
                <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.04)', textAlign:'center' }}>
                  <div style={{ display:'flex', justifyContent:'center', gap:3, marginBottom:12 }}>
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} width="20" height="20" viewBox="0 0 24 24" fill={s <= previewRating ? '#facc15' : 'none'} stroke={s <= previewRating ? '#facc15' : '#d1d5db'} strokeWidth="1.5" strokeLinejoin="round">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                  <div style={{ width:48, height:48, borderRadius:14, background:'#059669', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                    <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                  </div>
                  <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', margin:'0 0 6px' }}>Redirection Google</p>
                  <p style={{ fontSize:13, color:'#888', margin:'0 0 4px' }}>Le client serait redirigé vers votre page Google pour laisser un avis positif.</p>
                  {establishment.redirect_url && (
                    <p style={{ fontSize:11, fontFamily:'monospace', color:'#bbb', margin:'8px 0 0', wordBreak:'break-all' }}>{establishment.redirect_url}</p>
                  )}
                </div>
              )}

              {previewResult === 'negative' && (
                <div style={{ background:'#fff', borderRadius:14, padding:20, boxShadow:'0 1px 3px rgba(0,0,0,0.04)', textAlign:'center' }}>
                  <div style={{ display:'flex', justifyContent:'center', gap:3, marginBottom:12 }}>
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} width="20" height="20" viewBox="0 0 24 24" fill={s <= previewRating ? '#facc15' : 'none'} stroke={s <= previewRating ? '#facc15' : '#d1d5db'} strokeWidth="1.5" strokeLinejoin="round">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                  <div style={{ width:48, height:48, borderRadius:14, background:'#f59e0b', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                    <svg width="24" height="24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  </div>
                  <p style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:16, color:'#1a1a18', margin:'0 0 6px' }}>Retour privé</p>
                  <p style={{ fontSize:13, color:'#888', margin:0 }}>Le client verrait un formulaire pour laisser un retour privé (prénom, commentaire, contact). Ce retour n'apparaît pas sur Google.</p>
                </div>
              )}

              <p style={{ textAlign:'center', fontSize:10, color:'#c0c0b8', marginTop:12 }}>Propulsé par StarPulse</p>
            </div>
            <div style={{ padding:'12px 18px', borderTop:'1px solid #f0f0ec', background:'#fafaf8', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:11, color:'#bbb' }}>Seuil : {threshold}+ étoiles = Google</span>
              {previewResult !== 'none' && (
                <button onClick={resetPreview} style={{ fontSize:12, fontWeight:500, color:'#2563eb', background:'none', border:'none', cursor:'pointer' }}>
                  Recommencer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
