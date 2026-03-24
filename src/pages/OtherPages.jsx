import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import {
  Bell, FileText, Settings, AlertTriangle, CheckCircle,
  Info, Globe, Clock, Zap, ChevronRight, Shield,
  TrendingUp, XCircle, ExternalLink, RefreshCw, Loader2,
  User, Mail, Building, Lock
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

// ─── Alerts Page ───────────────────────────────────────────────────────────────

export function AlertsPage() {
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (user) fetchAlerts()
  }, [user])

  async function fetchAlerts() {
    setLoading(true)
    const { data } = await supabase
      .from('routes')
      .select(`
        id, origin_country, destination_country, cargo_type, description,
        risk_analyses(risk_score, risk_level, summary, factors, recommendations, created_at)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setRoutes(data || [])
    setLoading(false)
  }

  const getLatestAnalysis = (r) => r.risk_analyses?.[0] ?? null

  // Build alert objects from route analyses
  const alerts = routes.flatMap(route => {
    const analysis = getLatestAnalysis(route)
    if (!analysis) return []

    const generated = []
    const score = analysis.risk_score
    const routeLabel = route.origin_country + ' → ' + route.destination_country

    // Score-based main alert
    if (score >= 70) {
      generated.push({
        id: route.id + '_critical',
        routeId: route.id,
        type: 'critical',
        icon: XCircle,
        title: 'Riesgo Critico Detectado',
        message: routeLabel + ' — Score: ' + score + '/100. ' + (analysis.summary || ''),
        time: analysis.created_at,
        action: 'Ver ruta',
      })
    } else if (score >= 60) {
      generated.push({
        id: route.id + '_high',
        routeId: route.id,
        type: 'warning',
        icon: AlertTriangle,
        title: 'Riesgo Elevado',
        message: routeLabel + ' — Score: ' + score + '/100. Requiere monitoreo activo.',
        time: analysis.created_at,
        action: 'Ver ruta',
      })
    } else if (score >= 40) {
      generated.push({
        id: route.id + '_medium',
        routeId: route.id,
        type: 'info',
        icon: Info,
        title: 'Riesgo Moderado',
        message: routeLabel + ' — Score: ' + score + '/100. Considera las recomendaciones del analisis.',
        time: analysis.created_at,
        action: 'Ver detalles',
      })
    } else {
      generated.push({
        id: route.id + '_low',
        routeId: route.id,
        type: 'ok',
        icon: CheckCircle,
        title: 'Riesgo Controlado',
        message: routeLabel + ' — Score: ' + score + '/100. Condiciones favorables en esta ruta.',
        time: analysis.created_at,
        action: null,
      })
    }

    // Factor-specific alerts for high-severity factors
    if (analysis.factors) {
      const highFactors = analysis.factors.filter(f => f.severity === 'high')
      highFactors.slice(0, 2).forEach((f, i) => {
        generated.push({
          id: route.id + '_factor_' + i,
          routeId: route.id,
          type: 'warning',
          icon: AlertTriangle,
          title: 'Factor de Riesgo: ' + f.category,
          message: routeLabel + ' — ' + f.description,
          time: analysis.created_at,
          action: 'Ver analisis',
          isSubAlert: true,
        })
      })
    }

    // Recommendation alerts for immediate actions
    if (analysis.recommendations) {
      const immediateRecs = analysis.recommendations.filter(r => r.priority === 'immediate')
      immediateRecs.slice(0, 1).forEach((r, i) => {
        generated.push({
          id: route.id + '_rec_' + i,
          routeId: route.id,
          type: 'action',
          icon: Zap,
          title: 'Accion Requerida',
          message: routeLabel + ' — ' + r.action,
          time: analysis.created_at,
          action: 'Ver ruta',
          isSubAlert: true,
        })
      })
    }

    return generated
  })

  // Routes with no analysis
  const unanalyzedRoutes = routes.filter(r => !getLatestAnalysis(r))

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'all') return true
    if (filter === 'critical') return a.type === 'critical'
    if (filter === 'warning') return a.type === 'warning' || a.type === 'action'
    if (filter === 'ok') return a.type === 'ok' || a.type === 'info'
    return true
  }).filter(a => !a.isSubAlert || filter !== 'ok')

  const criticalCount = alerts.filter(a => a.type === 'critical').length
  const warningCount = alerts.filter(a => a.type === 'warning' || a.type === 'action').length

  const typeConfig = {
    critical: { border: 'border-red-500/40 bg-red-500/5', icon: 'text-red-400', badge: 'bg-red-500/20 text-red-400 border border-red-500/30', label: 'CRITICO' },
    warning: { border: 'border-amber-500/40 bg-amber-500/5', icon: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', label: 'AVISO' },
    action: { border: 'border-brand-500/40 bg-brand-500/5', icon: 'text-brand-400', badge: 'bg-brand-500/20 text-brand-400 border border-brand-500/30', label: 'ACCION' },
    info: { border: 'border-slate-700 bg-slate-900', icon: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', label: 'INFO' },
    ok: { border: 'border-slate-800', icon: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', label: 'OK' },
  }

  const formatTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (days > 0) return days === 1 ? 'Hace 1 dia' : 'Hace ' + days + ' dias'
    if (hours > 0) return 'Hace ' + hours + 'h'
    return 'Hace unos minutos'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Centro de Alertas</h1>
          <p className="text-slate-400 text-sm mt-1">
            Alertas generadas automaticamente por IA basadas en tus rutas analizadas
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
          Actualizar
        </button>
      </div>

      {/* Summary bar */}
      {!loading && alerts.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4 border-red-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">Criticas</p>
                <p className="text-3xl font-bold text-red-400 mt-1">{criticalCount}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500/40" />
            </div>
          </div>
          <div className="card p-4 border-amber-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">Avisos</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">{warningCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500/40" />
            </div>
          </div>
          <div className="card p-4 border-emerald-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wider">En orden</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">{alerts.filter(a => a.type === 'ok').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-emerald-500/40" />
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      {alerts.length > 0 && (
        <div className="flex items-center gap-1 mb-4 bg-slate-900 border border-slate-800 rounded-lg p-1 w-fit">
          {[
            { key: 'all', label: 'Todas' },
            { key: 'critical', label: 'Criticas' },
            { key: 'warning', label: 'Avisos' },
            { key: 'ok', label: 'En orden' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                filter === tab.key ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
      ) : alerts.length === 0 && unanalyzedRoutes.length === 0 && routes.length === 0 ? (
        <div className="card p-16 text-center">
          <Bell className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Sin alertas aun</h3>
          <p className="text-slate-400 text-sm mb-6">Crea y analiza tus rutas de importacion para generar alertas automaticas.</p>
          <button onClick={() => navigate('/routes')} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors">
            Ir a Rutas <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Unanalyzed routes reminder */}
          {unanalyzedRoutes.length > 0 && (filter === 'all' || filter === 'warning') && (
            <div
              onClick={() => navigate('/routes')}
              className="card border-brand-500/30 bg-brand-500/5 p-4 flex items-center gap-4 cursor-pointer hover:bg-brand-500/10 transition-colors"
            >
              <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-brand-400 font-semibold text-sm">
                  {unanalyzedRoutes.length} ruta{unanalyzedRoutes.length > 1 ? 's' : ''} sin analizar
                </p>
                <p className="text-slate-400 text-xs mt-0.5">
                  {unanalyzedRoutes.map(r => r.origin_country + ' → ' + r.destination_country).join(', ')} — Analiza para obtener alertas de riesgo
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-brand-400 flex-shrink-0" />
            </div>
          )}

          {filteredAlerts.map(alert => {
            const cfg = typeConfig[alert.type]
            const Icon = alert.icon
            return (
              <div key={alert.id} className={'card p-4 ' + cfg.border + ' flex items-start gap-4'}>
                <div className={'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ' + cfg.border.replace('border-', 'bg-').replace('/40', '/20').replace('/5', '/10')}>
                  <Icon className={'w-4 h-4 ' + cfg.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={'text-xs font-bold px-1.5 py-0.5 rounded ' + cfg.badge}>{cfg.label}</span>
                    <p className="text-white font-semibold text-sm">{alert.title}</p>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-slate-600 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />{formatTime(alert.time)}
                    </span>
                    {alert.action && (
                      <button
                        onClick={() => navigate('/routes')}
                        className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1 transition-colors"
                      >
                        {alert.action} <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {filteredAlerts.length === 0 && (
            <div className="card p-10 text-center">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No hay alertas en esta categoria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Reports Page ────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      supabase
        .from('routes')
        .select('*, risk_analyses(risk_score, risk_level, summary, created_at)')
        .eq('user_id', user.id)
        .then(({ data }) => { setRoutes(data || []); setLoading(false) })
    }
  }, [user])

  const analyzedRoutes = routes.filter(r => r.risk_analyses?.length > 0)
  const highRisk = analyzedRoutes.filter(r => r.risk_analyses[0].risk_score >= 70).length
  const avgScore = analyzedRoutes.length > 0
    ? Math.round(analyzedRoutes.reduce((acc, r) => acc + r.risk_analyses[0].risk_score, 0) / analyzedRoutes.length)
    : null

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Reportes Ejecutivos</h1>
        <p className="text-slate-400 text-sm mt-1">Reportes profesionales para tu equipo de comercio exterior</p>
      </div>

      {/* Coming soon card */}
      <div className="card p-8 border-brand-500/20 bg-brand-500/5 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-brand-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold mb-1">Reportes PDF Automaticos — Proximamente</h2>
            <p className="text-slate-400 text-sm leading-relaxed max-w-2xl">
              Generacion automatica de reportes ejecutivos semanales con analisis de riesgo por ruta, tendencias, comparativas y recomendaciones priorizadas para tu equipo de comercio exterior y direccion general.
            </p>
          </div>
        </div>
      </div>

      {/* Current summary */}
      {!loading && analyzedRoutes.length > 0 && (
        <div className="card p-5">
          <h2 className="text-white font-semibold mb-4">Resumen Actual del Portafolio</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Rutas totales</p>
              <p className="text-2xl font-bold text-white">{routes.length}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Analizadas</p>
              <p className="text-2xl font-bold text-brand-400">{analyzedRoutes.length}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Score Promedio</p>
              <p className={'text-2xl font-bold ' + (avgScore >= 70 ? 'text-red-400' : avgScore >= 40 ? 'text-amber-400' : 'text-emerald-400')}>{avgScore}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 text-center">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Riesgo Alto</p>
              <p className={'text-2xl font-bold ' + (highRisk > 0 ? 'text-red-400' : 'text-emerald-400')}>{highRisk}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">Ultimos Analisis</h3>
            {analyzedRoutes.slice(0, 5).map(route => {
              const analysis = route.risk_analyses[0]
              const score = analysis.risk_score
              return (
                <div key={route.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={'w-2 h-2 rounded-full ' + (score >= 70 ? 'bg-red-400' : score >= 40 ? 'bg-amber-400' : 'bg-emerald-400')} />
                    <span className="text-slate-300 text-sm">{route.origin_country} → {route.destination_country}</span>
                    <span className="text-slate-600 text-xs">{route.cargo_type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={'text-sm font-bold ' + (score >= 70 ? 'text-red-400' : score >= 40 ? 'text-amber-400' : 'text-emerald-400')}>{score}/100</span>
                    <button onClick={() => navigate('/routes')} className="text-brand-400 hover:text-brand-300 text-xs transition-colors">
                      Ver <ChevronRight className="w-3 h-3 inline" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Settings Page ────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { user, profile, updateProfile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    company_name: profile?.company_name || '',
  })

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        company_name: profile.company_name || '',
      })
    }
  }, [profile])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await updateProfile({
      full_name: form.full_name,
      company_name: form.company_name,
    })
    if (error) {
      toast.error('Error guardando cambios')
    } else {
      toast.success('Perfil actualizado correctamente')
    }
    setSaving(false)
  }

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configuracion</h1>
        <p className="text-slate-400 text-sm mt-1">Administra tu cuenta y preferencias</p>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <div className="card p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-400" />
            Perfil
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre completo</label>
              <input
                type="text"
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Tu nombre completo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Empresa / Razon Social</label>
              <input
                type="text"
                value={form.company_name}
                onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Nombre de tu empresa importadora"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" /> Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-slate-800/50 border border-slate-800 text-slate-500 rounded-lg px-3 py-2.5 text-sm cursor-not-allowed"
              />
              <p className="text-slate-600 text-xs mt-1">El email no se puede modificar</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
            >
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Guardando...</span></> : 'Guardar cambios'}
            </button>
          </form>
        </div>

        {/* Account info */}
        <div className="card p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-400" />
            Cuenta
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <div>
                <p className="text-slate-300 text-sm font-medium">Plan actual</p>
                <p className="text-slate-500 text-xs">Acceso completo a todas las funciones</p>
              </div>
              <span className="text-brand-400 font-semibold text-sm bg-brand-500/10 px-3 py-1 rounded-full border border-brand-500/20">Free</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
              <div>
                <p className="text-slate-300 text-sm font-medium">Miembro desde</p>
                <p className="text-slate-500 text-xs">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="card p-5 border-red-500/20">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-400" />
            Zona de Peligro
          </h2>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg font-medium text-sm transition-colors"
          >
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  )
    }
