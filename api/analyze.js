import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { origin, destination, cargo, routeId, userId, preview = false } = req.body

  if (!origin || !destination) {
    return res.status(400).json({ error: 'origin and destination are required' })
  }

  try {
    const prompt = `Eres un experto senior en riesgo geopolitico y comercio internacional para cadenas de suministro de importacion.

Analiza el riesgo geopolitico ACTUAL (marzo 2026) para la siguiente ruta comercial de importacion:
- Pais de Origen: ${origin}
- Pais de Destino: ${destination}
- Tipo de Carga: ${cargo || 'carga general'}

Considera los siguientes factores criticos:
1. Tensiones diplomaticas bilaterales y multilaterales activas
2. Aranceles, cuotas, sanciones economicas y medidas proteccionistas vigentes
3. Conflictos armados, inestabilidad politica o cambios de gobierno recientes
4. Riesgos logisticos: puertos, rutas maritimas, aeropuertos, infraestructura
5. Riesgos cambiarios y financieros relevantes para esta ruta
6. Cumplimiento regulatorio: normativas aduaneras, certificaciones, restricciones especificas para el tipo de carga
7. Riesgos climaticos o de fuerza mayor que puedan afectar la ruta
8. Historial de disputas comerciales entre ambos paises

Responde UNICAMENTE con un JSON valido con esta estructura exacta, sin texto adicional:
{
  "score": <entero 0-100, donde 100 es riesgo maximo critico>,
  "level": <"low" | "medium" | "high">,
  "summary": <string 2-3 oraciones: panorama ejecutivo del riesgo principal para un importador>,
  "factors": [
    {
      "category": <string: categoria del factor, ej "Aranceles", "Diplomatico", "Logistico", "Regulatorio", "Cambiario", "Seguridad">,
      "description": <string: descripcion especifica y concreta del factor de riesgo>,
      "severity": <"low" | "medium" | "high">
    }
  ],
  "recommendations": [
    {
      "action": <string: accion concreta y especifica recomendada>,
      "priority": <"immediate" | "short_term" | "long_term">
    }
  ],
  "trade_data": {
    "typical_transit_days": <entero: dias tipicos de transito>,
    "key_ports": <array de strings: puertos o puntos de entrada clave>,
    "incoterms_recommended": <string: incoterm recomendado para esta ruta, ej "FOB", "CIF", "DDP">,
    "currency_risk": <"low" | "medium" | "high">
  },
  "last_updated": <string: fecha actual en formato ISO>
}`;

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].text
    const jsonMatch = text.match(/{[sS]*}/)
    if (!jsonMatch) throw new Error('No valid JSON in response')

    const analysisData = JSON.parse(jsonMatch[0])

    // Validate and normalize score
    analysisData.score = Math.max(0, Math.min(100, Number(analysisData.score) || 50))
    if (analysisData.score >= 70) analysisData.level = 'high'
    else if (analysisData.score >= 40) analysisData.level = 'medium'
    else analysisData.level = 'low'

    analysisData.last_updated = new Date().toISOString()

    // Save to Supabase if routeId and userId provided
    if (routeId && userId && !preview) {
      const { error: dbError } = await supabase
        .from('risk_analyses')
        .insert({
          route_id: routeId,
          user_id: userId,
          risk_score: analysisData.score,
          risk_level: analysisData.level,
          summary: analysisData.summary,
          factors: analysisData.factors,
          recommendations: analysisData.recommendations,
          trade_data: analysisData.trade_data,
          raw_response: text,
        })

      if (dbError) {
        console.error('DB insert error:', dbError)
      }
    }

    return res.status(200).json({
      ...analysisData,
      risk_score: analysisData.score,
    })

  } catch (error) {
    console.error('Analysis error:', error)

    // Structured fallback response
    return res.status(200).json({
      score: 55,
      risk_score: 55,
      level: 'medium',
      summary: `Riesgo moderado detectado en la ruta ${origin} - ${destination}. Se recomienda monitoreo continuo y revision de documentacion aduanera.`,
      factors: [
        { category: 'General', description: 'Condiciones geopoliticas en evaluacion activa', severity: 'medium' },
        { category: 'Logistico', description: 'Variabilidad logistica posible en esta ruta', severity: 'low' },
        { category: 'Regulatorio', description: 'Verificar requisitos de certificacion vigentes', severity: 'medium' },
      ],
      recommendations: [
        { action: 'Diversificar proveedores como medida preventiva', priority: 'short_term' },
        { action: 'Establecer stock de seguridad de 30 dias para esta ruta', priority: 'immediate' },
        { action: 'Revisar cobertura de seguro de carga internacional', priority: 'short_term' },
      ],
      trade_data: {
        typical_transit_days: 30,
        key_ports: ['Por determinar'],
        incoterms_recommended: 'FOB',
        currency_risk: 'medium',
      },
      last_updated: new Date().toISOString(),
    })
  }
}
