// GeoPulse Weekly Digest — Cron Job (runs every Monday 14:00 UTC)
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const resend = new Resend(process.env.RESEND_API_KEY)

export const config = { maxDuration: 300 }

// ── Helpers ──────────────────────────────────────────────────────────────────

function riskLabel(score) {
  if (score >= 70) return 'Alto Riesgo'
  if (score >= 40) return 'Riesgo Medio'
  return 'Bajo Riesgo'
}

function riskColor(score) {
  if (score >= 70) return '#f87171'
  if (score >= 40) return '#fbbf24'
  return '#34d399'
}

function scoreEmoji(score) {
  if (score >= 70) return '🔴'
  if (score >= 40) return '🟡'
  return '🟢'
}

function trendText(delta) {
  if (delta > 5) return `📈 +${delta} pts (subió)`
  if (delta < -5) return `📉 ${delta} pts (bajó)`
  return `➡️ ${delta > 0 ? '+' : ''}${delta} pts (estable)`
}

// ── Core analysis (same logic as analyze.js) ─────────────────────────────────

async function analyzeRoute(origin, destination, cargo) {
  const prompt = `Eres un experto senior en riesgo geopolitico y comercio internacional.
Analiza el riesgo geopolitico ACTUAL para la siguiente ruta comercial:
- Origen: ${origin}
- Destino: ${destination}
- Carga: ${cargo || 'carga general'}

Responde SOLO con JSON valido:
{
  "score": <entero 0-100>,
  "level": <"low"|"medium"|"high">,
  "summary": <string 2-3 oraciones>,
  "factors": [{"category": <string>, "description": <string>, "severity": <"low"|"medium"|"high">}],
  "recommendations": [{"action": <string>, "priority": <"immediate"|"short_term"|"long_term">}],
  "trade_data": {
    "typical_transit_days": <entero>,
    "key_ports": <array strings>,
    "incoterms_recommended": <string>,
    "currency_risk": <"low"|"medium"|"high">
  }
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].text
  const clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const first = clean.indexOf('{')
  const last = clean.lastIndexOf('}')
  if (first === -1 || last === -1) throw new Error('No JSON in response')
  const data = JSON.parse(clean.slice(first, last + 1))
  data.score = Math.max(0, Math.min(100, Number(data.score) || 50))
  if (data.score >= 70) data.level = 'high'
  else if (data.score >= 40) data.level = 'medium'
  else data.level = 'low'
  return data
}

// ── Email builder ─────────────────────────────────────────────────────────────

function buildEmailHTML(userName, routes) {
  const criticalRoutes = routes.filter(r => r.newScore >= 70)
  const risingRoutes = routes.filter(r => r.delta >= 10 && r.newScore < 70)
  const totalRoutes = routes.length

  const routeRows = routes.map(r => `
    <tr style="border-bottom: 1px solid #1e293b;">
      <td style="padding: 14px 16px;">
        <div style="font-weight: 600; color: #f1f5f9; font-size: 14px;">${r.name}</div>
        <div style="color: #64748b; font-size: 12px; margin-top: 2px;">${r.origin} → ${r.destination}</div>
        <div style="color: #64748b; font-size: 12px;">${r.cargo || ''}</div>
      </td>
      <td style="padding: 14px 16px; text-align: center;">
        <div style="
          display: inline-block;
          background: ${r.newScore >= 70 ? 'rgba(239,68,68,0.15)' : r.newScore >= 40 ? 'rgba(245,158,11,0.15)' : 'rgba(52,211,153,0.15)'};
          border: 1px solid ${riskColor(r.newScore)};
          border-radius: 8px;
          padding: 6px 12px;
          min-width: 60px;
        ">
          <div style="font-size: 22px; font-weight: 800; color: ${riskColor(r.newScore)}; line-height: 1;">${r.newScore}</div>
          <div style="font-size: 10px; color: ${riskColor(r.newScore)}; margin-top: 2px;">/100</div>
        </div>
      </td>
      <td style="padding: 14px 16px; text-align: center;">
        ${r.prevScore !== null ? `
          <div style="font-size: 13px; color: ${r.delta > 5 ? '#f87171' : r.delta < -5 ? '#34d399' : '#94a3b8'}; font-weight: 600;">
            ${r.delta > 0 ? '▲ +' : r.delta < 0 ? '▼ ' : '— '}${r.delta} pts
          </div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">vs semana anterior</div>
        ` : '<div style="color: #475569; font-size: 12px;">Primer análisis</div>'}
      </td>
      <td style="padding: 14px 16px;">
        <div style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
          ${r.summary ? r.summary.slice(0, 120) + (r.summary.length > 120 ? '...' : '') : '—'}
        </div>
      </td>
    </tr>
  `).join('')

  const alertBanner = criticalRoutes.length > 0 ? `
    <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.4); border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">🚨</span>
        <div>
          <div style="color: #f87171; font-weight: 700; font-size: 15px;">
            ${criticalRoutes.length} ruta${criticalRoutes.length > 1 ? 's' : ''} con riesgo crítico esta semana
          </div>
          <div style="color: #fca5a5; font-size: 13px; margin-top: 3px;">
            ${criticalRoutes.map(r => r.name).join(', ')} — Acción inmediata recomendada.
          </div>
        </div>
      </div>
    </div>
  ` : ''

  const risingBanner = risingRoutes.length > 0 && criticalRoutes.length === 0 ? `
    <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.4); border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">📈</span>
        <div>
          <div style="color: #fbbf24; font-weight: 700; font-size: 15px;">
            ${risingRoutes.length} ruta${risingRoutes.length > 1 ? 's' : ''} con riesgo en aumento
          </div>
          <div style="color: #fcd34d; font-size: 13px; margin-top: 3px;">
            ${risingRoutes.map(r => r.name + ' (+' + r.delta + ' pts)').join(', ')}
          </div>
        </div>
      </div>
    </div>
  ` : ''

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0a0f1e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">

  <div style="max-width: 680px; margin: 0 auto; padding: 32px 16px;">

    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); border-radius: 16px 16px 0 0; padding: 32px; border-bottom: 2px solid #6366f1;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div>
          <div style="font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
            Geo<span style="color: #6366f1;">Pulse</span>
          </div>
          <div style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Inteligencia de Riesgo Geopolítico</div>
        </div>
        <div style="text-align: right;">
          <div style="color: #6366f1; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Resumen Semanal</div>
          <div style="color: #64748b; font-size: 12px; margin-top: 2px;">${new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div style="background: #0f172a; border-radius: 0 0 16px 16px; border: 1px solid #1e293b; border-top: none; padding: 28px;">

      <div style="color: #94a3b8; font-size: 14px; margin-bottom: 24px; line-height: 1.6;">
        Hola <strong style="color: #e2e8f0;">${userName}</strong>, aquí tienes el análisis de riesgo actualizado para tus <strong style="color: #6366f1;">${totalRoutes} ruta${totalRoutes !== 1 ? 's' : ''}</strong> comerciales de esta semana.
      </div>

      ${alertBanner}
      ${risingBanner}

      <!-- Routes table -->
      <div style="border-radius: 10px; overflow: hidden; border: 1px solid #1e293b;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #1e293b;">
              <th style="padding: 10px 16px; text-align: left; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Ruta</th>
              <th style="padding: 10px 16px; text-align: center; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Score</th>
              <th style="padding: 10px 16px; text-align: center; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Variación</th>
              <th style="padding: 10px 16px; text-align: left; color: #64748b; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Resumen</th>
            </tr>
          </thead>
          <tbody style="background: #0f172a;">
            ${routeRows}
          </tbody>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin-top: 28px; padding: 24px; background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.2); border-radius: 12px;">
        <div style="color: #e2e8f0; font-size: 15px; font-weight: 600; margin-bottom: 8px;">Ver análisis completo con recomendaciones</div>
        <div style="color: #64748b; font-size: 13px; margin-bottom: 16px;">Factores detallados, datos comerciales y acciones sugeridas para cada ruta</div>
        <a href="https://geo-pulse-chi.vercel.app/routes" style="
          display: inline-block;
          background: #6366f1;
          color: white;
          text-decoration: none;
          padding: 12px 28px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
        ">Abrir GeoPulse →</a>
      </div>

    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px 0 0; color: #334155; font-size: 12px; line-height: 1.8;">
      <div>GeoPulse · Plataforma de Inteligencia Geopolítica para Comercio Exterior</div>
      <div>Este reporte fue generado automáticamente cada lunes.</div>
      <div style="margin-top: 8px;">
        <a href="https://geo-pulse-chi.vercel.app/settings" style="color: #475569; text-decoration: none;">Gestionar notificaciones</a>
        &nbsp;·&nbsp;
        <a href="https://geo-pulse-chi.vercel.app" style="color: #475569; text-decoration: none;">Ir a la plataforma</a>
      </div>
    </div>

  </div>
</body>
</html>`
}

// ── Main cron handler ─────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // Allow GET for Vercel cron, POST for manual trigger / testing
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Security: Vercel cron passes Authorization header with CRON_SECRET
  // For manual POST triggers we check a simple secret
  const authHeader = req.headers['authorization']
  const cronSecret = process.env.CRON_SECRET
  const isManualTrigger = req.method === 'POST' && req.body?.secret === cronSecret
  const isVercelCron = authHeader === `Bearer ${cronSecret}`

  if (cronSecret && !isManualTrigger && !isVercelCron) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const startTime = Date.now()
  const results = { processed: 0, emailed: 0, errors: [], skipped: 0 }

  try {
    // 1. Get all users with their profiles (email + name)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, company_name')
      .eq('onboarding_completed', true)

    if (profilesError) throw profilesError
    if (!profiles || profiles.length === 0) {
      return res.status(200).json({ message: 'No users to process', ...results })
    }

    console.log(`[weekly-digest] Processing ${profiles.length} users`)

    for (const profile of profiles) {
      try {
        // 2. Get all routes for this user
        const { data: routes, error: routesError } = await supabase
          .from('routes')
          .select(`
            id, name, origin_country, destination_country, cargo_type, incoterm,
            risk_analyses(risk_score, risk_level, summary, created_at)
          `)
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })

        if (routesError || !routes || routes.length === 0) {
          results.skipped++
          continue
        }

        const routeResults = []
        let hasSignificantChange = false
        let hasCritical = false

        for (const route of routes) {
          // Get the most recent analysis before running new one
          const sortedAnalyses = (route.risk_analyses || []).sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          )
          const prevAnalysis = sortedAnalyses[0] || null
          const prevScore = prevAnalysis ? prevAnalysis.risk_score : null

          // 3. Run new analysis via Claude
          let newAnalysis = null
          try {
            newAnalysis = await analyzeRoute(
              route.origin_country,
              route.destination_country,
              route.cargo_type
            )
          } catch (analysisErr) {
            console.error(`[weekly-digest] Analysis failed for route ${route.id}:`, analysisErr.message)
            results.errors.push(`Route ${route.id}: ${analysisErr.message}`)
            continue
          }

          // 4. Save new analysis to Supabase
          const { error: insertError } = await supabase
            .from('risk_analyses')
            .insert({
              route_id: route.id,
              user_id: profile.id,
              risk_score: newAnalysis.score,
              risk_level: newAnalysis.level,
              summary: newAnalysis.summary,
              factors: newAnalysis.factors,
              recommendations: newAnalysis.recommendations,
              trade_data: newAnalysis.trade_data,
              raw_response: JSON.stringify(newAnalysis),
            })

          if (insertError) {
            console.error(`[weekly-digest] DB insert error for route ${route.id}:`, insertError.message)
          }

          const delta = prevScore !== null ? newAnalysis.score - prevScore : 0

          // Track significant changes
          if (newAnalysis.score >= 70) hasCritical = true
          if (Math.abs(delta) >= 5 || newAnalysis.score >= 70) hasSignificantChange = true

          routeResults.push({
            id: route.id,
            name: route.name || (route.origin_country + ' → ' + route.destination_country),
            origin: route.origin_country,
            destination: route.destination_country,
            cargo: route.cargo_type,
            incoterm: route.incoterm,
            prevScore,
            newScore: newAnalysis.score,
            delta,
            level: newAnalysis.level,
            summary: newAnalysis.summary,
          })

          results.processed++
        }

        // 5. Send email if there's at least one analyzed route
        if (routeResults.length === 0) {
          results.skipped++
          continue
        }

        // Always send weekly digest (even if no big changes — keeps users engaged)
        // But prioritize users with critical or rising routes
        const shouldSend = true // send to all users with analyzed routes every week

        if (shouldSend && profile.email) {
          const userName = profile.full_name || profile.company_name || 'Usuario'
          const subject = hasCritical
            ? `🚨 GeoPulse: Alerta crítica en tus rutas comerciales`
            : hasSignificantChange
              ? `📈 GeoPulse: Cambios importantes en tus rutas esta semana`
              : `📊 GeoPulse: Tu resumen semanal de riesgo geopolítico`

          const htmlBody = buildEmailHTML(userName, routeResults)

          const { error: emailError } = await resend.emails.send({
            from: 'GeoPulse <onboarding@resend.dev>',
            to: [profile.email],
            subject,
            html: htmlBody,
          })

          if (emailError) {
            console.error(`[weekly-digest] Email error for ${profile.email}:`, emailError.message)
            results.errors.push(`Email ${profile.email}: ${emailError.message}`)
          } else {
            results.emailed++
            console.log(`[weekly-digest] Email sent to ${profile.email} (${routeResults.length} routes)`)
          }
        }

      } catch (userErr) {
        console.error(`[weekly-digest] Error processing user ${profile.id}:`, userErr.message)
        results.errors.push(`User ${profile.id}: ${userErr.message}`)
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log(`[weekly-digest] Done in ${elapsed}s. Processed: ${results.processed}, Emailed: ${results.emailed}, Errors: ${results.errors.length}`)

    return res.status(200).json({
      success: true,
      elapsed: elapsed + 's',
      ...results,
    })

  } catch (err) {
    console.error('[weekly-digest] Fatal error:', err)
    return res.status(500).json({ error: err.message, ...results })
  }
}
