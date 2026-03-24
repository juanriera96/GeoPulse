import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import {
  Globe, Plus, Trash2, Edit2, X, Package, TrendingUp, MapPin, Zap,
  Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle,
  Clock, Info, Shield, Anchor, BarChart3, FileText, RefreshCw,
  Ship, Plane, Truck, ArrowRight, Activity, TrendingDown, Minus
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const CARGO_TYPES = [
  'Componentes electrónicos', 'Textil y confección', 'Alimentos y perecederos',
  'Maquinaria y equipos', 'Químicos y farmacéuticos', 'Automotriz y autopartes',
  'Materias primas', 'Productos terminados', 'Energía y combustibles', 'Otro'
]

const COUNTRIES = [
  'China', 'México', 'Canadá', 'Alemania', 'Japón', 'Vietnam', 'India',
  'Corea del Sur', 'Taiwán', 'Brasil', 'Indonesia', 'Italia', 'Francia',
  'Reino Unido', 'Turquía', 'Polonia', 'Tailandia', 'Malasia',
  'Australia', 'Estados Unidos', 'España', 'Países Bajos', 'Bélgica',
  'Argentina', 'Chile', 'Colombia'
]

const INCOTERMS = ['FOB', 'CIF', 'EXW', 'DAP', 'DDP', 'CFR', 'FCA', 'CPT', 'CIP']

const TRANSPORT_MODES = [
  { value: 'maritimo', label: 'Marítimo', icon: '🚢' },
  { value: 'aereo', label: 'Aéreo', icon: '✈️' },
  { value: 'terrestre', label: 'Terrestre', icon: '🚛' },
  { value: 'multimodal', label: 'Multimodal', icon: '🔄' },
]

const emptyForm = {
  name: '', origin_country: '', destination_country: '',
  cargo_type: '', incoterm: '', transport_mode: '',
  port_of_origin: '', port_of_destination: ''
}

function riskColor(score) {
  if (score === null || score === undefined) return 'text-slate-400'
  if (score >= 70) return 'text-red-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-emerald-400'
}
function riskBg(score) {
  if (score === null || score === undefined) return 'bg-slate-800 border-slate-700'
  if (score >= 70) return 'bg-red-950/30 border-red-900/50'
  if (score >= 40) return 'bg-amber-950/30 border-amber-900/50'
  return 'bg-emerald-950/30 border-emerald-900/50'
}
function riskLabel(score) {
  if (score === null || score === undefined) return 'Sin analizar'
  if (score >= 70) return 'Alto Riesgo'
  if (score >= 40) return 'Riesgo Medio'
  return 'Bajo Riesgo'
}
function riskBarColor(score) {
  if (score === null || score === undefined) return 'bg-slate-600'
  if (score >= 70) return 'bg-red-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-emerald-500'
}
function getLatestAnalysis(route) {
  if (!route.risk_analyses?.length) return null
  return route.risk_analyses[0]
}
function getLatestScore(route) {
  return getLatestAnalysis(route)?.risk_score ?? null
}

// SVG Sparkline component for risk score history
function RiskSparkline({ analyses }) {
  if (!analyses || analyses.length < 2) {
    return (
      <div className="flex items-center justify-center h-12 text-xs text-slate-600">
        Se necesitan al menos 2 análisis para mostrar tendencia
      </div>
    )
  }

  const sorted = [...analyses].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  const scores = sorted.map(a => a.risk_score)
  const w = 300, h = 60, pad = 8
  const minS = 0, maxS = 100
  const xStep = (w - pad * 2) / (scores.length - 1)

  const pts = scores.map((s, i) => {
    const x = pad + i * xStep
    const y = h - pad - ((s - minS) / (maxS - minS)) * (h - pad * 2)
    return `${x},${y}`
  }).join(' ')

  const areaPoints = [
    `${pad},${h - pad}`,
    ...scores.map((s, i) => {
      const x = pad + i * xStep
      const y = h - pad - ((s - minS) / (maxS - minS)) * (h - pad * 2)
      return `${x},${y}`
    }),
    `${pad + (scores.length - 1) * xStep},${h - pad}`
  ].join(' ')

  const lastScore = scores[scores.length - 1]
  const firstScore = scores[0]
  const trend = lastScore - firstScore
  const lineColor = lastScore >= 70 ? '#f87171' : lastScore >= 40 ? '#fbbf24' : '#34d399'
  const fillColor = lastScore >= 70 ? '#7f1d1d' : lastScore >= 40 ? '#78350f' : '#064e3b'

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Tendencia ({analyses.length} análisis)</span>
        <div className={`flex items-center gap-1 ${trend > 5 ? 'text-red-400' : trend < -5 ? 'text-emerald-400' : 'text-slate-400'}`}>
          {trend > 5 ? <TrendingUp className="w-3 h-3" /> : trend < -5 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          <span>{trend > 0 ? '+' : ''}{trend.toFixed(0)} pts</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14">
        {/* Danger zone line at 70 */}
        <line
          x1={pad} y1={h - pad - (70 / 100) * (h - pad * 2)}
          x2={w - pad} y2={h - pad - (70 / 100) * (h - pad * 2)}
          stroke="#7f1d1d" strokeDasharray="3 2" strokeWidth="0.5" opacity="0.5"
        />
        {/* Medium zone line at 40 */}
        <line
          x1={pad} y1={h - pad - (40 / 100) * (h - pad * 2)}
          x2={w - pad} y2={h - pad - (40 / 100) * (h - pad * 2)}
          stroke="#78350f" strokeDasharray="3 2" strokeWidth="0.5" opacity="0.5"
        />
        {/* Area fill */}
        <polygon points={areaPoints} fill={fillColor} opacity="0.3" />
        {/* Line */}
        <polyline points={pts} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
        {/* Data points */}
        {scores.map((s, i) => {
          const x = pad + i * xStep
          const y = h - pad - ((s - minS) / (maxS - minS)) * (h - pad * 2)
          return (
            <circle key={i} cx={x} cy={y} r="2.5"
              fill={s >= 70 ? '#f87171' : s >= 40 ? '#fbbf24' : '#34d399'}
              stroke="#1e293b" strokeWidth="1"
            />
          )
        })}
      </svg>
      <div className="flex justify-between text-xs text-slate-600">
        {sorted.slice(0, 1).map(a => (
          <span key="first">{new Date(a.created_at).toLocaleDateString('es', { month: 'short', day: 'numeric' })}</span>
        ))}
        {sorted.slice(-1).map(a => (
          <span key="last">{new Date(a.created_at).toLocaleDateString('es', { month: 'short', day: 'numeric' })}</span>
        ))}
      </div>
    </div>
  )
}

export default function RoutesPage() {
  const { user } = useAuthStore()
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingRoute, setEditingRoute] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [analyzingId, setAnalyzingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [filterLevel, setFilterLevel] = useState('all')
  const [activeTab, setActiveTab] = useState('analysis')

  useEffect(() => {
    if (user) fetchRoutes()
  }, [user])

  async function fetchRoutes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('routes')
      .select(`
        *,
        risk_analyses(
          id, risk_score, risk_level, summary,
          factors, recommendations, trade_data,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) {
      toast.error('Error cargando rutas')
      setLoading(false)
      return
    }
    // Sort analyses by date desc for each route
    const processed = (data || []).map(r => ({
      ...r,
      risk_analyses: (r.risk_analyses || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      )
    }))
    setRoutes(processed)
    setLoading(false)
  }

  async function handleSave() {
    if (!form.name.trim()) return toast.error('Nombre de ruta requerido')
    if (!form.origin_country) return toast.error('País de origen requerido')
    if (!form.destination_country) return toast.error('País de destino requerido')
    if (!form.cargo_type) return toast.error('Tipo de mercancía requerido')
    setSaving(true)
    try {
      const payload = { ...form, user_id: user.id }
      if (editingRoute) {
        const { error } = await supabase.from('routes').update(payload).eq('id', editingRoute.id)
        if (error) throw error
        toast.success('Ruta actualizada')
      } else {
        const { error } = await supabase.from('routes').insert(payload)
        if (error) throw error
        toast.success('Ruta creada')
      }
      setShowModal(false)
      setEditingRoute(null)
      setForm(emptyForm)
      fetchRoutes()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta ruta y todos sus análisis?')) return
    const { error } = await supabase.from('routes').delete().eq('id', id)
    if (error) return toast.error(err.message)
    toast.success('Ruta eliminada')
    fetchRoutes()
  }

  async function handleAnalyze(route) {
    setAnalyzingId(route.id)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: route.id,
          userId: user.id,
          originCountry: route.origin_country,
          destinationCountry: route.destination_country,
          cargoType: route.cargo_type,
          incoterm: route.incoterm,
          transportMode: route.transport_mode,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error en análisis')
      toast.success('Análisis completado')
      setExpandedId(route.id)
      setActiveTab('analysis')
      fetchRoutes()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setAnalyzingId(null)
    }
  }

  function openEdit(route) {
    setEditingRoute(route)
    setForm({
      name: route.name,
      origin_country: route.origin_country,
      destination_country: route.destination_country,
      cargo_type: route.cargo_type,
      incoterm: route.incoterm || '',
      transport_mode: route.transport_mode || '',
      port_of_origin: route.port_of_origin || '',
      port_of_destination: route.port_of_destination || '',
    })
    setShowModal(true)
  }

  const filtered = routes.filter(r => {
    if (filterLevel === 'all') return true
    const score = getLatestScore(r)
    if (filterLevel === 'critical') return score !== null && score >= 70
    if (filterLevel === 'medium') return score !== null && score >= 40 && score < 70
    if (filterLevel === 'low') return score !== null && score < 40
    if (filterLevel === 'unanalyzed') return score === null
    return true
  })

  const counts = {
    all: routes.length,
    critical: routes.filter(r => { const s = getLatestScore(r); return s !== null && s >= 70 }).length,
    medium: routes.filter(r => { const s = getLatestScore(r); return s !== null && s >= 40 && s < 70 }).length,
    low: routes.filter(r => { const s = getLatestScore(r); return s !== null && s < 40 }).length,
    unanalyzed: routes.filter(r => getLatestScore(r) === null).length,
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white">Rutas Comerciales</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Monitoreo y análisis de riesgo geopolítico por ruta de importación/exportación
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchRoutes} className="btn-ghost p-2 rounded-lg" title="Actualizar">
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={() => { setEditingRoute(null); setForm(emptyForm); setShowModal(true) }}
            className="btn-primary flex items-center gap-2 px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            Nueva ruta
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'all', label: 'Todas', count: counts.all },
          { key: 'critical', label: 'Alto Riesgo', count: counts.critical },
          { key: 'medium', label: 'Riesgo Medio', count: counts.medium },
          { key: 'low', label: 'Bajo Riesgo', count: counts.low },
          { key: 'unanalyzed', label: 'Sin Analizar', count: counts.unanalyzed },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilterLevel(key)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filterLevel === key
                ? 'bg-brand-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-slate-300 border border-slate-700'
            )}
          >
            {label}
            <span className={clsx(
              'text-xs px-1.5 py-0.5 rounded-full',
              filterLevel === key ? 'bg-brand-700 text-brand-100' : 'bg-slate-700 text-slate-500'
            )}>{count}</span>
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Globe className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">
            {routes.length === 0 ? 'Sin rutas configuradas' : 'Sin rutas en este filtro'}
          </h3>
          <p className="text-slate-500 text-sm mb-6">
            {routes.length === 0
              ? 'Agrega tu primera ruta de importación para comenzar el monitoreo geopolítico.'
              : 'Cambia el filtro para ver otras rutas.'}
          </p>
          {routes.length === 0 && (
            <button
              onClick={() => { setEditingRoute(null); setForm(emptyForm); setShowModal(true) }}
              className="btn-primary flex items-center gap-2 mx-auto px-5 py-2.5"
            >
              <Plus className="w-4 h-4" />
              Agregar primera ruta
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(route => {
            const score = getLatestScore(route)
            const latest = getLatestAnalysis(route)
            const isExpanded = expandedId === route.id
            const isAnalyzing = analyzingId === route.id

            return (
              <div key={route.id} className={clsx('card border transition-all', riskBg(score))}>
                {/* Route header */}
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Risk score badge */}
                    <div className={clsx(
                      'w-14 h-14 rounded-xl flex flex-col items-center justify-center flex-shrink-0 border',
                      score === null ? 'bg-slate-800 border-slate-700' :
                      score >= 70 ? 'bg-red-900/50 border-red-700/50' :
                      score >= 40 ? 'bg-amber-900/50 border-amber-700/50' :
                      'bg-emerald-900/50 border-emerald-700/50'
                    )}>
                      {score !== null ? (
                        <>
                          <span className={`text-xl font-bold leading-none ${riskColor(score)}`}>{score}</span>
                          <span className="text-xs text-slate-500 mt-0.5">/100</span>
                        </>
                      ) : (
                        <Clock className="w-6 h-6 text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white text-sm">{route.name}</h3>
                        {score !== null && (
                          <span className={clsx(
                            'text-xs px-2 py-0.5 rounded-full border font-medium',
                            score >= 70 ? 'bg-red-900/40 border-red-700/50 text-red-300' :
                            score >= 40 ? 'bg-amber-900/40 border-amber-700/50 text-amber-300' :
                            'bg-emerald-900/40 border-emerald-700/50 text-emerald-300'
                          )}>{riskLabel(score)}</span>
                        )}
                        {route.risk_analyses?.length > 1 && (
                          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                            {route.risk_analyses.length} análisis
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-400">
                        <span className="font-medium text-white">{route.origin_country}</span>
                        <ArrowRight className="w-3 h-3 text-slate-600" />
                        <span className="font-medium text-white">{route.destination_country}</span>
                      </div>

                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Package className="w-3 h-3" />{route.cargo_type}
                        </span>
                        {route.incoterm && (
                          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                            {route.incoterm}
                          </span>
                        )}
                        {route.transport_mode && (
                          <span className="text-xs text-slate-500 capitalize">
                            {route.transport_mode === 'maritimo' ? '🚢' :
                             route.transport_mode === 'aereo' ? '✈️' :
                             route.transport_mode === 'terrestre' ? '🚛' : '🔄'} {route.transport_mode}
                          </span>
                        )}
                        {latest && (
                          <span className="text-xs text-slate-600">
                            Último análisis: {new Date(latest.created_at).toLocaleDateString('es')}
                          </span>
                        )}
                      </div>

                      {/* Mini progress bar */}
                      {score !== null && (
                        <div className="mt-2 w-full max-w-xs bg-slate-800 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${riskBarColor(score)}`}
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleAnalyze(route)}
                      disabled={isAnalyzing}
                      className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs"
                      title="Analizar riesgo con IA"
                    >
                      {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                      {isAnalyzing ? 'Analizando...' : 'Analizar'}
                    </button>
                    <button
                      onClick={() => openEdit(route)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
                      title="Editar ruta"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(route.id)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      title="Eliminar ruta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setExpandedId(isExpanded ? null : route.id)
                        setActiveTab('analysis')
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {/* Expanded analysis panel */}
                {isExpanded && (
                  <div className="border-t border-slate-700/50">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-700/50">
                      {[
                        { key: 'analysis', label: 'Análisis', icon: Shield },
                        { key: 'history', label: 'Histórico', icon: Activity },
                        { key: 'tradedata', label: 'Datos Comerciales', icon: BarChart3 },
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => setActiveTab(key)}
                          className={clsx(
                            'flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors',
                            activeTab === key
                              ? 'border-brand-500 text-white'
                              : 'border-transparent text-slate-500 hover:text-slate-300'
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>

                    <div className="p-5">
                      {/* ANALYSIS TAB */}
                      {activeTab === 'analysis' && latest && (
                        <div className="space-y-5">
                          {/* Summary */}
                          <div>
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Resumen Ejecutivo</h4>
                            <p className="text-sm text-slate-300 leading-relaxed bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                              {latest.summary}
                            </p>
                          </div>

                          {/* Risk Factors */}
                          {latest.factors && latest.factors.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Factores de Riesgo</h4>
                              <div className="space-y-2">
                                {latest.factors.map((f, i) => (
                                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                    <div className={clsx(
                                      'text-xs font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 mt-0.5',
                                      f.severity === 'high' || f.severity === 'critical' ? 'text-red-400 border-red-800 bg-red-950/30' :
                                      f.severity === 'medium' ? 'text-amber-400 border-amber-800 bg-amber-950/30' :
                                      'text-emerald-400 border-emerald-800 bg-emerald-950/30'
                                    )}>
                                      {(f.severity || 'bajo').toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-white">{f.name || f.factor}</p>
                                      <p className="text-xs text-slate-400 mt-0.5">{f.description || f.impact}</p>
                                    </div>
                                    {f.score !== undefined && (
                                      <span className={`text-sm font-bold ${riskColor(f.score)}`}>{f.score}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recommendations */}
                          {latest.recommendations && latest.recommendations.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Recomendaciones Operativas</h4>
                              <div className="space-y-2">
                                {latest.recommendations.map((rec, i) => (
                                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300 p-2.5 rounded-lg bg-slate-800/30 border border-slate-700/30">
                                    <span className="w-5 h-5 bg-brand-600/20 text-brand-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                      {i + 1}
                                    </span>
                                    <span className="leading-relaxed">{typeof rec === 'string' ? rec : rec.action || rec.text || JSON.stringify(rec)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="text-xs text-slate-600 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Análisis generado: {new Date(latest.created_at).toLocaleString('es')} • Powered by Claude AI
                          </div>
                        </div>
                      )}

                      {activeTab === 'analysis' && !latest && (
                        <div className="text-center py-10">
                          <Zap className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                          <p className="text-slate-400 text-sm mb-4">Esta ruta aún no tiene análisis de riesgo.</p>
                          <button
                            onClick={() => handleAnalyze(route)}
                            disabled={isAnalyzing}
                            className="btn-primary flex items-center gap-2 mx-auto px-4 py-2"
                          >
                            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                            Generar primer análisis
                          </button>
                        </div>
                      )}

                      {/* HISTORY TAB */}
                      {activeTab === 'history' && (
                        <div className="space-y-5">
                          {route.risk_analyses && route.risk_analyses.length > 0 ? (
                            <>
                              <RiskSparkline analyses={route.risk_analyses} />

                              <div>
                                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Historial de Análisis</h4>
                                <div className="space-y-2">
                                  {route.risk_analyses.map((a, i) => (
                                    <div key={a.id || i} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                      <div className={clsx(
                                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border',
                                        a.risk_score >= 70 ? 'bg-red-900/40 border-red-700/40 text-red-400' :
                                        a.risk_score >= 40 ? 'bg-amber-900/40 border-amber-700/40 text-amber-400' :
                                        'bg-emerald-900/40 border-emerald-700/40 text-emerald-400'
                                      )}>
                                        <span className="text-sm font-bold">{a.risk_score}</span>
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className={`text-xs font-medium ${riskColor(a.risk_score)}`}>
                                            {riskLabel(a.risk_score)}
                                          </span>
                                          {i === 0 && (
                                            <span className="text-xs bg-brand-600/20 text-brand-400 px-1.5 py-0.5 rounded-full border border-brand-700/30">
                                              Más reciente
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{a.summary}</p>
                                      </div>
                                      <span className="text-xs text-slate-600 flex-shrink-0">
                                        {new Date(a.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short', year: '2-digit' })}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-10">
                              <Activity className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                              <p className="text-slate-400 text-sm">No hay historial de análisis aún.</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* TRADE DATA TAB */}
                      {activeTab === 'tradedata' && latest?.trade_data && (
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(latest.trade_data).map(([key, value]) => (
                            <div key={key} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                              <p className="text-xs text-slate-500 capitalize mb-1">
                                {key.replace(/_/g, ' ')}
                              </p>
                              <p className="text-sm font-medium text-white">{String(value)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {activeTab === 'tradedata' && !latest?.trade_data && (
                        <div className="text-center py-10">
                          <BarChart3 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                          <p className="text-slate-400 text-sm">Genera un análisis para ver datos comerciales.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-base font-semibold text-white">
                {editingRoute ? 'Editar ruta' : 'Nueva ruta comercial'}
              </h2>
              <button
                onClick={() => { setShowModal(false); setEditingRoute(null); setForm(emptyForm) }}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="label">Nombre de la ruta *</label>
                <input
                  className="input"
                  placeholder="Ej. China-México Electrónicos Q1"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">País de origen *</label>
                  <select className="input" value={form.origin_country} onChange={e => setForm(p => ({ ...p, origin_country: e.target.value }))}>
                    <option value="">Seleccionar</option>
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">País de destino *</label>
                  <select className="input" value={form.destination_country} onChange={e => setForm(p => ({ ...p, destination_country: e.target.value }))}>
                    <option value="">Seleccionar</option>
                    {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Puerto / Ciudad origen</label>
                  <input
                    className="input"
                    placeholder="Ej. Shanghái, Shenzhen"
                    value={form.port_of_origin}
                    onChange={e => setForm(p => ({ ...p, port_of_origin: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Puerto / Ciudad destino</label>
                  <input
                    className="input"
                    placeholder="Ej. Manzanillo, Veracruz"
                    value={form.port_of_destination}
                    onChange={e => setForm(p => ({ ...p, port_of_destination: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Tipo de mercancía *</label>
                  <select className="input" value={form.cargo_type} onChange={e => setForm(p => ({ ...p, cargo_type: e.target.value }))}>
                    <option value="">Seleccionar tipo</option>
                    {CARGO_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Incoterm</label>
                  <select className="input" value={form.incoterm} onChange={e => setForm(p => ({ ...p, incoterm: e.target.value }))}>
                    <option value="">Seleccionar</option>
                    {INCOTERMS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Modo de transporte</label>
                <div className="grid grid-cols-4 gap-2">
                  {TRANSPORT_MODES.map(({ value, label, icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, transport_mode: p.transport_mode === value ? '' : value }))}
                      className={clsx(
                        'flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs transition-all',
                        form.transport_mode === value
                          ? 'border-brand-500 bg-brand-600/10 text-white'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      )}
                    >
                      <span className="text-lg">{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t border-slate-700">
              <button
                onClick={() => { setShowModal(false); setEditingRoute(null); setForm(emptyForm) }}
                className="btn-ghost px-4 py-2"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn-primary flex items-center gap-2 px-5 py-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editingRoute ? 'Guardar cambios' : 'Crear ruta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
    }
