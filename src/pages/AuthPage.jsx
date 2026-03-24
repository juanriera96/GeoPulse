import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Globe, Eye, EyeOff, Loader2, Shield, TrendingUp, AlertTriangle, BarChart3, CheckCircle2 } from 'lucide-react'
import MaritimeBackground from '../components/MaritimeBackground'

const FEATURES = [
  { icon: Shield, title: 'Análisis de Riesgo Geopolítico', desc: 'Evaluación en tiempo real de tensiones comerciales, sanciones y conflictos que afectan tus rutas.' },
  { icon: TrendingUp, title: 'Inteligencia de Mercado', desc: 'Datos de aranceles, tipos de cambio, costos logísticos y tendencias de mercado por origen-destino.' },
  { icon: AlertTriangle, title: 'Alertas Críticas Proactivas', desc: 'Notificaciones inmediatas sobre eventos que pueden impactar tu cadena de suministro.' },
  { icon: BarChart3, title: 'Reportes Ejecutivos', desc: 'Reportes automatizados para cumplimiento aduanal, due diligence y presentación a dirección.' },
]

const TESTIMONIALS = [
  { text: 'GeoPulse nos permitió anticipar el impacto de las restricciones a semiconductores asiáticos con 3 semanas de anticipación.', author: 'Gerente de Compras', company: 'Manufactura Automotriz' },
  { text: 'Indispensable para nuestro equipo de compliance. Los análisis de riesgo de contraparte han reducido incidencias en un 40%.', author: 'Director de Logística', company: 'Trading Internacional' },
  { text: 'La plataforma más completa para gestión de riesgo en comercio exterior. Mis clientes la usan como herramienta de decisión.', author: 'Agente Aduanal Certificado', company: 'Consultoría Aduanal' },
]

export default function AuthPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn, signUp, user } = useAuthStore()
  const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'signin')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [testimonialIdx, setTestimonialIdx] = useState(0)
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  useEffect(() => {
    const timer = setInterval(() => {
      setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) return toast.error('Completa todos los campos')
    if (mode === 'signup' && !form.fullName) return toast.error('Ingresa tu nombre completo')
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn(form.email, form.password)
        toast.success('Bienvenido de nuevo')
        navigate('/dashboard')
      } else {
        await signUp(form.email, form.password, form.fullName)
        toast.success('Cuenta creada. Revisa tu correo.')
      }
    } catch (err) {
      toast.error(err.message || 'Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  const testimonial = TESTIMONIALS[testimonialIdx]

  return (
    <div className="relative min-h-screen bg-slate-950 flex overflow-hidden">

      {/* Animated maritime background */}
      <MaritimeBackground />

      {/* Overlay for readability */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-slate-950/20" />
      </div>

      {/* Content above canvas */}
      <div className="relative flex w-full" style={{ zIndex: 2 }}>

        {/* LEFT PANEL — Value proposition */}
        <div className="hidden lg:flex w-[52%] flex-col justify-between p-12 xl:p-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-xl">GeoPulse</span>
          </div>

          <div className="space-y-8 max-w-lg">
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4 drop-shadow-lg">
                Inteligencia geopolítica para el{' '}
                <span className="text-brand-400">comercio internacional</span>
              </h1>
              <p className="text-slate-300 text-lg leading-relaxed">
                Anticipa disrupciones en rutas marítimas y aéreas. Análisis con IA en tiempo real para importadores, agentes aduanales y operadores logísticos.
              </p>
            </div>

            <div className="space-y-4">
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/50 backdrop-blur-sm border border-slate-700/40 hover:border-brand-700/40 transition-colors">
                  <div className="w-9 h-9 bg-brand-600/15 rounded-lg flex items-center justify-center flex-shrink-0 border border-brand-700/20">
                    <Icon className="w-4 h-4 text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="p-5 rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-slate-700/40">
            <p className="text-slate-300 text-sm italic leading-relaxed mb-3">
              &ldquo;{testimonial.text}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-700/30 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-brand-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">{testimonial.author}</p>
                <p className="text-xs text-slate-500">{testimonial.company}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — Auth form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">GeoPulse</span>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-8 shadow-2xl shadow-slate-950/50">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-1">
                  {mode === 'signin' ? 'Inicia sesión' : 'Crea tu cuenta'}
                </h2>
                <p className="text-slate-400 text-sm">
                  {mode === 'signin'
                    ? 'Accede a tu plataforma de monitoreo geopolítico'
                    : 'Comienza gratis. Sin tarjeta de crédito.'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="label">Nombre completo</label>
                    <input
                      className="input"
                      placeholder="Tu nombre completo"
                      value={form.fullName}
                      onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                    />
                  </div>
                )}
                <div>
                  <label className="label">Correo electrónico</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="tu@empresa.com"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label">Contraseña</label>
                  <div className="relative">
                    <input
                      className="input pr-10"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Mínimo 8 caracteres"
                      value={form.password}
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mode === 'signin' ? 'Iniciar sesión' : 'Crear cuenta'}
                </button>
              </form>

              <div className="mt-5 pt-5 border-t border-slate-700/50 text-center">
                <p className="text-sm text-slate-400">
                  {mode === 'signin' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
                  <button
                    onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                    className="text-brand-400 hover:text-brand-300 font-medium transition-colors"
                  >
                    {mode === 'signin' ? 'Regístrate gratis' : 'Inicia sesión'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
