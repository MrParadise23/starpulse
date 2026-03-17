import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import type { Session } from '@supabase/supabase-js'
import type { Establishment } from '../../lib/supabase'
import { LayoutDashboard, Nfc, MessageSquareText, Star, Settings, Users, LogOut, Menu, X, ChevronDown } from 'lucide-react'

export default function DashboardLayout({ session }: { session: Session }) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [establishments, setEstablishments] = useState<Establishment[]>([])
  const [activeEst, setActiveEst] = useState<Establishment | null>(null)

  useEffect(() => { loadEstablishments() }, [])

  async function loadEstablishments() {
    const { data } = await supabase.from('establishments').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
    if (data && data.length > 0) { setEstablishments(data); setActiveEst(data[0]) }
  }

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Vue d\'ensemble', end: true },
    { to: '/dashboard/plates', icon: Nfc, label: 'Tags NFC & QR' },
    { to: '/dashboard/retours', icon: MessageSquareText, label: 'Retours prives' },
    { to: '/dashboard/reviews', icon: Star, label: 'Avis Google' },
    { to: '/dashboard/affiliate', icon: Users, label: 'Affiliation' },
    { to: '/dashboard/settings', icon: Settings, label: 'Reglages' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-30">
        <button onClick={() => setSidebarOpen(true)} className="text-gray-600"><Menu className="w-5 h-5" /></button>
        <span className="font-display font-bold text-gray-900">{activeEst?.name || 'Dashboard'}</span>
        <div className="w-5" />
      </div>
      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-50 transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-display font-bold text-sm">A</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            {activeEst && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 text-xs font-bold">{activeEst.name.charAt(0)}</span>
                </div>
                <p className="text-sm font-medium text-gray-900 truncate flex-1">{activeEst.name}</p>
                {establishments.length > 1 && <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
              </div>
            )}
          </div>
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                <item.icon className="w-[18px] h-[18px]" />{item.label}
              </NavLink>
            ))}
          </nav>
          <div className="p-3 border-t border-gray-100">
            <div className="flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-xs font-bold">{session.user.email?.charAt(0).toUpperCase()}</span>
              </div>
              <p className="text-sm font-medium text-gray-900 truncate flex-1">{session.user.user_metadata?.full_name || session.user.email}</p>
            </div>
            <button onClick={async () => { await supabase.auth.signOut(); navigate('/login') }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 w-full">
              <LogOut className="w-[18px] h-[18px]" />Deconnexion
            </button>
          </div>
        </div>
      </aside>
      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <div className="p-4 lg:p-8 max-w-5xl">
          <Outlet context={{ establishment: activeEst, session, refreshEstablishments: loadEstablishments }} />
        </div>
      </main>
    </div>
  )
}
