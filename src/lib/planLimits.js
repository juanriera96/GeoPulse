// Plan limits configuration for GeoPulse

export const PLAN_CONFIG = {
  free: {
    name: 'Free',
    label: 'GRATIS',
    color: 'text-slate-400',
    bg: 'bg-slate-700',
    border: 'border-slate-600',
    routes_limit: 2,
    analyses_per_month: 10,
    pdf_export: false,
    alerts: false,
    weekly_digest: false,
    history_days: 7,
    features: [
      'Hasta 2 rutas activas',
      '10 análisis por mes',
      'Historial de 7 días',
    ],
    restrictions: [
      'Sin exportación PDF',
      'Sin alertas automáticas',
      'Sin digest semanal',
    ],
  },
  pro: {
    name: 'Pro',
    label: 'PRO',
    color: 'text-brand-400',
    bg: 'bg-brand-600/20',
    border: 'border-brand-500/40',
    routes_limit: 999,
    analyses_per_month: 999,
    pdf_export: true,
    alerts: true,
    weekly_digest: true,
    history_days: 365,
    features: [
      'Rutas ilimitadas',
      'Análisis ilimitados',
      'Exportación PDF (individual y portfolio)',
      'Alertas automáticas de riesgo',
      'Digest semanal por email',
      'Historial completo',
    ],
    restrictions: [],
  },
  business: {
    name: 'Business',
    label: 'BUSINESS',
    color: 'text-amber-400',
    bg: 'bg-amber-500/20',
    border: 'border-amber-500/40',
    routes_limit: 999,
    analyses_per_month: 999,
    pdf_export: true,
    alerts: true,
    weekly_digest: true,
    history_days: 730,
    features: [
      'Todo lo de Pro',
      'Usuarios múltiples',
      'API access',
      'Soporte prioritario',
      'Historial 2 años',
    ],
    restrictions: [],
  },
}

/**
 * Returns the plan configuration for a given plan string.
 * Defaults to 'free' if plan is null/undefined/invalid.
 */
export function getPlanConfig(plan) {
  return PLAN_CONFIG[plan] || PLAN_CONFIG.free
}

/**
 * Check if the user can add a new route given their current route count.
 * @param {string} plan - User's plan ('free'|'pro'|'business')
 * @param {number} currentRoutes - How many routes user currently has
 * @returns {{ allowed: boolean, reason: string|null }}
 */
export function canAddRoute(plan, currentRoutes) {
  const config = getPlanConfig(plan)
  if (currentRoutes >= config.routes_limit) {
    return {
      allowed: false,
      reason: plan === 'free'
        ? `Plan Free permite hasta ${config.routes_limit} rutas. Actualiza a Pro para rutas ilimitadas.`
        : `Límite de rutas alcanzado.`,
    }
  }
  return { allowed: true, reason: null }
}

/**
 * Check if the user can export PDFs.
 */
export function canExportPDF(plan) {
  const config = getPlanConfig(plan)
  return {
    allowed: config.pdf_export,
    reason: config.pdf_export ? null : 'La exportación PDF está disponible en el plan Pro y superior.',
  }
}

/**
 * Check if the user can access alerts.
 */
export function canUseAlerts(plan) {
  const config = getPlanConfig(plan)
  return {
    allowed: config.alerts,
    reason: config.alerts ? null : 'Las alertas automáticas están disponibles en el plan Pro.',
  }
}
