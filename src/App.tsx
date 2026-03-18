import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import LandingPage from './pages/LandingPage'
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
import SubscriptionPage from './pages/dashboard/SubscriptionPage'
import PricingPage from './pages/PricingPage'
import NfcShopPage from './pages/dashboard/NfcShopPage'

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
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fafaf8' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid #e8e8e4', borderTopColor:'#2563eb', animation:'spin 0.8s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <Routes>
      {/* Landing page publique */}
      <Route path="/" element={session ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      {/* Smart routing client */}
      <Route path="/t/:code" element={<RoutingPage />} />
      <Route path="/r/:code" element={<RoutingPage />} />
      <Route path="/activate/:code" element={<ActivatePage session={session} />} />
      {/* Auth */}
      <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={session ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      {/* Pricing public */}
      <Route path="/pricing" element={<PricingPage session={session} />} />
      {/* Dashboard */}
      <Route path="/dashboard" element={
        <ProtectedRoute session={session}><DashboardLayout session={session!} /></ProtectedRoute>
      }>
        <Route index element={<Overview />} />
        <Route path="plates" element={<PlatesPage />} />
        <Route path="retours" element={<RetourPrivesPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="affiliate" element={<AffiliatePage />} />
        <Route path="subscription" element={<SubscriptionPage />} />
        <Route path="nfc-shop" element={<NfcShopPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      {/* Fallback */}
      <Route path="*" element={<Navigate to={session ? "/dashboard" : "/"} replace />} />
    </Routes>
  )
}
