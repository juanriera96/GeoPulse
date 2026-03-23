import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import {
  Globe, Plus, Trash2, Edit2, X, Package, TrendingUp, MapPin, Zap,
  Loader2, ChevronDown, ChevronUp, AlertTriangle, CheckCircle,
  Clock, Info, Shield, Anchor, BarChart3, FileText, RefreshCw
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const CARGO_TYPES = [
  'Electronica', 'Textil', 'Alimentos', 'Maquinaria', 'Quimicos',
  'Automotriz', 'Farmaceutico', 'Materias primas', 'Otro'
]

const COUNTRIES = [
  'China', 'Mexico', 'Canada', 'Alemania', 'Japan', 'Vietnam', 'India',
  'Corea del Sur', 'Taiwan', 'Brasil', 'Indonesia', 'Italia', 'Francia',
  'Reino Unido', 'Turquia', 'Poland', 'Rusia', 'Tailandia', 'Malasia',
  'Australia', 'EE.UU.'
]

function riskColor(score) {
  if (score === null || score === undefined) return 'text-slate-400'
  if (score >= 70) return 'text-red-400'
  if (score >= 40) return 'text-amber-400'
  return 'text-emerald-400'
}

function riskLabel(score) {
  if (score === null || score === undefined) return 'Sin analizar'
  if (score >= 70) return 'Alto'
  if (score >= 40) return 'Medio'
  return 'Bajo'
}

function riskBg(score) {
  if (score === null || score === undefined) return 'bg-slate-700'
  if (score >= 70) return 'bg-red-500'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-emerald-500'
}

function riskBgLight(score) {
  if (score === null || score === undefined) return 'bg-slate-800 border-slate-700'
  if (score >= 70) return 'bg-red-500/10 border-red-500/30'
  if (score >= 40) return 'bg-amber-500/10 border-amber-500/30'
  return 'bg-emerald-500/10 border-emerald-500/30'
}

function severityIcon(sev) {
  if (sev === 'high') return <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
  if (sev === 'medium') return <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
  return <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
}

function priorityLabel(p) {
  if (p === 'immediate') return { text: 'Inmediato', cls: 'text-red-400 bg-red-500/10' }
  if (p === 'short_term') return { text: 'Corto plazo', cls: 'text-amber-400 bg-amber-500/10' }
  return { text: 'Largo plazo', cls: 'text-slate-400 bg-slate-700' }
}

const emptyForm = {
  origin_country: '',
  destination_country: '',
  cargo_type: '',
  description: '',
}

function getLatestAnalysis(route) {
  if (!route.risk_analyses?.length) return null
  return route.risk_analyses[0]
}

function getLatestScore(route) {
  return getLatestAnalysis(route)?.risk_score ?? null
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
          risk_score, risk_level, summary,
          factors, recommendations, trade_data,
          created_at
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) {
      toast.error('Error cargando rutas')
    } else {
      setRoutes(data || [])
    }
    setLoading(false)
  }

  function openCreate() {
    setEditingRoute(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(route) {
    setEditingRoute(route)
    setForm({
      origin_country: route.origin_country,
      destination_country: route.destination_country,
      cargo_type: route.cargo_type,
      description: route.description || '',
    })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingRoute(null)
    setForm(emptyForm)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.origin_country || !form.destination_country || !form.cargo_type) {
      toast.error('Completa todos los campos requeridos')
      return
    }
    if (form.origin_country === form.destination_country) {
      toast.error('El pais de origen y destino no pueden ser iguales')
      return
    }
    setSaving(true)
    if (editingRoute) {
      const { error } = await supabase
        .from('routes')
        .update({
          origin_country: form.origin_country,
          destination_country: form.destination_country,
          cargo_type: form.cargo_type,
          description: form.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingRoute.id)
      if (error) {
        toast.error('Error actualizando ruta')
      } else {
        toast.success('Ruta actualizada correctamente')
        closeModal()
        fetchRoutes()
      }
    } else {
      const { error } = await supabase
        .from('routes')
        .insert({
          user_id: user.id,
          origin_country: form.origin_country,
          destination_country: form.destination_country,
          cargo_type: form.cargo_type,
          description: form.description,
        })
      if (error) {
        toast.error('Error creando ruta')
      } else {
        toast.success('Ruta creada exitosamente')
        closeModal()
        fetchRoutes()
      }
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    if (!confirm('Estas seguro que deseas eliminar esta ruta? Esta accion no se puede deshacer.')) return
    const { error } = await supabase.from('routes').delete().eq('id', id)
    if (error) {
      toast.error('Error eliminando ruta')
    } else {
      toast.success('Ruta eliminada')
      setRoutes(prev => prev.filter(r => r.id !== id))
      if (expandedId === id) setExpandedId(null)
    }
  }

  async function handleAnalyze(route) {
    setAnalyzingId(route.id)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: route.origin_country,
          destination: route.destination_country,
          cargo: route.cargo_type,
          routeId: route.id,
          userId: user.id,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Error en el analisis')
      }
      const result = await res.json()
      const level = result.score >= 70 ? 'ALTO' : result.score >= 40 ? 'MODERADO' : 'BAJO'
      toast.success('Analisis completado — Riesgo ' + level + ': ' + result.score + '/100')
      await fetchRoutes()
      setExpandedId(route.id)
    } catch (err) {
      toast.error(err.message || 'Error al analizar la ruta')
    } finally {
      setAnalyzingId(null)
    }
  }

  const filteredRoutes = routes.filter(r => {
    if (filterLevel === 'all') return true
    const s = getLatestScore(r)
    if (filterLevel === 'unanalyzed') return s === null
    if (filterLevel === 'high') return s !== null && s >= 70
    if (filterLevel === 'medium') return s !== null && s >= 40 && s < 70
    if (filterLevel === 'low') return s !== null && s < 40
    return true
  })

  const counts = {
    all: routes.length,
    high: routes.filter(r => { const s = getLatestScore(r); return s !== null && s >= 70 }).length,
    medium: routes.filter(r => { const s = getLatestScore(r); return s !== null && s >= 40 && s < 70 }).length,
    low: routes.filter(r => { const s = getLatestScore(r); return s !== null && s < 40 }).length,
    unanalyzed: routes.filter(r => getLatestScore(r) === null).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Mis Rutas de Importacion</h1>
          <p className="text-slate-400 text-sm mt-1">
            {routes.length} {routes.length === 1 ? 'ruta registrada' : 'rutas registradas'} —
            {counts.high > 0 && <span className="text-red-400"> {counts.high} critica{counts.high > 1 ? 's' : ''}</span>}
            {counts.medium > 0 && <span className="text-amber-400"> {counts.medium} moderada{counts.medium > 1 ? 's' : ''}</span>}
            {counts.unanalyzed > 0 && <span className="text-slate-500"> {counts.unanalyzed} sin analizar</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRoutes}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Ruta
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      {routes.length > 0 && (
        <div className="flex items-center gap-1 mb-6 bg-slate-900 border border-slate-800 rounded-lg p-1 w-fit">
          {[
            { key: 'all', label: 'Todas', count: counts.all },
            { key: 'high', label: 'Alto', count: counts.high, color: 'text-red-400' },
            { key: 'medium', label: 'Medio', count: counts.medium, color: 'text-amber-400' },
            { key: 'low', label: 'Bajo', count: counts.low, color: 'text-emerald-400' },
            { key: 'unanalyzed', label: 'Pendientes', count: counts.unanalyzed, color: 'text-slate-500' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterLevel(tab.key)}
              className={clsx(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5',
                filterLevel === tab.key
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-300'
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={clsx('text-xs font-semibold', filterLevel === tab.key ? (tab.color || 'text-white') : (tab.color || 'text-slate-500'))}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {routes.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 bg-brand-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-brand-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Sin rutas registradas</h3>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto text-sm leading-relaxed">
            Agrega tu primera ruta de importacion para comenzar a monitorear el riesgo geopolitico con inteligencia artificial.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear primera ruta
          </button>
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-400">No hay rutas con este nivel de riesgo.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRoutes.map(route => {
            const analysis = getLatestAnalysis(route)
            const score = analysis?.risk_score ?? null
            const isAnalyzing = analyzingId === route.id
            const isExpanded = expandedId === route.id

            return (
              <div key={route.id} className={'card transition-all ' + (isExpanded ? 'border-slate-600' : '')}>
                {/* Card main row */}
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Risk indicator */}
                    <div className={'w-1 self-stretch rounded-full flex-shrink-0 ' + (score === null ? 'bg-slate-700' : score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-amber-500' : 'bg-emerald-500')} />

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-semibold">
                              {route.origin_country} <span className="text-slate-500 font-normal">→</span> {route.destination_country}
                            </h3>
                            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{route.cargo_type}</span>
                          </div>
                          {route.description && (
                            <p className="text-slate-500 text-xs leading-relaxed">{route.description}</p>
                          )}
                          {analysis && (
                            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed max-w-xl">{analysis.summary}</p>
                          )}
                        </div>

                        {/* Score */}
                        <div className="text-right flex-shrink-0">
                          {score !== null ? (
                            <div className={'inline-flex flex-col items-center px-3 py-2 rounded-lg border ' + riskBgLight(score)}>
                              <span className={'text-2xl font-bold ' + riskColor(score)}>{score}</span>
                              <span className={'text-xs font-semibold ' + riskColor(score)}>{riskLabel(score)}</span>
                            </div>
                          ) : (
                            <div className="inline-flex flex-col items-center px-3 py-2 rounded-lg border border-slate-700 bg-slate-800">
                              <span className="text-slate-500 text-xs">Sin</span>
                              <span className="text-slate-500 text-xs">analizar</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Trade data row */}
                      {analysis?.trade_data && (
                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {analysis.trade_data.typical_transit_days} dias
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {analysis.trade_data.incoterms_recommended}
                          </span>
                          {analysis.trade_data.key_ports?.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Anchor className="w-3 h-3" />
                              {analysis.trade_data.key_ports.slice(0, 2).join(', ')}
                            </span>
                          )}
                          <span className={'flex items-center gap-1 ' + (analysis.trade_data.currency_risk === 'high' ? 'text-red-400' : analysis.trade_data.currency_risk === 'medium' ? 'text-amber-400' : 'text-emerald-400')}>
                            Riesgo cambiario: {analysis.trade_data.currency_risk === 'high' ? 'Alto' : analysis.trade_data.currency_risk === 'medium' ? 'Medio' : 'Bajo'}
                          </span>
                        </div>
                      )}

                      {/* Action row */}
                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={() => handleAnalyze(route)}
                          disabled={isAnalyzing}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          {isAnalyzing ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Analizando...</span></>
                          ) : (
                            <><Zap className="w-3.5 h-3.5" /><span>{score !== null ? 'Re-analizar' : 'Analizar'}</span></>
                          )}
                        </button>

                        {analysis && (
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : route.id)}
                            className={'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ' + (isExpanded ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700')}
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            {isExpanded ? 'Ocultar analisis' : 'Ver analisis completo'}
                          </button>
                        )}

                        <div className="ml-auto flex items-center gap-1">
                          <button
                            onClick={() => openEdit(route)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Editar ruta"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(route.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Eliminar ruta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded analysis */}
                {isExpanded && analysis && (
                  <div className="border-t border-slate-800 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-semibold text-sm flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-brand-400" />
                        Analisis Completo de Riesgo
                      </h4>
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(analysis.created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Factors */}
                      {analysis.factors?.length > 0 && (
                        <div>
                          <h5 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3" />
                            Factores de Riesgo
                          </h5>
                          <div className="space-y-2">
                            {analysis.factors.map((factor, i) => (
                              <div key={i} className="flex items-start gap-2 p-2.5 bg-slate-800 rounded-lg">
                                {severityIcon(factor.severity)}
                                <div className="min-w-0">
                                  <span className="text-xs font-semibold text-slate-300">{factor.category}: </span>
                                  <span className="text-xs text-slate-400">{factor.description}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {analysis.recommendations?.length > 0 && (
                        <div>
                          <h5 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Shield className="w-3 h-3" />
                            Recomendaciones
                          </h5>
                          <div className="space-y-2">
                            {analysis.recommendations.map((rec, i) => {
                              const p = priorityLabel(rec.priority)
                              return (
                                <div key={i} className="flex items-start gap-2 p-2.5 bg-slate-800 rounded-lg">
                                  <CheckCircle className="w-3.5 h-3.5 text-brand-400 flex-shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs text-slate-300 leading-relaxed">{rec.action}</p>
                                    <span className={'text-xs font-medium px-1.5 py-0.5 rounded mt-1 inline-block ' + p.cls}>{p.text}</span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Trade data expanded */}
                    {analysis.trade_data && (
                      <div className="pt-3 border-t border-slate-800">
                        <h5 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Package className="w-3 h-3" />
                          Datos Operativos de la Ruta
                        </h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-slate-800 rounded-lg p-3">
                            <p className="text-slate-500 text-xs">Tiempo de transito</p>
                            <p className="text-white font-semibold text-sm mt-1">{analysis.trade_data.typical_transit_days} dias</p>
                          </div>
                          <div className="bg-slate-800 rounded-lg p-3">
                            <p className="text-slate-500 text-xs">Incoterm recomendado</p>
                            <p className="text-white font-semibold text-sm mt-1">{analysis.trade_data.incoterms_recommended}</p>
                          </div>
                          <div className="bg-slate-800 rounded-lg p-3">
                            <p className="text-slate-500 text-xs">Riesgo cambiario</p>
                            <p className={'font-semibold text-sm mt-1 ' + (analysis.trade_data.currency_risk === 'high' ? 'text-red-400' : analysis.trade_data.currency_risk === 'medium' ? 'text-amber-400' : 'text-emerald-400')}>
                              {analysis.trade_data.currency_risk === 'high' ? 'Alto' : analysis.trade_data.currency_risk === 'medium' ? 'Medio' : 'Bajo'}
                            </p>
                          </div>
                          <div className="bg-slate-800 rounded-lg p-3">
                            <p className="text-slate-500 text-xs">Puertos clave</p>
                            <p className="text-white font-semibold text-sm mt-1">{analysis.trade_data.key_ports?.slice(0, 2).join(', ') || '—'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal create/edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {editingRoute ? 'Editar Ruta' : 'Nueva Ruta de Importacion'}
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">
                  {editingRoute ? 'Modifica los datos de la ruta' : 'Registra una nueva ruta para monitorear'}
                </p>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  Pais de Origen <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.origin_country}
                  onChange={e => setForm(f => ({ ...f, origin_country: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar pais de origen...</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  Pais de Destino <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.destination_country}
                  onChange={e => setForm(f => ({ ...f, destination_country: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar pais de destino...</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  <Package className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  Tipo de Carga <span className="text-red-400">*</span>
                </label>
                <select
                  value={form.cargo_type}
                  onChange={e => setForm(f => ({ ...f, cargo_type: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar tipo de carga...</option>
                  {CARGO_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Descripcion <span className="text-slate-600 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Ej: Importacion mensual de componentes electronicos para ensamblaje..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
                >
                  {saving ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Guardando...</span></>
                  ) : (
                    editingRoute ? 'Actualizar Ruta' : 'Crear Ruta'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
  }
