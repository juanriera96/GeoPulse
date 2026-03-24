import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { supabase } from '../../lib/supabase'
import { useEffect, useState, useRef } from 'react'
import clsx from 'clsx'
import { LayoutDashboard, Globe, Bell, FileText, Settings, LogOut, ChevronRight, AlertTriangle, Shield, User, ChevronDown } from 'lucide-react'
import DashboardBackground from '../DashboardBackground'

export default function AppLayout() {
  const { signOut, profile, user } = useAuthStore()
  const navigate = useNavigate()
  const [criticalCount, setCriticalCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => { if (user) loadCounts() }, [user])

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function loadCounts() {
    const { data } = await supabase.from('routes').select('id, risk_analyses(risk_score)').eq('user_id', user.id)
    if (data) {
      setCriticalCount(data.filter(r => { const s = r.risk_analyses?.[0]?.risk_score; return s !== undefined && s >= 70 }).length)
      setPendingCount(data.filter(r => !r.risk_analyses?.length).length)
    }
  }

  const handleSignOut = async () => { setUserMenuOpen(false); await signOut(); navigate('/') }
  const displayName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Usuario'
  const companyName = profile?.company_name || null
  const initials = (profile?.full_name || user?.email || 'U').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/routes', icon: Globe, label: 'Mis Rutas', badge: pendingCount > 0 ? pendingCount : null, badgeType: 'info' },
    { to: '/alerts', icon: Bell, label: 'Alertas', badge: criticalCount > 0 ? criticalCount : null, badgeType: 'critical' },
    { to: '/reports', icon: FileText, label: 'Reportes' },
    { to: '/settings', icon: Settings, label: 'Configuracion' },
  ]

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <DashboardBackground />
      <aside className="w-60 flex-shrink-0 bg-slate-900/95 border-r border-slate-800 flex flex-col relative z-10">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-tight">GeoPulse</p>
              <p className="text-slate-500 text-xs">Risk Intelligence</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider px-3 py-2">Menu Principal</p>
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to}
              className={({ isActive }) => clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              {({ isActive }) => (<>
                <item.icon className={'w-4 h-4 flex-shrink-0 ' + (isActive ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300')} />
                <span className="flex-1">{item.label}</span>
                {item.badge && <span className={clsx('text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center', item.badgeType === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400')}>{item.badge}</span>}
              </>)}
            </NavLink>
          ))}
        </nav>
        {criticalCount > 0 && (
          <div className="px-3 py-2">
            <button onClick={() => navigate('/alerts')} className="w-full flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="flex-1 text-left">{criticalCount} ruta{criticalCount > 1 ? 's' : ''} critica{criticalCount > 1 ? 's' : ''}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {/* User section with dropdown */}
        <div className="p-3 border-t border-slate-800" ref={menuRef}>
          <div className="relative">
            <button onClick={() => setUserMenuOpen(prev => !prev)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-left">
              <div className="w-7 h-7 bg-brand-600/30 border border-brand-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-brand-400 text-xs font-bold">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-300 text-xs font-medium truncate">{displayName}</p>
                {companyName && <p className="text-slate-600 text-xs truncate">{companyName}</p>}
              </div>
              <ChevronDown className={'w-3.5 h-3.5 text-slate-500 transition-transform ' + (userMenuOpen ? 'rotate-180' : '')} />
            </button>
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                <button onClick={() => { setUserMenuOpen(false); navigate('/settings'); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                  <User className="w-4 h-4 text-slate-500" /> Mi perfil
                </button>
                <button onClick={() => { setUserMenuOpen(false); navigate('/settings'); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors">
                  <Settings className="w-4 h-4 text-slate-500" /> Configuración
                </button>
                <div className="border-t border-slate-700" />
                <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors">
                  <LogOut className="w-4 h-4" /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
