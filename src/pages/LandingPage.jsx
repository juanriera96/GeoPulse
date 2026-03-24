import { useNavigate } from 'react-router-dom'
import { Globe, Shield, Zap, BarChart3, ArrowRight, Check, Ship, Plane } from 'lucide-react'
import MaritimeBackground from '../components/MaritimeBackground'

const FEATURES = [
  { icon: Shield, title: 'Monitoreo en tiempo real', desc: 'Alertas instantáneas sobre eventos geopolíticos que afectan tus rutas de importación.' },
  { icon: Zap, title: 'IA con Claude', desc: 'Análisis profundo impulsado por Claude con búsqueda web en tiempo real.' },
  { icon: BarChart3, title: 'Reportes automáticos', desc: 'Reportes PDF semanales con resumen ejecutivo y recomendaciones accionables.' },
  { icon: Ship, title: 'Cobertura marítima', desc: 'Monitoreo de rutas marítimas, puertos clave y disrupciones en cadenas de suministro.' },
  { icon: Plane, title: 'Carga aérea', desc: 'Seguimiento de rutas aéreas y análisis de riesgo para importaciones de alta urgencia.' },
  { icon: Globe, title: 'Cobertura global', desc: 'Más de 100 países, todos los incoterms y modos de transporte cubiertos.' },
]

const PLANS = [
  { name: 'Free', price: 0, features: ['3 rutas', '5 análisis/mes', 'Alertas básicas', 'Dashboard'], cta: 'Empezar gratis', highlight: false },
  { name: 'Pro', price: 49, features: ['Rutas ilimitadas', '50 análisis/mes', 'Alertas en tiempo real', 'Reportes PDF', 'API access'], cta: 'Empezar Pro', highlight: true },
  { name: 'Business', price: 149, features: ['Todo en Pro', 'Análisis ilimitados', 'Multi-usuario', 'SLA garantizado', 'Soporte dedicado'], cta: 'Contactar ventas', highlight: false },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen bg-slate-950 overflow-x-hidden">

      {/* ── Animated Maritime Background ── */}
      <MaritimeBackground />

      {/* ── Overlay gradient so text is readable ── */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-transparent to-slate-950/80" />
      </div>

      {/* ── All content above the canvas ── */}
      <div className="relative" style={{ zIndex: 2 }}>

        {/* NAV */}
        <nav className="flex items-center justify-between px-6 py-4 border-b border-slate-800/50 backdrop-blur-sm bg-slate-950/30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">GeoPulse</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/auth')} className="text-slate-300 hover:text-white text-sm transition-colors px-3 py-1.5">
              Iniciar sesión
            </button>
            <button onClick={() => navigate('/auth')} className="btn-primary px-4 py-2 text-sm">
              Comenzar gratis
            </button>
          </div>
        </nav>

        {/* HERO */}
        <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-32 min-h-[88vh]">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-700/50 bg-brand-600/10 text-brand-300 text-xs font-medium mb-8 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse" />
            Powered by Claude AI
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 max-w-4xl leading-tight drop-shadow-2xl">
            Inteligencia de riesgo{' '}
            <span className="text-brand-400">geopolítico</span>{' '}
            para importadores
          </h1>

          <p className="text-slate-300 text-lg md:text-xl max-w-2xl mb-10 leading-relaxed drop-shadow-lg">
            Anticipa disrupciones en tus cadenas de suministro. Análisis en tiempo real
            con IA sobre tensiones comerciales, conflictos y riesgos regulatorios.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <button
              onClick={() => navigate('/auth')}
              className="btn-primary flex items-center justify-center gap-2 px-8 py-3.5 text-base shadow-lg shadow-brand-500/20"
            >
              Empezar gratis <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="flex items-center justify-center gap-2 px-8 py-3.5 text-base text-slate-200 border border-slate-600/50 rounded-lg hover:border-slate-400 hover:text-white transition-all backdrop-blur-sm bg-slate-900/40"
            >
              Ver demo
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-500 text-xs">
            {['Marítimo', 'Aéreo', 'Terrestre', 'Multimodal'].map(m => (
              <span key={m} className="flex items-center gap-1.5">
                <Check className="w-3 h-3 text-brand-400" /> {m}
              </span>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="px-6 py-20 bg-slate-950/70 backdrop-blur-sm border-t border-slate-800/40">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-3">
              Todo lo que necesitas para operar con certeza
            </h2>
            <p className="text-slate-400 text-center mb-12 max-w-xl mx-auto">
              Diseñado para importadores, agentes aduanales, exportadores y consultores de comercio exterior.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="card p-5 hover:border-brand-700/50 transition-colors bg-slate-900/60 backdrop-blur-sm">
                  <div className="w-10 h-10 bg-brand-600/10 rounded-xl flex items-center justify-center mb-4 border border-brand-700/20">
                    <Icon className="w-5 h-5 text-brand-400" />
                  </div>
                  <h3 className="font-semibold text-white mb-2">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="px-6 py-20 bg-slate-900/50 backdrop-blur-sm border-t border-slate-800/40">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-3">Precios simples y transparentes</h2>
            <p className="text-slate-400 text-center mb-12">Comienza gratis. Sin tarjeta de crédito.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANS.map(plan => (
                <div key={plan.name} className={`card p-6 flex flex-col bg-slate-900/60 backdrop-blur-sm ${plan.highlight ? 'border-brand-500/60 ring-1 ring-brand-500/20' : ''}`}>
                  {plan.highlight && (
                    <div className="text-xs font-semibold text-brand-300 bg-brand-600/15 border border-brand-700/30 px-3 py-1 rounded-full w-fit mb-4">
                      Más popular
                    </div>
                  )}
                  <h3 className="font-bold text-white text-xl mb-1">{plan.name}</h3>
                  <div className="flex items-end gap-1 mb-5">
                    <span className="text-3xl font-bold text-white">${plan.price}</span>
                    <span className="text-slate-400 text-sm mb-1">/mes</span>
                  </div>
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate('/auth')}
                    className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${plan.highlight ? 'btn-primary' : 'border border-slate-600 text-slate-200 hover:border-slate-400 hover:text-white'}`}
                  >
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-slate-800/40 px-6 py-8 text-center bg-slate-950/80 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
              <Globe className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white">GeoPulse</span>
          </div>
          <p className="text-slate-500 text-sm">Inteligencia geopolítica para el comercio internacional</p>
          <p className="text-slate-600 text-xs mt-2">© 2025 GeoPulse. Todos los derechos reservados.</p>
        </footer>

      </div>
    </div>
  )
}
