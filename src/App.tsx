import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import RoutingPage from './pages/RoutingPage'
import ActivatePage from './pages/ActivatePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardLayout from './pages/dashboard/DashboardLayout'
import Overview from './pages/dashboard/Overview'
import PlatesPage from './pages/dashboard/PlatesPage'
import RetourPrivesPage from './pages/dashboard/RetourPrivesPage'
import ReviewsPage from './pages/dashboard/ReviewsPage'
import SettingsPage from './pages/dashboard/SettingsPage'
import AffiliatePage from './pages/dashboard/AffiliatePage'

function ProtectedRoute({ session, children }: { session: Session | null; children: React.ReactNode }) {
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session) })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <Routes>
      {/* /t/:code = Tags NFC, /r/:code = QR codes (CDC section 8 et 9) */}
      <Route path="/t/:code" element={<RoutingPage />} />
      <Route path="/r/:code" element={<RoutingPage />} />
      <Route path="/activate/:code" element={<ActivatePage session={session} />} />
      <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={session ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute session={session}><DashboardLayout session={session!} /></ProtectedRoute>
      }>
        <Route index element={<Overview />} />
        <Route path="plates" element={<PlatesPage />} />
        <Route path="retours" element={<RetourPrivesPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="affiliate" element={<AffiliatePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={session ? "/dashboard" : "/login"} replace />} />
    </Routes>
  )
}
