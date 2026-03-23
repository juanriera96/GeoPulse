import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { Globe, Plus, Trash2, Edit2, X, Package, AlertTriangle, TrendingUp, MapPin, Zap, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const CARGO_TYPES = [
    'Electronica', 'Textil', 'Alimentos', 'Maquinaria',
    'Quimicos', 'Automotriz', 'Farmaceutico', 'Materias primas', 'Otro'
  ]

const COUNTRIES = [
    'China', 'Mexico', 'Canada', 'Alemania', 'Japan', 'Vietnam',
    'India', 'Corea del Sur', 'Taiwan', 'Brasil', 'Indonesia',
    'Italia', 'Francia', 'Reino Unido', 'Turquia', 'Poland',
    'Rusia', 'Tailandia', 'Malasia', 'Australia', 'EE.UU.'
  ]

function riskColor(score) {
    if (!score && score !== 0) return 'text-slate-400'
    if (score >= 70) return 'text-red-400'
    if (score >= 40) return 'text-amber-400'
    return 'text-emerald-400'
}

function riskLabel(score) {
    if (!score && score !== 0) return 'Sin analizar'
    if (score >= 70) return 'Alto'
    if (score >= 40) return 'Medio'
    return 'Bajo'
}

function riskBg(score) {
    if (!score && score !== 0) return 'bg-slate-700'
    if (score >= 70) return 'bg-red-500'
    if (score >= 40) return 'bg-amber-500'
    return 'bg-emerald-500'
}

const emptyForm = {
    origin_country: '',
    destination_country: '',
    cargo_type: '',
    description: '',
}

function getLatestScore(route) {
    if (!route.risk_analyses || route.risk_analyses.length === 0) return null
    return route.risk_analyses[0]?.risk_score ?? null
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

  useEffect(() => {
        if (user) fetchRoutes()
  }, [user])

  async function fetchRoutes() {
        setLoading(true)
        const { data, error } = await supabase
          .from('routes')
          .select('*, risk_analyses(risk_score, created_at)')
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
                toast.error('Origen y destino deben ser distintos')
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
                          toast.success('Ruta actualizada')
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
                          toast.success('Ruta creada')
                          closeModal()
                          fetchRoutes()
                }
        }
        setSaving(false)
  }

  async function handleDelete(id) {
        if (!confirm('Eliminar esta ruta?')) return
        const { error } = await supabase.from('routes').delete().eq('id', id)
        if (error) {
                toast.error('Error eliminando ruta')
        } else {
                toast.success('Ruta eliminada')
                setRoutes(prev => prev.filter(r => r.id !== id))
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
                toast.success(`Analisis completado. Score de riesgo: ${result.risk_score}`)
                fetchRoutes()
                setExpandedId(route.id)
        } catch (err) {
                toast.error(err.message || 'Error analizando ruta')
        } finally {
                setAnalyzingId(null)
        }
  }

  if (loading) {
        return (
                <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
                </div>div>
              )
  }
  
    return (
          <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
                <div className="flex items-center justify-between mb-6">
                        <div>
                                  <h1 className="text-2xl font-bold text-white">Mis Rutas</h1>h1>
                                  <p className="text-slate-400 text-sm mt-1">
                                    {routes.length} {routes.length === 1 ? 'ruta registrada' : 'rutas registradas'}
                                  </p>p>
                        </div>div>
                        <button
                                    onClick={openCreate}
                                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium transition-colors"
                                  >
                                  <Plus className="w-4 h-4" />
                                  Nueva ruta
                        </button>button>
                </div>div>
          
            {/* Empty state */}
            {routes.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
                              <div className="w-16 h-16 bg-brand-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                          <Globe className="w-8 h-8 text-brand-400" />
                              </div>div>
                              <h3 className="text-lg font-semibold text-white mb-2">Sin rutas todavia</h3>h3>
                              <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                                          Agrega tu primera ruta de importacion para comenzar a monitorear el riesgo geopolitico.
                              </p>p>
                              <button
                                            onClick={openCreate}
                                            className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium transition-colors mx-auto"
                                          >
                                          <Plus className="w-4 h-4" />
                                          Crear primera ruta
                              </button>button>
                    </div>div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {routes.map(route => {
                                  const score = getLatestScore(route)
                                                const isAnalyzing = analyzingId === route.id
                                                              const isExpanded = expandedId === route.id
                                                                            return (
                                                                                            <div key={route.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors group">
                                                                                              {/* Card header */}
                                                                                                            <div className="flex items-start justify-between mb-4">
                                                                                                                              <div className="flex items-center gap-2">
                                                                                                                                                  <div className="w-8 h-8 bg-brand-600/20 rounded-lg flex items-center justify-center">
                                                                                                                                                                        <Globe className="w-4 h-4 text-brand-400" />
                                                                                                                                                    </div>div>
                                                                                                                                                  <div>
                                                                                                                                                                        <p className="text-white font-medium text-sm">
                                                                                                                                                                          {route.origin_country} → {route.destination_country}
                                                                                                                                                                          </p>p>
                                                                                                                                                                        <p className="text-slate-500 text-xs">{route.cargo_type}</p>p>
                                                                                                                                                    </div>div>
                                                                                                                                </div>div>
                                                                                                              {/* Risk badge */}
                                                                                                                              <div className={clsx('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white', riskBg(score))}>
                                                                                                                                                  <TrendingUp className="w-3 h-3" />
                                                                                                                                {score !== null ? score : '—'}
                                                                                                                                </div>div>
                                                                                                              </div>div>
                                                                                            
                                                                                              {/* Risk label */}
                                                                                                            <div className="mb-4">
                                                                                                                              <span className={clsx('text-sm font-medium', riskColor(score))}>
                                                                                                                                                  Riesgo: {riskLabel(score)}
                                                                                                                                </span>span>
                                                                                                              {route.description && (
                                                                                                                  <p className="text-slate-500 text-xs mt-1 line-clamp-2">{route.description}</p>p>
                                                                                                                              )}
                                                                                                              </div>div>
                                                                                            
                                                                                              {/* Analyze result expanded */}
                                                                                              {isExpanded && route.risk_analyses && route.risk_analyses.length > 0 && (
                                                                                                                <div className="mb-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
                                                                                                                                    <p className="text-xs text-slate-400">
                                                                                                                                                          Ultimo analisis: {new Date(route.risk_analyses[0].created_at).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                                                                                      </p>p>
                                                                                                                  </div>div>
                                                                                                            )}
                                                                                            
                                                                                              {/* Actions */}
                                                                                                            <div className="flex items-center gap-2">
                                                                                                              {/* Analyze button */}
                                                                                                                              <button
                                                                                                                                                    onClick={() => handleAnalyze(route)}
                                                                                                                                                    disabled={isAnalyzing}
                                                                                                                                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                                                                                                                                                  >
                                                                                                                                {isAnalyzing ? (
                                                                                                                                                                          <><Loader2 className="w-3.5 h-3.5 animate-spin" />Analizando...</>>
                                                                                                                                                                        ) : (
                                                                                                                                                                          <><Zap className="w-3.5 h-3.5" />Analizar</>>
                                                                                                                                                                        )}
                                                                                                                                </button>button>
                                                                                                            
                                                                                                              {/* Expand toggle */}
                                                                                                              {route.risk_analyses && route.risk_analyses.length > 0 && (
                                                                                                                  <button
                                                                                                                                          onClick={() => setExpandedId(isExpanded ? null : route.id)}
                                                                                                                                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                                                                                                                          title="Ver detalle"
                                                                                                                                        >
                                                                                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                                                                                    </button>button>
                                                                                                                              )}
                                                                                                            
                                                                                                              {/* Edit */}
                                                                                                                              <button
                                                                                                                                                    onClick={() => openEdit(route)}
                                                                                                                                                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                                                                                                                                    title="Editar"
                                                                                                                                                  >
                                                                                                                                                  <Edit2 className="w-4 h-4" />
                                                                                                                                </button>button>
                                                                                                            
                                                                                                              {/* Delete */}
                                                                                                                              <button
                                                                                                                                                    onClick={() => handleDelete(route.id)}
                                                                                                                                                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                                                                                                                                    title="Eliminar"
                                                                                                                                                  >
                                                                                                                                                  <Trash2 className="w-4 h-4" />
                                                                                                                                </button>button>
                                                                                                              </div>div>
                                                                                              </div>div>
                                                                                          )
                      })}
                    </div>div>
                )}
          
            {/* Modal */}
            {showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                              <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md">
                                          <div className="flex items-center justify-between p-6 border-b border-slate-800">
                                                        <h2 className="text-lg font-semibold text-white">
                                                          {editingRoute ? 'Editar ruta' : 'Nueva ruta'}
                                                        </h2>h2>
                                                        <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                                                                        <X className="w-5 h-5" />
                                                        </button>button>
                                          </div>div>
                                          <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                            {/* Origin */}
                                                        <div>
                                                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                                                                          <MapPin className="w-3.5 h-3.5 inline mr-1" />
                                                                                          Pais de Origen *
                                                                        </label>label>
                                                                        <select
                                                                                            value={form.origin_country}
                                                                                            onChange={e => setForm(f => ({ ...f, origin_country: e.target.value }))}
                                                                                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                                                                            required
                                                                                          >
                                                                                          <option value="">Seleccionar pais...</option>option>
                                                                          {COUNTRIES.map(c => (
                                                                                                                <option key={c} value={c}>{c}</option>option>
                                                                                                              ))}
                                                                        </select>select>
                                                        </div>div>
                                          
                                            {/* Destination */}
                                                        <div>
                                                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                                                                          <MapPin className="w-3.5 h-3.5 inline mr-1" />
                                                                                          Pais de Destino *
                                                                        </label>label>
                                                                        <select
                                                                                            value={form.destination_country}
                                                                                            onChange={e => setForm(f => ({ ...f, destination_country: e.target.value }))}
                                                                                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                                                                            required
                                                                                          >
                                                                                          <option value="">Seleccionar pais...</option>option>
                                                                          {COUNTRIES.map(c => (
                                                                                                                <option key={c} value={c}>{c}</option>option>
                                                                                                              ))}
                                                                        </select>select>
                                                        </div>div>
                                          
                                            {/* Cargo type */}
                                                        <div>
                                                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                                                                          <Package className="w-3.5 h-3.5 inline mr-1" />
                                                                                          Tipo de Carga *
                                                                        </label>label>
                                                                        <select
                                                                                            value={form.cargo_type}
                                                                                            onChange={e => setForm(f => ({ ...f, cargo_type: e.target.value }))}
                                                                                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                                                                            required
                                                                                          >
                                                                                          <option value="">Seleccionar tipo...</option>option>
                                                                          {CARGO_TYPES.map(c => (
                                                                                                                <option key={c} value={c}>{c}</option>option>
                                                                                                              ))}
                                                                        </select>select>
                                                        </div>div>
                                          
                                            {/* Description */}
                                                        <div>
                                                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                                                                          Descripcion (opcional)
                                                                        </label>label>
                                                                        <textarea
                                                                                            value={form.description}
                                                                                            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                                                                            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                                                                                            rows={3}
                                                                                            placeholder="Ej: Importacion mensual de componentes electronicos..."
                                                                                          />
                                                        </div>div>
                                          
                                            {/* Buttons */}
                                                        <div className="flex gap-3 pt-2">
                                                                        <button
                                                                                            type="button"
                                                                                            onClick={closeModal}
                                                                                            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium transition-colors"
                                                                                          >
                                                                                          Cancelar
                                                                        </button>button>
                                                                        <button
                                                                                            type="submit"
                                                                                            disabled={saving}
                                                                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                                                                                          >
                                                                          {saving ? (
                                                                                                                <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</>>
                                                                                                              ) : (
                                                                                                                editingRoute ? 'Actualizar' : 'Crear ruta'
                                                                                                              )}
                                                                        </button>button>
                                                        </div>div>
                                          </form>form>
                              </div>div>
                    </div>div>
                )}
          </div>div>
        )
}</></></></div>
