import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'

import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import OnboardingPage from './pages/OnboardingPage'
import DashboardPage from './pages/DashboardPage'
import AppLayout from './components/layout/AppLayout'
import { RoutesPage, AlertsPage, ReportsPage, SettingsPage } from './pages/OtherPages'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore()
    if (loading) {
        return (
              <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                                )
                                  }
                                    if (!user) return <Navigate to="/auth" replace />
                                      return children
                                      }

                                      function OnboardingRoute({ children }) {
                                        const { user, profile, loading } = useAuthStore()
                                          if (loading) return null
                                            if (!user) return <Navigate to="/auth" replace />
                                              if (profile && profile.onboarding_completed) return <Navigate to="/dashboard" replace />
                                                return children
                                                }

                                                export default function App() {
                                                  const { initialize } = useAuthStore()

                                                    useEffect(() => {
                                                        initialize()
                                                          }, [initialize])

                                                            return (
                                                                <Routes>
                                                                      <Route path="/" element={<LandingPage />} />
                                                                            <Route path="/auth" element={<AuthPage />} />
                                                                                  <Route
                                                                                          path="/onboarding"
                                                                                                  element={
                                                                                                            <OnboardingRoute>
                                                                                                                        <OnboardingPage />
                                                                                                                                  </OnboardingRoute>
                                                                                                                                          }
                                                                                                                                                />
                                                                                                                                                      <Route
                                                                                                                                                              path="/"
                                                                                                                                                                      element={
                                                                                                                                                                                <ProtectedRoute>
                                                                                                                                                                                            <AppLayout />
                                                                                                                                                                                                      </ProtectedRoute>
                                                                                                                                                                                                              }
                                                                                                                                                                                                                    >
                                                                                                                                                                                                                            <Route path="dashboard" element={<DashboardPage />} />
                                                                                                                                                                                                                                    <Route path="routes" element={<RoutesPage />} />
                                                                                                                                                                                                                                            <Route path="alerts" element={<AlertsPage />} />
                                                                                                                                                                                                                                                    <Route path="reports" element={<ReportsPage />} />
                                                                                                                                                                                                                                                            <Route path="settings" element={<SettingsPage />} />
                                                                                                                                                                                                                                                                  </Route>
                                                                                                                                                                                                                                                                        <Route path="*" element={<Navigate to="/" replace />} />
                                                                                                                                                                                                                                                                            </Routes>
                                                                                                                                                                                                                                                                              )
                                                                                                                                                                                                                                                                              }