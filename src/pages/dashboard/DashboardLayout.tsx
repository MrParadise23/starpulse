import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import type { Establishment } from '../../lib/supabase'

const navItems = [
  { to: '/dashboard', label: 'Vue d\'ensemble', end: true, icon: 'grid' },
  { to: '/dashboard/plates', label: 'Tags NFC & QR', icon: 'nfc' },
  { to: '/dashboard/retours', label: 'Retours privés', icon: 'msg' },
  { to: '/dashboard/reviews', label: 'Avis Google', icon: 'star' },
  { to: '/dashboard/subscription', label: 'Abonnement', icon: 'credit' },
  { to: '/dashboard/nfc-shop', label: 'Boutique NFC', icon: 'shop' },
  { to: '/dashboard/affiliate', label: 'Affiliation', icon: 'users' },
  { to: '/dashboard/settings', label: 'Réglages', icon: 'settings' },
]

function NavIcon({ type, size = 18 }: { type: string; size?: number }) {
  const p = { width: size, height: size, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  switch (type) {
    case 'grid': return <svg {...p} viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
    case 'nfc': return <svg {...p} viewBox="0 0 24 24"><path d="M6 8.32a7.43 7.43 0 010 7.36"/><path d="M9.46 6.21a11.76 11.76 0 010 11.58"/><path d="M12.91 4.1a16.1 16.1 0 010 15.8"/><path d="M16.37 2a20.16 20.16 0 010 20"/></svg>
    case 'msg': return <svg {...p} viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
    case 'star': return <svg {...p} viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    case 'users': return <svg {...p} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
    case 'settings': return <svg {...p} viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
    case 'shop': return <svg {...p} viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
    case 'credit': return <svg {...p} viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    case 'logout': return <svg {...p} viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    case 'menu': return <svg {...p} viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    case 'x': return <svg {...p} viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    default: return null
  }
}

export default function DashboardLayout({ session }: { session: Session }) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [activeEst, setActiveEst] = useState<Establishment | null>(null)
  const [estDropdownOpen, setEstDropdownOpen] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!estDropdownOpen) return
    function handleClick() { setEstDropdownOpen(false) }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [estDropdownOpen])

  useEffect(() => { loadEstablishments() }, [])

  async function loadEstablishments() {
    const { data } = await supabase.from('establishments').select('*').eq('user_id', session.user.id).eq('is_active', true).order('created_at', { ascending: false })
    if (data && data.length > 0) {
      setEstablishments(data)
      setActiveEst(prev => {
        if (prev) {
          const stillExists = data.find(e => e.id === prev.id)
          if (stillExists) return stillExists
        }
        return data[0]
      })
    }
  }

  function switchEstablishment(est: Establishment) {
    setActiveEst(est)
    setEstDropdownOpen(false)
  }

  const userName = session.user.user_metadata?.full_name || session.user.email

  return (
    <div style={{ minHeight: '100vh', background: '#fafaf8' }}>
      <div style={{ position:'fixed', top:0, left:0, right:0, height:56, background:'#fff', borderBottom:'1px solid #eee', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', zIndex:30 }} className="lg:hidden">
        <button onClick={() => setSidebarOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', color:'#555', padding:4 }}><NavIcon type="menu" /></button>
        <span style={{ fontFamily:'"Outfit",system-ui', fontWeight:600, fontSize:15, color:'#1a1a18' }}>{activeEst?.name || 'StarPulse'}</span>
        <div style={{ width:26 }}/>
      </div>
      {sidebarOpen && <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.25)', zIndex:40 }} className="lg:hidden" onClick={() => setSidebarOpen(false)}/>}
      <aside style={{ position:'fixed', top:0, left:0, bottom:0, width:256, background:'#fff', borderRight:'1px solid #f0f0ec', zIndex:50, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)', transition:'transform 0.25s ease' }} className="sidebar">
        <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
          <div style={{ padding:'20px 16px 16px', borderBottom:'1px solid #f0f0ec' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#2563eb,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(37,99,235,0.2)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                </div>
                <span style={{ fontFamily:'"Outfit",system-ui', fontWeight:700, fontSize:17, color:'#1a1a18', letterSpacing:'-0.02em' }}>StarPulse</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#aaa', padding:4 }} className="lg:hidden"><NavIcon type="x" size={16}/></button>
            </div>
            {/* Establishment switcher */}
            {activeEst && (
              <div style={{ position:'relative' }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setEstDropdownOpen(!estDropdownOpen) }}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'#f5f5f0', borderRadius:10, width:'100%', border:'none', cursor:'pointer', textAlign:'left', transition:'all 0.15s' }}
                  onMouseEnter={(e) => { (e.currentTarget).style.background = '#ededea' }}
                  onMouseLeave={(e) => { (e.currentTarget).style.background = '#f5f5f0' }}
                >
                  {activeEst.logo_url ? (
                    <img src={activeEst.logo_url} alt={activeEst.name} style={{ width:28, height:28, borderRadius:8, objectFit:'cover', flexShrink:0 }} />
                  ) : (
                    <div style={{ width:28, height:28, borderRadius:8, background:`${activeEst.primary_color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:12, fontWeight:700, color:activeEst.primary_color }}>{activeEst.name.charAt(0)}</span>
                    </div>
                  )}
                  <span style={{ fontSize:13, fontWeight:500, color:'#1a1a18', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{activeEst.name}</span>
                  {establishments.length > 1 && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, transform: estDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition:'transform 0.2s' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  )}
                </button>
                {estDropdownOpen && establishments.length > 1 && (
                  <div style={{ position:'absolute', top:'100%', left:0, right:0, marginTop:4, background:'#fff', borderRadius:12, border:'1px solid #e8e8e4', boxShadow:'0 8px 24px rgba(0,0,0,0.08)', zIndex:100, overflow:'hidden' }}>
                    {establishments.filter(e => e.id !== activeEst.id).map(est => (
                      <button
                        key={est.id}
                        onClick={() => switchEstablishment(est)}
                        style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px', width:'100%', border:'none', background:'transparent', cursor:'pointer', textAlign:'left', transition:'background 0.1s' }}
                        onMouseEnter={(e) => { (e.currentTarget).style.background = '#f5f5f0' }}
                        onMouseLeave={(e) => { (e.currentTarget).style.background = 'transparent' }}
                      >
                        {est.logo_url ? (
                          <img src={est.logo_url} alt={est.name} style={{ width:24, height:24, borderRadius:6, objectFit:'cover', flexShrink:0 }} />
                        ) : (
                          <div style={{ width:24, height:24, borderRadius:6, background:`${est.primary_color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            <span style={{ fontSize:10, fontWeight:700, color:est.primary_color }}>{est.name.charAt(0)}</span>
                          </div>
                        )}
                        <span style={{ fontSize:12, fontWeight:400, color:'#555', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{est.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <nav style={{ flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setSidebarOpen(false)}
                style={({ isActive }) => ({
                  display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10,
                  fontSize:13, fontWeight:isActive?600:400, textDecoration:'none', transition:'all 0.15s',
                  color: isActive ? '#2563eb' : '#666',
                  background: isActive ? 'rgba(37,99,235,0.06)' : 'transparent',
                })}>
                <NavIcon type={item.icon} size={17}/>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div style={{ padding:'12px 8px', borderTop:'1px solid #f0f0ec' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', marginBottom:4 }}>
              <div style={{ width:32, height:32, borderRadius:10, background:'#f0f0ec', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:12, fontWeight:600, color:'#888' }}>{(userName || 'U').charAt(0).toUpperCase()}</span>
              </div>
              <span style={{ fontSize:13, fontWeight:500, color:'#1a1a18', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{userName}</span>
            </div>
            <button onClick={async () => { await supabase.auth.signOut(); navigate('/login') }}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', borderRadius:10, width:'100%', border:'none', background:'transparent', cursor:'pointer', fontSize:13, color:'#999', transition:'all 0.15s', fontFamily:'inherit' }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.background = '#f5f5f0'; (e.target as HTMLElement).style.color = '#666' }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent'; (e.target as HTMLElement).style.color = '#999' }}>
              <NavIcon type="logout" size={17}/>
              Déconnexion
            </button>
          </div>
        </div>
      </aside>
      <main style={{ marginLeft:0, paddingTop:56, minHeight:'100vh' }} className="main-content">
        <div style={{ padding:'24px 16px', maxWidth:960, margin:'0 auto' }}>
          <Outlet context={{ establishment: activeEst, session, refreshEstablishments: loadEstablishments, establishments, switchEstablishment }} />
        </div>
      </main>
      <style>{`
        @media (min-width: 1024px) {
          .sidebar { transform: translateX(0) !important; }
          .main-content { margin-left: 256px !important; padding-top: 0 !important; }
          .lg\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}
