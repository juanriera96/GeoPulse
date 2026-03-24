import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Globe, Eye, EyeOff, Loader2, Shield, TrendingUp, AlertTriangle, BarChart3, CheckCircle2 } from 'lucide-react'

const FEATURES = [
  { icon: Shield, title: 'Análisis de Riesgo Geopolítico', desc: 'Evaluación en tiempo real de tensiones comerciales, sanciones y conflictos que afectan tus rutas.' },
  { icon: TrendingUp, title: 'Inteligencia de Mercado', desc: 'Datos de aranceles, tipos de cambio, costos logísticos y tendencias de mercado por origen-destino.' },
  { icon: AlertTriangle, title: 'Alertas Críticas Proactivas', desc: 'Notificaciones inmediatas sobre eventos que pueden impactar tu cadena de suministro.' },
  { icon: BarChart3, title: 'Reportes Ejecutivos', desc: 'Reportes automatizados para cumplimiento aduanal, due diligence y presentación a dirección.' },
]

const TESTIMONIALS = [
  { text: 'GeoPulse nos permitió anticipar el impacto de las restricciones a semiconductores asiáticos con 3 semanas de anticipación.', author: 'Director de Logística, Empresa Manufacturera' },
  { text: 'Indispensable para nuestro equipo de compliance. Los análisis de riesgo reemplazan horas de investigación manual.', author: 'Agente Aduanal Certificado, Monterrey' },
  { text: 'La plataforma más completa para gestión de riesgo en comercio exterior que hemos evaluado.', author: 'Gerente de Importaciones, Distribuidora Nacional' },
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
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error } = await signUp(form.email, form.password, form.fullName)
        if (error) throw error
        toast.success('Cuenta creada. Revisa tu correo para confirmar.')
        navigate('/onboarding')
      } else {
        const { error } = await signIn(form.email, form.password)
        if (error) throw error
        navigate('/dashboard')
      }
    } catch (err) {
      toast.error(err.message || 'Error de autenticación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left panel - Value proposition */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 to-slate-950 border-r border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-600/30">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">GeoPulse</span>
              <span className="ml-2 text-xs bg-brand-600/20 text-brand-400 px-2 py-0.5 rounded-full border border-brand-600/30">Pro</span>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white leading-tight mb-4">
              Inteligencia geopolítica para <span className="text-brand-400">decisiones de comercio exterior</span> más seguras
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              La plataforma que utilizan importadores, exportadores y agentes aduanales para anticipar riesgos, optimizar rutas y proteger su cadena de suministro global.
            </p>
          </div>

          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="w-9 h-9 rounded-lg bg-brand-600/10 border border-brand-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rotating testimonial */}
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700">
          <div className="flex gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <span key={i} className="text-amber-400 text-sm">★</span>
            ))}
          </div>
          <p className="text-sm text-slate-300 leading-relaxed italic mb-3">
            "{TESTIMONIALS[testimonialIdx].text}"
          </p>
          <p className="text-xs text-slate-500 font-medium">{TESTIMONIALS[testimonialIdx].author}</p>
          <div className="flex gap-1 mt-3">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonialIdx(i)}
                className={`h-1 rounded-full transition-all ${i === testimonialIdx ? 'w-6 bg-brand-500' : 'w-2 bg-slate-600'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">GeoPulse</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">
              {mode === 'signup' ? 'Crear cuenta gratuita' : 'Acceder a la plataforma'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {mode === 'signup'
                ? 'Comienza a monitorear tus rutas de importación hoy mismo'
                : 'Monitoreo de riesgo geopolítico para tu operación comercial'
              }
            </p>
          </div>

          <div className="card p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="label">Nombre completo</label>
                  <input
                    className="input"
                    placeholder="Ej. María González"
                    value={form.fullName}
                    onChange={e => setForm(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                </div>
              )}
              <div>
                <label className="label">Correo corporativo</label>
                <input
                  className="input"
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={form.email}
                  onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                  required
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
                    onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
              >
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
                  : mode === 'signup'
                    ? 'Crear cuenta gratuita'
                    : 'Iniciar sesión'
                }
              </button>
            </form>

            {mode === 'signup' && (
              <div className="mt-4 space-y-2">
                {['Sin tarjeta de crédito requerida', 'Análisis ilimitados durante el período de prueba', 'Datos cifrados con encriptación AES-256'].map(item => (
                  <div key={item} className="flex items-center gap-2 text-xs text-slate-400">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 text-center text-sm text-slate-400">
              {mode === 'signup' ? (
                <span>¿Ya tienes cuenta?{' '}
                  <button onClick={() => setMode('signin')} className="text-brand-400 hover:text-brand-300 font-medium">
                    Iniciar sesión
                  </button>
                </span>
              ) : (
                <span>¿No tienes cuenta?{' '}
                  <button onClick={() => setMode('signup')} className="text-brand-400 hover:text-brand-300 font-medium">
                    Registrarse gratis
                  </button>
                </span>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-slate-600 mt-6">
            Al continuar aceptas nuestros{' '}
            <span className="text-slate-500 hover:text-slate-400 cursor-pointer">Términos de Uso</span>
            {' '}y{' '}
            <span className="text-slate-500 hover:text-slate-400 cursor-pointer">Política de Privacidad</span>
          </p>

          <p className="text-center text-xs text-slate-700 mt-3">
            Plataforma certificada para uso en comercio exterior • SOC 2 Type II
          </p>
        </div>
      </div>
    </div>
  )
}
