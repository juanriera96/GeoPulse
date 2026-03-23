import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  Shield, Globe, Bell, TrendingUp, AlertTriangle, Clock,
  ArrowRight, Zap, CheckCircle, XCircle, Activity,
  Package, MapPin, ChevronRight, BarChart3, RefreshCw
} from 'lucide-react'

function ScoreBadge({ score }) {
  if (score === null || score === undefined) {
    return <span className="text-slate-500 text-sm">Sin analizar</span>
  }
  const level = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low'
  const configs = {
    high: { bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', label: 'Alto' },
    medium: { bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', label: 'Medio' },
    low: { bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', label: 'Bajo' },
  }
  const c = configs[level]
  return (
    <span className={'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ' + c.bg + ' ' + c.text}>
      <span className={'w-1.5 h-1.5 rounded-full ' + (level === 'high' ? 'bg-red-400' : level === 'medium' ? 'bg-amber-400' : 'bg-emerald-400')} />
      {score} — {c.label}
    </span>
  )
}

function StatCard({ icon: Icon, label, value, sub, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className={'card p-5 ' + (onClick ? 'cursor-pointer hover:border-slate-600 transition-all' : '')}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
          <p className={'text-3xl font-bold ' + (color || 'text-white')}>{value}</p>
          {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
        </div>
        <div className={'w-10 h-10 rounded-lg flex items-center justify-center ' + (color ? color.replace('text-', 'bg-').replace('400', '500/10').replace('300', '500/10') : 'bg-brand-500/10')}>
          <Icon className={'w-5 h-5 ' + (color || 'text-brand-400')} />
        </div>
      </div>
    </div>
  )
}

function RiskBar({ score }) {
  if (score === null || score === undefined) {
    return (
      <div className="w-full bg-slate-800 rounded-full h-1.5">
        <div className="bg-slate-600 h-1.5 rounded-full w-0" />
      </div>
    )
  }
  const color = score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
  return (
    <div className="w-full bg-slate-800 rounded-full h-1.5">
      <div className={color + ' h-1.5 rounded-full transition-all duration-700'} style={{ width: score + '%' }} />
    </div>
  )
}

export default function DashboardPage() {
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  useEffect(() => {
    if (user) fetchData()
  }, [user])

  async function fetchData() {
    setLoading(true)
    const { data } = await supabase
      .from('routes')
      .select('*, risk_analyses(risk_score, risk_level, summary, created_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setRoutes(data || [])
    setLastRefresh(new Date())
    setLoading(false)
  }

  const getLatestScore = (route) => {
    if (!route.risk_analyses?.length) return null
    return route.risk_analyses[0]?.risk_score ?? null
  }

  const analyzedRoutes = routes.filter(r => r.risk_analyses?.length > 0)
  const highRiskRoutes = routes.filter(r => {
    const s = getLatestScore(r)
    return s !== null && s >= 70
  })
  const mediumRiskRoutes = routes.filter(r => {
    const s = getLatestScore(r)
    return s !== null && s >= 40 && s < 70
  })
  const unanalyzedRoutes = routes.filter(r => !r.risk_analyses?.length)

  const avgScore = analyzedRoutes.length > 0
    ? Math.round(analyzedRoutes.reduce((acc, r) => acc + (getLatestScore(r) || 0), 0) / analyzedRoutes.length)
    : null

  const recentAnalyses = routes
    .filter(r => r.risk_analyses?.length > 0)
    .sort((a, b) => {
      const dateA = new Date(a.risk_analyses[0].created_at)
      const dateB = new Date(b.risk_analyses[0].created_at)
      return dateB - dateA
    })
    .slice(0, 5)

  const criticalAlerts = highRiskRoutes.length
  const globalRiskLevel = avgScore === null ? null : avgScore >= 70 ? 'high' : avgScore >= 40 ? 'medium' : 'low'

  const formatTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (days > 0) return days === 1 ? 'Hace 1 dia' : 'Hace ' + days + ' dias'
    if (hours > 0) return hours === 1 ? 'Hace 1 hora' : 'Hace ' + hours + ' horas'
    return 'Hace unos minutos'
  }

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Importador'

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Bienvenido, {firstName}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {new Date().toLocaleDateString('es', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
          Actualizar
        </button>
      </div>

      {/* Critical alert banner */}
      {criticalAlerts > 0 && (
        <div
          onClick={() => navigate('/routes')}
          className="card border-red-500/40 bg-red-500/5 p-4 flex items-center gap-3 cursor-pointer hover:bg-red-500/10 transition-colors"
        >
          <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-red-400 font-semibold text-sm">
              {criticalAlerts === 1
                ? '1 ruta con riesgo CRITICO requiere atencion inmediata'
                : criticalAlerts + ' rutas con riesgo CRITICO requieren atencion inmediata'}
            </p>
            <p className="text-slate-400 text-xs mt-0.5">
              {highRiskRoutes.map(r => r.origin_country + ' → ' + r.destination_country).join(', ')}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-red-400 flex-shrink-0" />
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Globe}
          label="Rutas Activas"
          value={routes.length}
          sub={unanalyzedRoutes.length > 0 ? unanalyzedRoutes.length + ' sin analizar' : 'Todas analizadas'}
          color="text-brand-400"
          onClick={() => navigate('/routes')}
        />
        <StatCard
          icon={BarChart3}
          label="Score Promedio"
          value={avgScore !== null ? avgScore : '—'}
          sub={avgScore !== null ? (globalRiskLevel === 'high' ? 'Riesgo alto global' : globalRiskLevel === 'medium' ? 'Riesgo moderado' : 'Riesgo controlado') : 'Sin analisis aun'}
          color={avgScore === null ? 'text-slate-400' : avgScore >= 70 ? 'text-red-400' : avgScore >= 40 ? 'text-amber-400' : 'text-emerald-400'}
        />
        <StatCard
          icon={AlertTriangle}
          label="Alertas Criticas"
          value={criticalAlerts}
          sub={criticalAlerts > 0 ? 'Requieren accion inmediata' : 'Sin alertas criticas'}
          color={criticalAlerts > 0 ? 'text-red-400' : 'text-emerald-400'}
          onClick={criticalAlerts > 0 ? () => navigate('/routes') : undefined}
        />
        <StatCard
          icon={Shield}
          label="Rutas Monitoreadas"
          value={analyzedRoutes.length + '/' + routes.length}
          sub={analyzedRoutes.length > 0 ? 'Ultimo: ' + (recentAnalyses[0] ? formatTimeAgo(recentAnalyses[0].risk_analyses[0].created_at) : '—') : 'Inicia tu primer analisis'}
          color="text-brand-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Risk Overview */}
        <div className="lg:col-span-2 space-y-4">

          {/* Risk Distribution */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Distribucion de Riesgo por Ruta</h2>
              <button
                onClick={() => navigate('/routes')}
                className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1 transition-colors"
              >
                Ver todas <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-14 bg-slate-800 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : routes.length === 0 ? (
              <div className="text-center py-8">
                <Globe className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">No hay rutas registradas</p>
                <button
                  onClick={() => navigate('/routes')}
                  className="mt-3 text-brand-400 hover:text-brand-300 text-sm underline"
                >
                  Crear primera ruta
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {routes.slice(0, 6).map(route => {
                  const score = getLatestScore(route)
                  return (
                    <div key={route.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors group">
                      <div className="w-8 h-8 bg-brand-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-brand-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-white text-sm font-medium truncate">
                            {route.origin_country} <span className="text-slate-500">→</span> {route.destination_country}
                          </p>
                          <ScoreBadge score={score} />
                        </div>
                        <div className="flex items-center gap-2">
                          <RiskBar score={score} />
                          <span className="text-slate-500 text-xs w-12 text-right flex-shrink-0">{route.cargo_type}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
                {routes.length > 6 && (
                  <button
                    onClick={() => navigate('/routes')}
                    className="w-full text-center text-slate-400 hover:text-brand-400 text-sm py-2 transition-colors"
                  >
                    Ver {routes.length - 6} rutas mas...
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Recent Analyses */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Ultimos Analisis de IA</h2>
              <span className="text-slate-500 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Actualizado: {lastRefresh.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {recentAnalyses.length === 0 ? (
              <div className="text-center py-6">
                <Activity className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Sin analisis realizados aun</p>
                <p className="text-slate-500 text-xs mt-1">Ve a Rutas y presiona "Analizar" en cualquier ruta</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAnalyses.map(route => {
                  const analysis = route.risk_analyses[0]
                  const score = analysis.risk_score
                  return (
                    <div
                      key={route.id}
                      onClick={() => navigate('/routes')}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <div className={'w-2 h-2 rounded-full flex-shrink-0 ' + (score >= 70 ? 'bg-red-400' : score >= 40 ? 'bg-amber-400' : 'bg-emerald-400')} />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 text-sm font-medium truncate">
                          {route.origin_country} → {route.destination_country}
                        </p>
                        {analysis.summary && (
                          <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{analysis.summary}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <ScoreBadge score={score} />
                        <p className="text-slate-600 text-xs mt-1">{formatTimeAgo(analysis.created_at)}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">

          {/* Risk Summary */}
          <div className="card p-5">
            <h2 className="text-white font-semibold mb-4">Resumen de Riesgo</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-slate-300 text-sm">Riesgo Alto</span>
                </div>
                <span className="text-red-400 font-bold text-lg">{highRiskRoutes.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-300 text-sm">Riesgo Medio</span>
                </div>
                <span className="text-amber-400 font-bold text-lg">{mediumRiskRoutes.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300 text-sm">Riesgo Bajo</span>
                </div>
                <span className="text-emerald-400 font-bold text-lg">{analyzedRoutes.length - highRiskRoutes.length - mediumRiskRoutes.length}</span>
              </div>
              {unanalyzedRoutes.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span className="text-slate-400 text-sm">Pendientes</span>
                  </div>
                  <span className="text-slate-400 font-bold text-lg">{unanalyzedRoutes.length}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card p-5">
            <h2 className="text-white font-semibold mb-3">Acciones Rapidas</h2>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/routes')}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-slate-800 transition-colors group"
              >
                <div className="w-8 h-8 bg-brand-600/20 rounded-lg flex items-center justify-center">
                  <Globe className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <p className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">Gestionar Rutas</p>
                  <p className="text-slate-500 text-xs">Crear, editar y analizar rutas</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-slate-400" />
              </button>

              {unanalyzedRoutes.length > 0 && (
                <button
                  onClick={() => navigate('/routes')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-slate-800 transition-colors group"
                >
                  <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">Analizar Pendientes</p>
                    <p className="text-slate-500 text-xs">{unanalyzedRoutes.length} ruta{unanalyzedRoutes.length > 1 ? 's' : ''} sin analizar</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-slate-400" />
                </button>
              )}

              <button
                onClick={() => navigate('/reports')}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg hover:bg-slate-800 transition-colors group"
              >
                <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">Ver Reportes</p>
                  <p className="text-slate-500 text-xs">Reportes ejecutivos PDF</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-slate-400" />
              </button>
            </div>
          </div>

          {/* Pro tip */}
          <div className="card p-4 border-brand-500/20 bg-brand-500/5">
            <div className="flex items-start gap-3">
              <Shield className="w-4 h-4 text-brand-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1">Consejo Profesional</p>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Analiza tus rutas semanalmente. Los riesgos geopoliticos pueden cambiar rapidamente y un score alto no detectado puede generar retrasos de hasta 30 dias en aduana.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
                   }
