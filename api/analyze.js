import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
})

export default async function handler(req, res) {
    if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' })
    }

  const { origin, destination, cargo, preview = false } = req.body

  if (!origin || !destination) {
        return res.status(400).json({ error: 'origin and destination are required' })
  }

  try {
        const prompt = `Eres un experto en riesgo geopolitico para cadenas de suministro de importacion.

            Analiza el riesgo geopolitico actual para la siguiente ruta comercial:
            - Origen: ${origin}
            - Destino: ${destination}  
            - Tipo de carga: ${cargo || 'general'}
            - Modo: ${preview ? 'preview rapido' : 'analisis completo'}

            Considera: tensiones diplomaticas, aranceles, sanciones, conflictos activos, estabilidad politica, riesgos logisticos, variaciones de tipo de cambio relevantes.

            Responde SOLO con un JSON valido con esta estructura exacta:
            {
              "score": <numero entre 0-100, donde 100 es maximo riesgo>,
                "level": <"low" | "medium" | "high">,
                  "summary": <string de 1-2 oraciones resumiendo el riesgo principal>,
                    "factors": [<array de 3-5 strings con factores de riesgo especificos>],
                      "recommendations": [<array de 2-3 strings con recomendaciones accionables>],
                        "sources_searched": [<array de strings con tipos de fuentes consultadas>]
                        }`

      const response = await client.messages.create({
              model: 'claude-opus-4-5',
              max_tokens: 1024,
              messages: [
                {
                            role: 'user',
                            content: prompt,
                },
                      ],
      })

      const text = response.content[0].text

      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
                throw new Error('No valid JSON in response')
        }

      const analysisData = JSON.parse(jsonMatch[0])

      // Validate score range
      analysisData.score = Math.max(0, Math.min(100, Number(analysisData.score) || 50))

      // Ensure level matches score
      if (analysisData.score >= 70) analysisData.level = 'high'
        else if (analysisData.score >= 40) analysisData.level = 'medium'
        else analysisData.level = 'low'

      return res.status(200).json(analysisData)
  } catch (error) {
        console.error('Analysis error:', error)

      // Fallback response on error
      return res.status(200).json({
              score: 55,
              level: 'medium',
              summary: `Riesgo moderado en la ruta ${origin} - ${destination}. Se recomienda monitoreo regular.`,
              factors: [
                        'Condiciones geopoliticas en evaluacion',
                        'Variabilidad logistica posible',
                        'Monitoreo continuo recomendado',
                      ],
              recommendations: [
                        'Diversificar proveedores como medida preventiva',
                        'Establecer stock de seguridad para esta ruta',
                      ],
              sources_searched: ['Fallback data - API error'],
      })
  }
}
