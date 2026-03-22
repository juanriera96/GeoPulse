import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import clsx from 'clsx'
import {
    LayoutDashboard,
    Route,
    Bell,
    FileText,
    Settings,
    LogOut,
    Globe,
    ChevronRight,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/routes', icon: Route, label: 'Rutas' },
  { to: '/alerts', icon: Bell, label: 'Alertas' },
  { to: '/reports', icon: FileText, label: 'Reportes' },
  { to: '/settings', icon: Settings, label: 'Configuracion' },
  ]

export default function AppLayout() {
    const { signOut, profile, user } = useAuthStore()
    const navigate = useNavigate()

  const handleSignOut = async () => {
        await signOut()
        navigate('/')
  }

  return (
        <div className="flex h-screen bg-slate-950 overflow-hidden">
          {/* Sidebar */}
              <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
                {/* Logo */}
                      <div className="h-16 flex items-center px-6 border-b border-slate-800">
                                <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                                                          <Globe className="w-4 h-4 text-white" />
                                            </div>div>
                                            <span className="text-lg font-bold text-white">GeoPulse</span>span>
                                </div>div>
                      </div>div>
              
                {/* Nav */}
                      <nav className="flex-1 px-3 py-4 space-y-1">
                        {navItems.map(({ to, icon: Icon, label }) => (
                      <NavLink
                                      key={to}
                                      to={to}
                                      className={({ isActive }) =>
                                                        clsx(
                                                                            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 group',
                                                                            isActive
                                                                              ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                                                                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                                                          )
                                      }
                                    >
                                    <Icon className="w-4 h-4 shrink-0" />
                                    <span className="flex-1">{label}</span>span>
                                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </NavLink>NavLink>
                    ))}
                      </nav>nav>
              
                {/* User */}
                      <div className="p-3 border-t border-slate-800">
                                <div className="flex items-center gap-3 px-2 py-2 mb-1">
                                            <div className="w-8 h-8 bg-brand-700 rounded-full flex items-center justify-center shrink-0">
                                                          <span className="text-xs font-bold text-white uppercase">
                                                            {profile?.full_name?.[0] || user?.email?.[0] || '?'}
                                                          </span>span>
                                            </div>div>
                                            <div className="flex-1 min-w-0">
                                                          <p className="text-sm font-medium text-slate-200 truncate">
                                                            {profile?.full_name || 'Usuario'}
                                                          </p>p>
                                                          <p className="text-xs text-slate-500 truncate">{user?.email}</p>p>
                                            </div>div>
                                </div>div>
                                <button
                                              onClick={handleSignOut}
                                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors duration-150"
                                            >
                                            <LogOut className="w-4 h-4" />
                                            Cerrar sesion
                                </button>button>
                      </div>div>
              </aside>aside>
        
          {/* Main */}
              <main className="flex-1 overflow-auto">
                      <Outlet />
              </main>main>
        </div>div>
      )
}</div>
