import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import {
  Bell, FileText, Settings, AlertTriangle, CheckCircle, Info, Globe, Clock,
  Zap, ChevronRight, Shield, TrendingUp, XCircle, ExternalLink, RefreshCw,
  Loader2, User, Mail, Building, Lock, Download, Package, BarChart3,
  MapPin, Briefcase, Hash, Phone, Flag, ChevronDown
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

// ─── Alerts Page ──────────────────────────────────────────────────────────────
export function AlertsPage() {
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => { if (user) fetchAlerts() }, [user])

  async function fetchAlerts() {
    setLoading(true)
    const { data } = await supabase
      .from('routes')
      .select(`
        id, origin_country, destination_country, cargo_type, name,
        risk_analyses(risk_score, risk_level, summary, factors, recommendations, created_at)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setRoutes(data || [])
    setLoading(false)
  }

  const getLatestAnalysis = (r) => r.risk_analyses?.[0] ?? null

  const alerts = routes.flatMap(route => {
    const analysis = getLatestAnalysis(route)
    if (!analysis) return []
    const generated = []
    const score = analysis.risk_score
    const routeLabel = route.origin_country + ' → ' + route.destination_country

    if (score >= 70) {
      generated.push({ id: route.id + '_critical', routeId: route.id, type: 'critical', icon: XCircle, title: 'Riesgo Crítico Detectado', message: routeLabel + ' — Score: ' + score + '/100. ' + (analysis.summary || ''), time: analysis.created_at, action: 'Ver ruta' })
    } else if (score >= 60) {
      generated.push({ id: route.id + '_high', routeId: route.id, type: 'warning', icon: AlertTriangle, title: 'Riesgo Elevado', message: routeLabel + ' — Score: ' + score + '/100. Requiere monitoreo activo.', time: analysis.created_at, action: 'Ver ruta' })
    } else if (score >= 40) {
      generated.push({ id: route.id + '_medium', routeId: route.id, type: 'info', icon: Info, title: 'Riesgo Moderado', message: routeLabel + ' — Score: ' + score + '/100. Considera las recomendaciones del análisis.', time: analysis.created_at, action: 'Ver detalles' })
    } else {
      generated.push({ id: route.id + '_low', routeId: route.id, type: 'ok', icon: CheckCircle, title: 'Riesgo Controlado', message: routeLabel + ' — Score: ' + score + '/100. Condiciones favorables en esta ruta.', time: analysis.created_at, action: null })
    }

    if (analysis.factors) {
      const highFactors = analysis.factors.filter(f => f.severity === 'high')
      highFactors.slice(0, 2).forEach((f, i) => {
        generated.push({ id: route.id + '_factor_' + i, routeId: route.id, type: 'warning', icon: AlertTriangle, title: 'Factor de Riesgo: ' + f.category, message: routeLabel + ' — ' + f.description, time: analysis.created_at, action: 'Ver análisis', isSubAlert: true })
      })
    }

    if (analysis.recommendations) {
      const immediateRecs = analysis.recommendations.filter(r => r.priority === 'immediate')
      immediateRecs.slice(0, 1).forEach((r, i) => {
        generated.push({ id: route.id + '_rec_' + i, routeId: route.id, type: 'action', icon: Zap, title: 'Acción Requerida', message: routeLabel + ' — ' + r.action, time: analysis.created_at, action: 'Ver ruta', isSubAlert: true })
      })
    }

    return generated
  })

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
    critical: { border: 'border-red-500/40 bg-red-500/5', icon: 'text-red-400', badge: 'bg-red-500/20 text-red-400 border border-red-500/30', label: 'CRÍTICO' },
    warning: { border: 'border-amber-500/40 bg-amber-500/5', icon: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30', label: 'AVISO' },
    action: { border: 'border-brand-500/40 bg-brand-500/5', icon: 'text-brand-400', badge: 'bg-brand-500/20 text-brand-400 border border-brand-500/30', label: 'ACCIÓN' },
    info: { border: 'border-slate-700 bg-slate-900', icon: 'text-blue-400', badge: 'bg-blue-500/20 text-blue-400 border border-blue-500/30', label: 'INFO' },
    ok: { border: 'border-slate-800', icon: 'text-emerald-400', badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', label: 'OK' },
  }

  const formatTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (days > 0) return days === 1 ? 'Hace 1 día' : 'Hace ' + days + ' días'
    if (hours > 0) return 'Hace ' + hours + 'h'
    return 'Hace unos minutos'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Centro de Alertas</h1>
          <p className="text-slate-400 text-sm mt-1">Alertas generadas automáticamente por IA basadas en tus rutas analizadas</p>
        </div>
        <button onClick={fetchAlerts} disabled={loading} className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors disabled:opacity-50">
          <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
          Actualizar
        </button>
      </div>

      {!loading && alerts.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="card p-4 border-red-500/20"><div className="flex items-center justify-between"><div><p className="text-slate-400 text-xs uppercase tracking-wider">Críticas</p><p className="text-3xl font-bold text-red-400 mt-1">{criticalCount}</p></div><XCircle className="w-8 h-8 text-red-500/40" /></div></div>
          <div className="card p-4 border-amber-500/20"><div className="flex items-center justify-between"><div><p className="text-slate-400 text-xs uppercase tracking-wider">Avisos</p><p className="text-3xl font-bold text-amber-400 mt-1">{warningCount}</p></div><AlertTriangle className="w-8 h-8 text-amber-500/40" /></div></div>
          <div className="card p-4 border-emerald-500/20"><div className="flex items-center justify-between"><div><p className="text-slate-400 text-xs uppercase tracking-wider">En orden</p><p className="text-3xl font-bold text-emerald-400 mt-1">{alerts.filter(a => a.type === 'ok').length}</p></div><CheckCircle className="w-8 h-8 text-emerald-500/40" /></div></div>
        </div>
      )}

      {alerts.length > 0 && (
        <div className="flex items-center gap-1 mb-4 bg-slate-900 border border-slate-800 rounded-lg p-1 w-fit">
          {[{ key: 'all', label: 'Todas' }, { key: 'critical', label: 'Críticas' }, { key: 'warning', label: 'Avisos' }, { key: 'ok', label: 'En orden' }].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)} className={clsx('px-3 py-1.5 rounded-md text-sm font-medium transition-all', filter === tab.key ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-300')}>
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-8 h-8 text-brand-500 animate-spin" /></div>
      ) : alerts.length === 0 && unanalyzedRoutes.length === 0 && routes.length === 0 ? (
        <div className="card p-16 text-center">
          <Bell className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Sin alertas aún</h3>
          <p className="text-slate-400 text-sm mb-6">Crea y analiza tus rutas de importación para generar alertas automáticas.</p>
          <button onClick={() => navigate('/routes')} className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors">Ir a Rutas <ChevronRight className="w-4 h-4" /></button>
        </div>
      ) : (
        <div className="space-y-3">
          {unanalyzedRoutes.length > 0 && (filter === 'all' || filter === 'warning') && (
            <div onClick={() => navigate('/routes')} className="card border-brand-500/30 bg-brand-500/5 p-4 flex items-center gap-4 cursor-pointer hover:bg-brand-500/10 transition-colors">
              <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center flex-shrink-0"><Zap className="w-4 h-4 text-brand-400" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-brand-400 font-semibold text-sm">{unanalyzedRoutes.length} ruta{unanalyzedRoutes.length > 1 ? 's' : ''} sin analizar</p>
                <p className="text-slate-400 text-xs mt-0.5">{unanalyzedRoutes.map(r => r.origin_country + ' → ' + r.destination_country).join(', ')} — Analiza para obtener alertas de riesgo</p>
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
                    <span className="text-slate-600 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(alert.time)}</span>
                    {alert.action && (<button onClick={() => navigate('/routes')} className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1 transition-colors">{alert.action} <ChevronRight className="w-3 h-3" /></button>)}
                  </div>
                </div>
              </div>
            )
          })}
          {filteredAlerts.length === 0 && (
            <div className="card p-10 text-center"><CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-3" /><p className="text-slate-400 text-sm">No hay alertas en esta categoría.</p></div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Reports Page ─────────────────────────────────────────────────────────────
export function ReportsPage() {
  const { user, profile } = useAuthStore()
  const navigate = useNavigate()
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [generatingPdf, setGeneratingPdf] = useState(null)

  useEffect(() => {
    if (user) {
      supabase
        .from('routes')
        .select(`
          *, risk_analyses(
            id, risk_score, risk_level, summary, factors,
            recommendations, trade_data, created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          const processed = (data || []).map(r => ({
            ...r,
            risk_analyses: (r.risk_analyses || []).sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at)
            )
          }))
          setRoutes(processed)
          setLoading(false)
        })
    }
  }, [user])

  const analyzedRoutes = routes.filter(r => r.risk_analyses?.length > 0)
  const highRisk = analyzedRoutes.filter(r => r.risk_analyses[0].risk_score >= 70).length
  const mediumRisk = analyzedRoutes.filter(r => r.risk_analyses[0].risk_score >= 40 && r.risk_analyses[0].risk_score < 70).length
  const lowRisk = analyzedRoutes.filter(r => r.risk_analyses[0].risk_score < 40).length
  const avgScore = analyzedRoutes.length > 0
    ? Math.round(analyzedRoutes.reduce((acc, r) => acc + r.risk_analyses[0].risk_score, 0) / analyzedRoutes.length)
    : null

  function riskColor(score) {
    if (score >= 70) return '#f87171'
    if (score >= 40) return '#fbbf24'
    return '#34d399'
  }

  function riskLabel(score) {
    if (score >= 70) return 'ALTO RIESGO'
    if (score >= 40) return 'RIESGO MEDIO'
    return 'BAJO RIESGO'
  }

  async function generatePDF(route) {
    const analysis = route.risk_analyses[0]
    if (!analysis) {
      toast.error('Esta ruta no tiene análisis. Genera uno primero.')
      return
    }
    setGeneratingPdf(route.id)

    try {
      // Dynamic import of jsPDF
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

      const pageW = 210
      const pageH = 297
      const margin = 18
      const contentW = pageW - margin * 2
      let y = 0

      // ── Helper functions ──
      const addPage = () => {
        doc.addPage()
        y = margin
        // Footer on new page
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text('GeoPulse · Plataforma de Inteligencia Geopolítica para Comercio Exterior', margin, pageH - 8)
        doc.text('Confidencial — Uso Interno', pageW - margin, pageH - 8, { align: 'right' })
        y = margin
      }

      const checkPageBreak = (neededHeight) => {
        if (y + neededHeight > pageH - 20) addPage()
      }

      const hexToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16)
        const g = parseInt(hex.slice(3, 5), 16)
        const b = parseInt(hex.slice(5, 7), 16)
        return [r, g, b]
      }

      // ── Page 1: Cover ──
      // Dark header band
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, pageW, 70, 'F')

      // Accent line
      doc.setFillColor(99, 102, 241)
      doc.rect(0, 68, pageW, 2, 'F')

      // Logo text
      doc.setFontSize(28)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.text('GeoPulse', margin, 28)

      doc.setFontSize(10)
      doc.setTextColor(148, 163, 184)
      doc.setFont('helvetica', 'normal')
      doc.text('Plataforma de Inteligencia Geopolítica', margin, 36)

      // Report title
      doc.setFontSize(11)
      doc.setTextColor(99, 102, 241)
      doc.text('REPORTE EJECUTIVO DE RIESGO', margin, 52)
      doc.setFontSize(9)
      doc.setTextColor(148, 163, 184)
      doc.text('Análisis de Ruta Comercial · IA Claude', margin, 59)

      // Date top right
      doc.setFontSize(9)
      doc.setTextColor(148, 163, 184)
      const now = new Date()
      const dateStr = now.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
      doc.text(dateStr, pageW - margin, 28, { align: 'right' })
      doc.text('Generado: ' + now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }), pageW - margin, 36, { align: 'right' })

      y = 82

      // Risk score hero box
      const scoreColor = hexToRgb(riskColor(analysis.risk_score))
      doc.setFillColor(...scoreColor.map(v => Math.min(255, v + 40)))
      doc.setDrawColor(...scoreColor)
      doc.setLineWidth(0.5)
      doc.roundedRect(margin, y, contentW, 38, 3, 3, 'FD')

      doc.setFontSize(42)
      doc.setTextColor(...scoreColor)
      doc.setFont('helvetica', 'bold')
      doc.text(String(analysis.risk_score), margin + 12, y + 26)

      doc.setFontSize(11)
      doc.setTextColor(30, 41, 59)
      doc.text('/100', margin + 36, y + 26)

      doc.setFontSize(14)
      doc.setTextColor(30, 41, 59)
      doc.setFont('helvetica', 'bold')
      doc.text(riskLabel(analysis.risk_score), margin + 56, y + 18)

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(71, 85, 105)
      doc.text('Score de riesgo geopolítico generado por Claude AI', margin + 56, y + 26)

      const analysisDate = new Date(analysis.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
      doc.text('Fecha del análisis: ' + analysisDate, margin + 56, y + 33)

      y += 48

      // Route info card
      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.3)
      doc.roundedRect(margin, y, contentW, 42, 2, 2, 'FD')

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(71, 85, 105)
      doc.text('RUTA COMERCIAL', margin + 4, y + 8)

      doc.setFontSize(14)
      doc.setTextColor(15, 23, 42)
      const routeName = route.name || (route.origin_country + ' → ' + route.destination_country)
      doc.text(routeName, margin + 4, y + 17)

      // Route details grid
      const details = [
        ['Origen', route.origin_country + (route.port_of_origin ? ' (' + route.port_of_origin + ')' : '')],
        ['Destino', route.destination_country + (route.port_of_destination ? ' (' + route.port_of_destination + ')' : '')],
        ['Tipo de carga', route.cargo_type || '—'],
        ['Incoterm', route.incoterm || '—'],
        ['Transporte', route.transport_mode || '—'],
        ['Empresa', profile?.company_name || '—'],
      ]

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      details.forEach((detail, i) => {
        const col = i % 3
        const row = Math.floor(i / 3)
        const cx = margin + 4 + col * (contentW / 3)
        const cy = y + 26 + row * 10
        doc.setTextColor(100, 116, 139)
        doc.text(detail[0].toUpperCase() + ': ', cx, cy)
        doc.setTextColor(15, 23, 42)
        doc.setFont('helvetica', 'bold')
        const labelW = doc.getTextWidth(detail[0].toUpperCase() + ': ')
        doc.text(detail[1], cx + labelW, cy)
        doc.setFont('helvetica', 'normal')
      })

      y += 52

      // Executive Summary
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text('RESUMEN EJECUTIVO', margin, y)
      doc.setDrawColor(99, 102, 241)
      doc.setLineWidth(0.8)
      doc.line(margin, y + 2, margin + 55, y + 2)
      y += 8

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(51, 65, 85)
      const summaryLines = doc.splitTextToSize(analysis.summary || 'Sin resumen disponible.', contentW)
      summaryLines.forEach(line => {
        checkPageBreak(6)
        doc.text(line, margin, y)
        y += 5.5
      })

      y += 6

      // ── Risk Factors ──
      if (analysis.factors && analysis.factors.length > 0) {
        checkPageBreak(20)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(15, 23, 42)
        doc.text('FACTORES DE RIESGO', margin, y)
        doc.setDrawColor(239, 68, 68)
        doc.setLineWidth(0.8)
        doc.line(margin, y + 2, margin + 54, y + 2)
        y += 10

        analysis.factors.forEach((factor, idx) => {
          const factorHeight = 22 + (doc.splitTextToSize(factor.description || factor.impact || '', contentW - 28).length * 5)
          checkPageBreak(factorHeight)

          const severityColors = {
            high: [239, 68, 68],
            critical: [239, 68, 68],
            medium: [245, 158, 11],
            low: [52, 211, 153],
          }
          const sColor = severityColors[factor.severity] || [148, 163, 184]

          // Factor card bg
          doc.setFillColor(248, 250, 252)
          doc.setDrawColor(...sColor)
          doc.setLineWidth(0.3)
          const descLines = doc.splitTextToSize(factor.description || factor.impact || '—', contentW - 28)
          const cardH = 14 + descLines.length * 5
          doc.roundedRect(margin, y, contentW, cardH, 2, 2, 'FD')

          // Severity badge
          doc.setFillColor(...sColor)
          doc.roundedRect(margin + 2, y + 3, 18, 6, 1, 1, 'F')
          doc.setFontSize(6.5)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(255, 255, 255)
          doc.text((factor.severity || 'low').toUpperCase(), margin + 11, y + 7.5, { align: 'center' })

          // Category and description
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(15, 23, 42)
          doc.text(factor.category || ('Factor ' + (idx + 1)), margin + 24, y + 8)

          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(71, 85, 105)
          descLines.forEach((line, li) => {
            doc.text(line, margin + 24, y + 14 + li * 5)
          })

          y += cardH + 3
        })

        y += 4
      }

      // ── Recommendations ──
      if (analysis.recommendations && analysis.recommendations.length > 0) {
        checkPageBreak(20)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(15, 23, 42)
        doc.text('RECOMENDACIONES OPERATIVAS', margin, y)
        doc.setDrawColor(52, 211, 153)
        doc.setLineWidth(0.8)
        doc.line(margin, y + 2, margin + 78, y + 2)
        y += 10

        const priorityConfig = {
          immediate: { label: 'INMEDIATA', color: [239, 68, 68] },
          short_term: { label: 'CORTO PLAZO', color: [245, 158, 11] },
          long_term: { label: 'LARGO PLAZO', color: [99, 102, 241] },
        }

        analysis.recommendations.forEach((rec, idx) => {
          const recText = typeof rec === 'string' ? rec : (rec.action || rec.text || JSON.stringify(rec))
          const recLines = doc.splitTextToSize(recText, contentW - 28)
          const cardH = 14 + recLines.length * 5
          checkPageBreak(cardH + 3)

          const pCfg = priorityConfig[rec.priority] || { label: 'GENERAL', color: [148, 163, 184] }

          doc.setFillColor(248, 250, 252)
          doc.setDrawColor(...pCfg.color)
          doc.setLineWidth(0.3)
          doc.roundedRect(margin, y, contentW, cardH, 2, 2, 'FD')

          // Number circle
          doc.setFillColor(99, 102, 241)
          doc.circle(margin + 6, y + cardH / 2, 4, 'F')
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(255, 255, 255)
          doc.text(String(idx + 1), margin + 6, y + cardH / 2 + 1, { align: 'center' })

          // Priority badge
          doc.setFillColor(...pCfg.color)
          doc.roundedRect(margin + 14, y + 3, 26, 5.5, 1, 1, 'F')
          doc.setFontSize(6)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(255, 255, 255)
          doc.text(pCfg.label, margin + 27, y + 7, { align: 'center' })

          doc.setFontSize(8.5)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(30, 41, 59)
          recLines.forEach((line, li) => {
            doc.text(line, margin + 14, y + 12 + li * 5)
          })

          y += cardH + 3
        })

        y += 4
      }

      // ── Trade Data ──
      if (analysis.trade_data) {
        checkPageBreak(30)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(15, 23, 42)
        doc.text('DATOS COMERCIALES DE LA RUTA', margin, y)
        doc.setDrawColor(99, 102, 241)
        doc.setLineWidth(0.8)
        doc.line(margin, y + 2, margin + 86, y + 2)
        y += 10

        const tdEntries = Object.entries(analysis.trade_data)
        const colW = contentW / 2
        tdEntries.forEach((entry, i) => {
          if (i % 2 === 0) {
            checkPageBreak(14)
            if (i !== 0) y += 0
          }
          const col = i % 2
          const cx = margin + col * colW
          if (col === 0) {
            doc.setFillColor(248, 250, 252)
            doc.setDrawColor(226, 232, 240)
            doc.setLineWidth(0.3)
            doc.roundedRect(margin, y, contentW, 13, 1.5, 1.5, 'FD')
          }

          const label = String(entry[0]).replace(/_/g, ' ').toUpperCase()
          const value = Array.isArray(entry[1]) ? entry[1].join(', ') : String(entry[1])

          doc.setFontSize(7)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(100, 116, 139)
          doc.text(label, cx + 4, y + 5.5)

          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(15, 23, 42)
          const truncated = value.length > 35 ? value.slice(0, 32) + '...' : value
          doc.text(truncated, cx + 4, y + 11)

          if (col === 1 || i === tdEntries.length - 1) y += 16
        })

        y += 4
      }

      // ── Footer on last page ──
      doc.setFontSize(8)
      doc.setTextColor(100, 116, 139)
      doc.setFont('helvetica', 'normal')
      doc.text('GeoPulse · Plataforma de Inteligencia Geopolítica para Comercio Exterior', margin, pageH - 8)
      doc.text('Confidencial — Uso Interno', pageW - margin, pageH - 8, { align: 'right' })

      // Disclaimer box at bottom
      if (y < pageH - 40) {
        doc.setFillColor(241, 245, 249)
        doc.setDrawColor(203, 213, 225)
        doc.setLineWidth(0.3)
        doc.roundedRect(margin, pageH - 32, contentW, 20, 2, 2, 'FD')
        doc.setFontSize(7)
        doc.setTextColor(100, 116, 139)
        const disclaimer = 'Este reporte fue generado automáticamente por la IA Claude (Anthropic) integrada en GeoPulse. El análisis es de carácter orientativo y no constituye asesoría legal ni financiera. Valide la información con sus asesores de comercio exterior antes de tomar decisiones operativas.'
        const dLines = doc.splitTextToSize(disclaimer, contentW - 8)
        dLines.forEach((line, i) => {
          doc.text(line, margin + 4, pageH - 26 + i * 4.5)
        })
      }

      const fileName = `GeoPulse_Riesgo_${route.origin_country.replace(/\s/g, '')}_${route.destination_country.replace(/\s/g, '')}_${now.toISOString().slice(0, 10)}.pdf`
      doc.save(fileName)
      toast.success('PDF generado: ' + fileName)
    } catch (err) {
      console.error('PDF error:', err)
      toast.error('Error generando PDF: ' + err.message)
    } finally {
      setGeneratingPdf(null)
    }
  }

  async function generatePortfolioPDF() {
    if (analyzedRoutes.length === 0) {
      toast.error('No hay rutas analizadas para exportar.')
      return
    }
    setGeneratingPdf('portfolio')
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = 210, pageH = 297, margin = 18, contentW = 210 - 36
      let y = 0

      const addFooter = () => {
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.text('GeoPulse · Reporte de Portafolio', margin, pageH - 8)
        doc.text('Confidencial', pageW - margin, pageH - 8, { align: 'right' })
      }

      // Cover
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, pageW, 60, 'F')
      doc.setFillColor(99, 102, 241)
      doc.rect(0, 58, pageW, 2, 'F')

      doc.setFontSize(26)
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.text('GeoPulse', margin, 24)
      doc.setFontSize(10)
      doc.setTextColor(99, 102, 241)
      doc.text('REPORTE DE PORTAFOLIO COMERCIAL', margin, 34)
      doc.setFontSize(8.5)
      doc.setTextColor(148, 163, 184)
      doc.setFont('helvetica', 'normal')
      const now = new Date()
      doc.text(now.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }), margin, 44)
      doc.text(profile?.company_name || 'Empresa', pageW - margin, 24, { align: 'right' })

      y = 72

      // KPI cards
      const kpis = [
        { label: 'Rutas Totales', value: String(routes.length), color: [99, 102, 241] },
        { label: 'Analizadas', value: String(analyzedRoutes.length), color: [52, 211, 153] },
        { label: 'Score Promedio', value: avgScore !== null ? String(avgScore) : '—', color: avgScore >= 70 ? [239, 68, 68] : avgScore >= 40 ? [245, 158, 11] : [52, 211, 153] },
        { label: 'Alto Riesgo', value: String(highRisk), color: highRisk > 0 ? [239, 68, 68] : [52, 211, 153] },
      ]

      const kpiW = contentW / 4
      kpis.forEach((kpi, i) => {
        const cx = margin + i * kpiW
        doc.setFillColor(248, 250, 252)
        doc.setDrawColor(...kpi.color)
        doc.setLineWidth(0.5)
        doc.roundedRect(cx, y, kpiW - 3, 22, 2, 2, 'FD')
        doc.setFontSize(18)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...kpi.color)
        doc.text(kpi.value, cx + (kpiW - 3) / 2, y + 13, { align: 'center' })
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 116, 139)
        doc.text(kpi.label.toUpperCase(), cx + (kpiW - 3) / 2, y + 19.5, { align: 'center' })
      })

      y += 30

      // Route list
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(15, 23, 42)
      doc.text('DETALLE DE RUTAS ANALIZADAS', margin, y)
      doc.setDrawColor(99, 102, 241)
      doc.setLineWidth(0.8)
      doc.line(margin, y + 2, margin + 82, y + 2)
      y += 10

      analyzedRoutes.forEach((route, idx) => {
        if (y > pageH - 35) {
          addFooter()
          doc.addPage()
          y = margin
        }

        const analysis = route.risk_analyses[0]
        const score = analysis.risk_score
        const scoreColor = score >= 70 ? [239, 68, 68] : score >= 40 ? [245, 158, 11] : [52, 211, 153]

        doc.setFillColor(248, 250, 252)
        doc.setDrawColor(...scoreColor)
        doc.setLineWidth(0.4)
        doc.roundedRect(margin, y, contentW, 26, 2, 2, 'FD')

        // Score
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...scoreColor)
        doc.text(String(score), margin + 8, y + 15, { align: 'center' })
        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 116, 139)
        doc.text('/100', margin + 8, y + 21, { align: 'center' })

        // Route name
        doc.setFontSize(9.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(15, 23, 42)
        const name = route.name || (route.origin_country + ' → ' + route.destination_country)
        doc.text(name, margin + 20, y + 9)

        // Details
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(71, 85, 105)
        doc.text(route.origin_country + ' → ' + route.destination_country, margin + 20, y + 15)
        doc.text(route.cargo_type || '—', margin + 20, y + 21)

        // Incoterm badge
        if (route.incoterm) {
          doc.setFillColor(99, 102, 241)
          doc.roundedRect(margin + contentW - 22, y + 5, 18, 7, 1, 1, 'F')
          doc.setFontSize(7)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(255, 255, 255)
          doc.text(route.incoterm, margin + contentW - 13, y + 10, { align: 'center' })
        }

        // Summary preview
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 116, 139)
        const summaryTrunc = (analysis.summary || '').slice(0, 90) + ((analysis.summary || '').length > 90 ? '...' : '')
        doc.text(summaryTrunc, margin + 20, y + 22.5)

        y += 29
      })

      addFooter()

      const fileName = `GeoPulse_Portafolio_${now.toISOString().slice(0, 10)}.pdf`
      doc.save(fileName)
      toast.success('Portafolio PDF generado: ' + fileName)
    } catch (err) {
      console.error('PDF error:', err)
      toast.error('Error generando PDF: ' + err.message)
    } finally {
      setGeneratingPdf(null)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reportes Ejecutivos</h1>
          <p className="text-slate-400 text-sm mt-1">Exporta reportes PDF profesionales para tu equipo de comercio exterior</p>
        </div>
        {analyzedRoutes.length > 0 && (
          <button
            onClick={generatePortfolioPDF}
            disabled={generatingPdf === 'portfolio'}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
          >
            {generatingPdf === 'portfolio' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {generatingPdf === 'portfolio' ? 'Generando...' : 'Exportar Portafolio PDF'}
          </button>
        )}
      </div>

      {/* Stats overview */}
      {!loading && analyzedRoutes.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Rutas Totales', value: routes.length, color: 'text-white' },
            { label: 'Analizadas', value: analyzedRoutes.length, color: 'text-brand-400' },
            { label: 'Score Promedio', value: avgScore, color: avgScore >= 70 ? 'text-red-400' : avgScore >= 40 ? 'text-amber-400' : 'text-emerald-400' },
            { label: 'Alto Riesgo', value: highRisk, color: highRisk > 0 ? 'text-red-400' : 'text-emerald-400' },
          ].map((kpi, i) => (
            <div key={i} className="card p-4 text-center">
              <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{kpi.label}</p>
              <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value ?? '—'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Route list with individual PDF buttons */}
      {!loading && analyzedRoutes.length > 0 ? (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-400" />
              Reportes por Ruta
            </h2>
            <span className="text-xs text-slate-500">{analyzedRoutes.length} ruta{analyzedRoutes.length !== 1 ? 's' : ''} con análisis</span>
          </div>
          <div className="space-y-2">
            {analyzedRoutes.map(route => {
              const analysis = route.risk_analyses[0]
              const score = analysis.risk_score
              const isGen = generatingPdf === route.id
              return (
                <div key={route.id} className="flex items-center justify-between p-3.5 bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700/50">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${score >= 70 ? 'bg-red-900/40 border-red-700/40' : score >= 40 ? 'bg-amber-900/40 border-amber-700/40' : 'bg-emerald-900/40 border-emerald-700/40'}`}>
                      <span className={`text-sm font-bold ${score >= 70 ? 'text-red-400' : score >= 40 ? 'text-amber-400' : 'text-emerald-400'}`}>{score}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{route.name || (route.origin_country + ' → ' + route.destination_country)}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-slate-500 text-xs">{route.origin_country} → {route.destination_country}</span>
                        {route.cargo_type && <span className="text-slate-600 text-xs">· {route.cargo_type}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-500">{new Date(analysis.created_at).toLocaleDateString('es')}</span>
                    <button
                      onClick={() => generatePDF(route)}
                      disabled={isGen || generatingPdf === 'portfolio'}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600/20 hover:bg-brand-600/40 text-brand-400 border border-brand-700/40 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {isGen ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      {isGen ? 'Generando...' : 'PDF'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : !loading ? (
        <div className="card p-12 text-center">
          <BarChart3 className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Sin análisis disponibles</h3>
          <p className="text-slate-400 text-sm mb-6">Genera análisis de IA en tus rutas para habilitar la exportación de reportes PDF ejecutivos.</p>
          <button onClick={() => navigate('/routes')} className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors">
            Ir a Rutas <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
      )}
    </div>
  )
}

// ─── Settings Page ────────────────────────────────────────────────────────────
const COMPANY_TYPES = ['Importador', 'Exportador', 'Agente Aduanal', 'Operador Logístico', 'Manufacturero', 'Distribuidor', 'Bróker', 'Otro']
const INDUSTRIES = ['Electrónica y Tecnología', 'Textil y Confección', 'Alimentos y Bebidas', 'Automotriz', 'Químico y Farmacéutico', 'Maquinaria Industrial', 'Construcción', 'Energía', 'Retail y Consumo', 'Otro']
const CARGO_TYPES_OPTIONS = ['Componentes electrónicos', 'Textil y confección', 'Alimentos y perecederos', 'Maquinaria y equipos', 'Químicos y farmacéuticos', 'Automotriz y autopartes', 'Materias primas', 'Productos terminados', 'Energía y combustibles', 'Otro']
const INCOTERMS_OPTIONS = ['FOB', 'CIF', 'EXW', 'DAP', 'DDP', 'CFR', 'FCA', 'CPT', 'CIP']
const VOLUMES = ['< $500K USD/año', '$500K - $2M USD/año', '$2M - $10M USD/año', '$10M - $50M USD/año', '> $50M USD/año']
const COMPANY_SIZES = ['1-10 empleados', '11-50 empleados', '51-200 empleados', '201-500 empleados', '500+ empleados']
const ROLES = ['Director General', 'Director de Operaciones', 'Gerente de Compras', 'Gerente de Logística', 'Agente Aduanal', 'Analista de Comercio Exterior', 'Consultor', 'Otro']

function MultiSelect({ options, selected, onChange, placeholder }) {
  const [open, setOpen] = useState(false)
  const selectedArr = Array.isArray(selected) ? selected : []
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full bg-slate-800 border border-slate-700 text-left text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 flex items-center justify-between"
      >
        <span className={selectedArr.length > 0 ? 'text-white' : 'text-slate-500'}>
          {selectedArr.length > 0 ? selectedArr.slice(0, 2).join(', ') + (selectedArr.length > 2 ? ' +' + (selectedArr.length - 2) : '') : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-52 overflow-y-auto">
          {options.map(opt => (
            <label key={opt} className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-700 cursor-pointer text-sm text-slate-300">
              <input
                type="checkbox"
                checked={selectedArr.includes(opt)}
                onChange={() => {
                  const next = selectedArr.includes(opt)
                    ? selectedArr.filter(v => v !== opt)
                    : [...selectedArr, opt]
                  onChange(next)
                }}
                className="rounded border-slate-600 bg-slate-700 text-brand-500"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export function SettingsPage() {
  const { user, profile, updateProfile, signOut } = useAuthStore()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('profile')

  const [form, setForm] = useState({
    full_name: '',
    company_name: '',
    company_type: '',
    industry: '',
    company_size: '',
    annual_import_volume: '',
    tax_id: '',
    country: '',
    city: '',
    phone: '',
    role: '',
    cargo_types: [],
    main_incoterms: [],
  })

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || '',
        company_name: profile.company_name || '',
        company_type: profile.company_type || '',
        industry: profile.industry || '',
        company_size: profile.company_size || '',
        annual_import_volume: profile.annual_import_volume || '',
        tax_id: profile.tax_id || '',
        country: profile.country || '',
        city: profile.city || '',
        phone: profile.phone || '',
        role: profile.role || '',
        cargo_types: Array.isArray(profile.cargo_types) ? profile.cargo_types : [],
        main_incoterms: Array.isArray(profile.main_incoterms) ? profile.main_incoterms : [],
      })
    }
  }, [profile])

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const { error } = await updateProfile(form)
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

  const inputCls = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:text-slate-500"
  const labelCls = "block text-sm font-medium text-slate-300 mb-1.5"
  const selectCls = "w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"

  const sections = [
    { key: 'profile', label: 'Perfil Personal', icon: User },
    { key: 'company', label: 'Empresa', icon: Building },
    { key: 'trade', label: 'Operaciones', icon: Package },
    { key: 'account', label: 'Cuenta', icon: Shield },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-slate-400 text-sm mt-1">Administra tu perfil, empresa y preferencias de operación</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {sections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={clsx(
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                activeSection === key
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-700/30'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSave}>

            {/* ── Perfil Personal ── */}
            {activeSection === 'profile' && (
              <div className="card p-5 space-y-4">
                <h2 className="text-white font-semibold flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-brand-400" />
                  Perfil Personal
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Nombre completo</label>
                    <input className={inputCls} placeholder="Tu nombre completo" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Cargo / Rol</label>
                    <select className={selectCls} value={form.role} onChange={e => set('role', e.target.value)}>
                      <option value="">Seleccionar cargo</option>
                      {ROLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls + ' flex items-center gap-1.5'}>
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      Teléfono
                    </label>
                    <input className={inputCls} placeholder="+52 55 1234 5678" value={form.phone} onChange={e => set('phone', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls + ' flex items-center gap-1.5'}>
                      <Flag className="w-3.5 h-3.5 text-slate-500" />
                      País
                    </label>
                    <input className={inputCls} placeholder="México" value={form.country} onChange={e => set('country', e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className={labelCls + ' flex items-center gap-1.5'}>
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    Ciudad
                  </label>
                  <input className={inputCls} placeholder="Ciudad de México" value={form.city} onChange={e => set('city', e.target.value)} />
                </div>

                <div>
                  <label className={labelCls + ' flex items-center gap-1.5'}>
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    Email
                  </label>
                  <input type="email" value={user?.email || ''} disabled className="w-full bg-slate-800/50 border border-slate-800 text-slate-500 rounded-lg px-3 py-2.5 text-sm cursor-not-allowed" />
                  <p className="text-slate-600 text-xs mt-1">El email no se puede modificar</p>
                </div>

                <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Guardando...</span></> : 'Guardar cambios'}
                </button>
              </div>
            )}

            {/* ── Empresa ── */}
            {activeSection === 'company' && (
              <div className="card p-5 space-y-4">
                <h2 className="text-white font-semibold flex items-center gap-2 mb-1">
                  <Building className="w-4 h-4 text-brand-400" />
                  Datos de Empresa
                </h2>

                <div>
                  <label className={labelCls}>Razón Social / Nombre de empresa</label>
                  <input className={inputCls} placeholder="Tu empresa importadora" value={form.company_name} onChange={e => set('company_name', e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Tipo de empresa</label>
                    <select className={selectCls} value={form.company_type} onChange={e => set('company_type', e.target.value)}>
                      <option value="">Seleccionar tipo</option>
                      {COMPANY_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Industria / Sector</label>
                    <select className={selectCls} value={form.industry} onChange={e => set('industry', e.target.value)}>
                      <option value="">Seleccionar industria</option>
                      {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls + ' flex items-center gap-1.5'}>
                      <Hash className="w-3.5 h-3.5 text-slate-500" />
                      RFC / Tax ID
                    </label>
                    <input className={inputCls} placeholder="XAXX010101000" value={form.tax_id} onChange={e => set('tax_id', e.target.value)} />
                  </div>
                  <div>
                    <label className={labelCls}>Tamaño de empresa</label>
                    <select className={selectCls} value={form.company_size} onChange={e => set('company_size', e.target.value)}>
                      <option value="">Seleccionar tamaño</option>
                      {COMPANY_SIZES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Guardando...</span></> : 'Guardar cambios'}
                </button>
              </div>
            )}

            {/* ── Operaciones ── */}
            {activeSection === 'trade' && (
              <div className="card p-5 space-y-4">
                <h2 className="text-white font-semibold flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-brand-400" />
                  Operaciones de Comercio Exterior
                </h2>

                <div>
                  <label className={labelCls}>Tipos de mercancía que operas</label>
                  <MultiSelect
                    options={CARGO_TYPES_OPTIONS}
                    selected={form.cargo_types}
                    onChange={val => set('cargo_types', val)}
                    placeholder="Seleccionar tipos de carga..."
                  />
                  {form.cargo_types.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.cargo_types.map(c => (
                        <span key={c} className="text-xs bg-brand-600/20 text-brand-400 border border-brand-700/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          {c}
                          <button type="button" onClick={() => set('cargo_types', form.cargo_types.filter(v => v !== c))} className="hover:text-brand-200">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelCls}>Incoterms principales que utilizas</label>
                  <MultiSelect
                    options={INCOTERMS_OPTIONS}
                    selected={form.main_incoterms}
                    onChange={val => set('main_incoterms', val)}
                    placeholder="Seleccionar incoterms..."
                  />
                  {form.main_incoterms.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.main_incoterms.map(t => (
                        <span key={t} className="text-xs bg-slate-700 text-slate-300 border border-slate-600 px-2.5 py-0.5 rounded font-mono flex items-center gap-1">
                          {t}
                          <button type="button" onClick={() => set('main_incoterms', form.main_incoterms.filter(v => v !== t))} className="hover:text-red-400">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelCls + ' flex items-center gap-1.5'}>
                    <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                    Volumen anual de importación
                  </label>
                  <select className={selectCls} value={form.annual_import_volume} onChange={e => set('annual_import_volume', e.target.value)}>
                    <option value="">Seleccionar rango</option>
                    {VOLUMES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </div>

                <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Guardando...</span></> : 'Guardar cambios'}
                </button>
              </div>
            )}

            {/* ── Cuenta ── */}
            {activeSection === 'account' && (
              <div className="space-y-4">

                {/* ── Información de Cuenta ── */}
                <div className="card p-5">
                  <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-brand-400" />
                    Información de Cuenta
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <div>
                        <p className="text-slate-300 text-sm font-medium">Plan actual</p>
                        <p className="text-slate-500 text-xs">
                          {profile?.plan === 'pro' ? 'Análisis ilimitados, PDF, alertas avanzadas' :
                           profile?.plan === 'business' ? 'Todo Pro + equipo, API y soporte dedicado' :
                           'Hasta 2 rutas, análisis básico'}
                        </p>
                      </div>
                      <span className={clsx('font-semibold text-sm px-3 py-1 rounded-full border', {
                        'bg-amber-500/10 text-amber-400 border-amber-500/20': profile?.plan === 'pro',
                        'bg-purple-500/10 text-purple-400 border-purple-500/20': profile?.plan === 'business',
                        'bg-brand-500/10 text-brand-400 border-brand-500/20': !profile?.plan || profile?.plan === 'free',
                      })}>
                        {profile?.plan === 'pro' ? 'Pro' : profile?.plan === 'business' ? 'Business' : 'Free'}
                      </span>
                    </div>
                    {profile?.plan_expires_at && (
                      <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <div>
                          <p className="text-slate-300 text-sm font-medium">Próxima renovación</p>
                          <p className="text-slate-500 text-xs">
                            {new Date(profile.plan_expires_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                        <RefreshCw className="w-4 h-4 text-slate-500" />
                      </div>
                    )}
                    <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <div>
                        <p className="text-slate-300 text-sm font-medium">Miembro desde</p>
                        <p className="text-slate-500 text-xs">
                          {user?.created_at
                            ? new Date(user.created_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
                            : '—'}
                        </p>
                      </div>
                      <Clock className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                      <div>
                        <p className="text-slate-300 text-sm font-medium">Email</p>
                        <p className="text-slate-500 text-xs">{user?.email}</p>
                      </div>
                      <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">Verificado</span>
                    </div>
                  </div>
                </div>

                {/* ── Plan Comparison / Upgrade ── */}
                {(!profile?.plan || profile?.plan === 'free') && (
                  <div className="card p-5 border-brand-500/30">
                    <h2 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      Actualiza tu Plan
                    </h2>
                    <p className="text-slate-400 text-sm mb-4">Desbloquea análisis ilimitados, exportación PDF y alertas en tiempo real.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">

                      {/* Pro */}
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-amber-400 font-bold text-lg">Pro</p>
                            <p className="text-slate-400 text-xs">Para operadores activos</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold text-xl">$49</p>
                            <p className="text-slate-500 text-xs">/mes USD</p>
                          </div>
                        </div>
                        <ul className="space-y-1.5 text-sm text-slate-300 flex-1">
                          <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>Rutas ilimitadas</li>
                          <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>Análisis con IA sin límite</li>
                          <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>Exportación PDF de reportes</li>
                          <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>Alertas automáticas</li>
                          <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>Digest semanal por email</li>
                        </ul>
                        <a
                          href="mailto:ventas@geopulse.app?subject=Upgrade%20a%20Pro&body=Hola%2C%20quiero%20actualizar%20mi%20cuenta%20al%20plan%20Pro."
                          className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold text-sm rounded-lg transition-colors"
                        >
                          <Zap className="w-4 h-4" />
                          Contratar Pro
                        </a>
                      </div>

                      {/* Business */}
                      <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-400 font-bold text-lg">Business</p>
                            <p className="text-slate-400 text-xs">Para equipos y agencias</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold text-xl">$149</p>
                            <p className="text-slate-500 text-xs">/mes USD</p>
                          </div>
                        </div>
                        <ul className="space-y-1.5 text-sm text-slate-300 flex-1">
                          <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>Todo lo del plan Pro</li>
                          <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>Hasta 5 usuarios del equipo</li>
                          <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>Acceso a API REST</li>
                          <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>Reportes white-label</li>
                          <li className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0"/>Soporte prioritario 24/7</li>
                        </ul>
                        <a
                          href="mailto:ventas@geopulse.app?subject=Upgrade%20a%20Business&body=Hola%2C%20quiero%20actualizar%20mi%20cuenta%20al%20plan%20Business."
                          className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-semibold text-sm rounded-lg transition-colors"
                        >
                          <TrendingUp className="w-4 h-4" />
                          Contratar Business
                        </a>
                      </div>
                    </div>
                    <p className="text-center text-slate-500 text-xs">¿Necesitas una demo o plan personalizado? <a href="mailto:ventas@geopulse.app" className="text-brand-400 underline">Contáctanos</a></p>
                  </div>
                )}

                {/* If already Pro or Business — show upgrade/manage */}
                {(profile?.plan === 'pro' || profile?.plan === 'business') && (
                  <div className="card p-5 border-emerald-500/20">
                    <h2 className="text-white font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      Plan {profile?.plan === 'pro' ? 'Pro' : 'Business'} activo
                    </h2>
                    <p className="text-slate-400 text-sm mb-4">Tienes acceso completo a todas las funciones de GeoPulse.</p>
                    <a
                      href="mailto:soporte@geopulse.app?subject=Gestionar%20suscripci%C3%B3n"
                      className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition-colors w-fit"
                    >
                      <Mail className="w-4 h-4" />
                      Gestionar suscripción
                    </a>
                  </div>
                )}

                {/* ── Zona de Peligro ── */}
                <div className="card p-5 border-red-500/20">
                  <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-red-400" />
                    Zona de Peligro
                  </h2>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg font-medium text-sm transition-colors"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}

          </form>
        </div>
      </div>
    </div>
  )
}
