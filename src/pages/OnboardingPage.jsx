import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import {
  Globe,
  Building2,
  Route,
  Zap,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
  Package,
  MapPin,
  Ship,
  FileText,
  Briefcase,
  ArrowRight,
  Info,
} from 'lucide-react'

const INDUSTRIES = [
  { value: 'Manufactura', label: 'Manufactura e Industria', icon: '🏭' },
  { value: 'Tecnologia', label: 'Tecnología y Electrónica', icon: '💻' },
  { value: 'Alimentos', label: 'Alimentos y Bebidas', icon: '🍽️' },
  { value: 'Textil', label: 'Textil y Confección', icon: '👗' },
  { value: 'Quimica', label: 'Química y Farmacéutica', icon: '⚗️' },
  { value: 'Automotriz', label: 'Automotriz y Autopartes', icon: '🚗' },
  { value: 'Energia', label: 'Energía y Petroquímica', icon: '⚡' },
  { value: 'Agro', label: 'Agroindustria', icon: '🌾' },
  { value: 'Retail', label: 'Retail y Distribución', icon: '🏪' },
  { value: 'Otro', label: 'Otro sector', icon: '📦' },
]

const COMPANY_TYPES = [
  { value: 'importador', label: 'Importador directo', desc: 'Importo mercancía para mi empresa' },
  { value: 'exportador', label: 'Exportador', desc: 'Exporto productos al exterior' },
  { value: 'agente_aduanal', label: 'Agente Aduanal / Broker', desc: 'Gestiono operaciones de terceros' },
  { value: 'comercializador', label: 'Comercializador / Trading', desc: 'Compraventa internacional' },
  { value: 'logistica', label: 'Operador Logístico / Freight', desc: 'Transporte y logística internacional' },
  { value: 'abogado', label: 'Consultor / Abogado Aduanal', desc: 'Asesoría en comercio exterior' },
]

const INCOTERMS = ['FOB', 'CIF', 'EXW', 'DAP', 'DDP', 'CFR', 'FCA', 'CPT', 'CIP', 'DAT']

const CARGO_TYPES = [
  'Materias primas',
  'Componentes electrónicos',
  'Maquinaria y equipos',
  'Productos terminados',
  'Alimentos y perecederos',
  'Textiles y confección',
  'Químicos y farmacéuticos',
  'Automotriz y autopartes',
  'Energía y combustibles',
  'Otro',
]

const COUNTRIES = [
  // América del Norte y Central
  'México', 'Estados Unidos', 'Canadá', 'Guatemala', 'Honduras', 'El Salvador',
  'Nicaragua', 'Costa Rica', 'Panamá', 'Cuba', 'República Dominicana', 'Haití',
  'Jamaica', 'Trinidad y Tobago', 'Puerto Rico',
  // América del Sur
  'Venezuela', 'Colombia', 'Ecuador', 'Perú', 'Bolivia', 'Brasil', 'Argentina',
  'Chile', 'Uruguay', 'Paraguay', 'Guyana', 'Surinam',
  // Europa Occidental
  'Alemania', 'Francia', 'España', 'Italia', 'Portugal', 'Países Bajos', 'Bélgica',
  'Suiza', 'Austria', 'Suecia', 'Noruega', 'Dinamarca', 'Finlandia', 'Irlanda',
  'Reino Unido', 'Grecia',
  // Europa del Este
  'Polonia', 'República Checa', 'Hungría', 'Rumania', 'Bulgaria', 'Ucrania',
  'Serbia', 'Croacia', 'Eslovaquia', 'Eslovenia',
  // Asia Oriental
  'China', 'Japón', 'Corea del Sur', 'Taiwán', 'Hong Kong', 'Mongolia',
  // Asia Sudoriental
  'Vietnam', 'Tailandia', 'Indonesia', 'Malasia', 'Filipinas', 'Singapur',
  'Myanmar', 'Camboya', 'Laos',
  // Asia del Sur
  'India', 'Pakistán', 'Bangladesh', 'Sri Lanka', 'Nepal',
  // Asia Central y Cáucaso
  'Kazajistán', 'Uzbekistán', 'Azerbaiyán', 'Georgia',
  // Medio Oriente
  'Emiratos Árabes Unidos', 'Arabia Saudita', 'Qatar', 'Kuwait', 'Omán',
  'Turquía', 'Israel', 'Jordania', 'Irak', 'Irán', 'Líbano',
  // África del Norte
  'Egipto', 'Marruecos', 'Argelia', 'Túnez', 'Libia',
  // África Subsahariana
  'Nigeria', 'Sudáfrica', 'Ghana', 'Kenia', 'Etiopía', 'Tanzania',
  'Costa de Marfil', 'Senegal', 'Angola', 'Mozambique', 'Camerún',
  // Oceanía
  'Australia', 'Nueva Zelanda',
  // Rusia y ex-URSS
  'Rusia', 'Bielorrusia',
]

const STEPS = [
  { id: 1, title: 'Tu empresa', description: 'Perfil de tu operación comercial', icon: Building2 },
  { id: 2, title: 'Primera ruta', description: 'Define la ruta a analizar', icon: Route },
  { id: 3, title: 'Primer análisis', description: 'Analiza el riesgo con IA', icon: Zap },
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [company, setCompany] = useState({
    company_name: '',
    company_type: '',
    industry: '',
    cargo_types: [],
    main_incoterms: [],
    annual_import_volume: '',
    tax_id: '',
  })

  const [routeData, setRouteData] = useState({
    name: '',
    origin_country: '',
    destination_country: '',
    cargo_type: '',
    incoterm: '',
    transport_mode: '',
    port_of_origin: '',
    port_of_destination: '',
  })

  const toggleItem = (arr, item, setter, field) => {
    setter(prev => ({
      ...prev,
      [field]: arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item],
    }))
  }

  const handleStep1Next = async () => {
    if (!company.company_name.trim()) return toast.error('Ingresa el nombre de tu empresa')
    if (!company.company_type) return toast.error('Selecciona el tipo de operación')
    if (!company.industry) return toast.error('Selecciona tu industria')
    if (company.cargo_types.length === 0) return toast.error('Selecciona al menos un tipo de mercancía')

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          company_name: company.company_name,
          industry: company.industry,
          company_type: company.company_type,
          cargo_types: company.cargo_types,
          main_incoterms: company.main_incoterms,
          annual_import_volume: company.annual_import_volume,
          tax_id: company.tax_id,
          onboarding_completed: false,
        })
        .eq('id', user.id)
      if (error) throw error
      setStep(2)
    } catch (err) {
      toast.error('Error guardando perfil: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStep2Next = async () => {
    if (!routeData.name.trim()) return toast.error('Asigna un nombre a la ruta')
    if (!routeData.origin_country) return toast.error('Selecciona el país de origen')
    if (!routeData.destination_country) return toast.error('Selecciona el país de destino')
    if (!routeData.cargo_type) return toast.error('Selecciona el tipo de mercancía')
    if (!routeData.transport_mode) return toast.error('Selecciona el modo de transporte')

    setLoading(true)
    try {
      const { error } = await supabase
        .from('routes')
        .insert({
          user_id: user.id,
          name: routeData.name,
          origin_country: routeData.origin_country,
          destination_country: routeData.destination_country,
          cargo_type: routeData.cargo_type,
          incoterm: routeData.incoterm,
          transport_mode: routeData.transport_mode,
          port_of_origin: routeData.port_of_origin,
          port_of_destination: routeData.port_of_destination,
        })
      if (error) throw error
      setStep(3)
    } catch (err) {
      toast.error('Error guardando ruta: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id)
      navigate('/dashboard')
      toast.success('¡Bienvenido a GeoPulse! Tu plataforma está lista.')
    } catch (err) {
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left sidebar */}
      <div className="hidden lg:flex w-72 flex-col bg-slate-900 border-r border-slate-800 p-8">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white">GeoPulse</span>
        </div>

        <div className="space-y-1">
          {STEPS.map((s) => {
            const Icon = s.icon
            const isActive = step === s.id
            const isDone = step > s.id
            return (
              <div key={s.id} className={clsx(
                'flex items-start gap-3 p-3 rounded-lg transition-colors',
                isActive ? 'bg-slate-800' : 'opacity-50'
              )}>
                <div className={clsx(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                  isDone ? 'bg-emerald-600' : isActive ? 'bg-brand-600' : 'bg-slate-700'
                )}>
                  {isDone ? <Check className="w-3.5 h-3.5 text-white" /> : <Icon className="w-3.5 h-3.5 text-white" />}
                </div>
                <div>
                  <p className={clsx('text-sm font-semibold', isActive ? 'text-white' : 'text-slate-400')}>{s.title}</p>
                  <p className="text-xs text-slate-500">{s.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-auto">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-white mb-1">¿Necesitas ayuda?</p>
                <p className="text-xs text-slate-500">Este proceso toma menos de 5 minutos. Podrás editar todos los datos desde Configuración.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-start justify-center p-8 pt-12 overflow-y-auto">
        <div className="w-full max-w-2xl">
          {/* Mobile header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-sm">GeoPulse</span>
            </div>
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={clsx(
                    'w-2 h-2 rounded-full',
                    step > s.id ? 'bg-emerald-500' : step === s.id ? 'bg-brand-500' : 'bg-slate-700'
                  )} />
                  {i < STEPS.length - 1 && <div className="w-6 h-px bg-slate-700" />}
                </div>
              ))}
              <span className="text-xs text-slate-500 ml-2">Paso {step} de {STEPS.length}</span>
            </div>
          </div>

          {/* Step 1: Company Profile */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Configura el perfil de tu operación</h2>
                <p className="text-slate-400 text-sm mt-1">Esta información personaliza los análisis de riesgo para tu tipo de negocio.</p>
              </div>

              <div className="card p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="label">Nombre de la empresa *</label>
                    <input
                      className="input"
                      placeholder="Ej. Importaciones García S.A. de C.V."
                      value={company.company_name}
                      onChange={e => setCompany(p => ({ ...p, company_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">RFC / Número fiscal</label>
                    <input
                      className="input"
                      placeholder="Ej. XAXX010101000"
                      value={company.tax_id}
                      onChange={e => setCompany(p => ({ ...p, tax_id: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Volumen anual de importación</label>
                    <select
                      className="input"
                      value={company.annual_import_volume}
                      onChange={e => setCompany(p => ({ ...p, annual_import_volume: e.target.value }))}
                    >
                      <option value="">Seleccionar rango</option>
                      <option value="<500k">Menos de USD 500K</option>
                      <option value="500k-2m">USD 500K - 2M</option>
                      <option value="2m-10m">USD 2M - 10M</option>
                      <option value="10m-50m">USD 10M - 50M</option>
                      <option value=">50m">Más de USD 50M</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Tipo de operación *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {COMPANY_TYPES.map(({ value, label, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCompany(p => ({ ...p, company_type: value }))}
                        className={clsx(
                          'text-left p-3 rounded-lg border transition-all',
                          company.company_type === value
                            ? 'border-brand-500 bg-brand-600/10 text-white'
                            : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                        )}
                      >
                        <p className="text-xs font-semibold">{label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Industria / Sector *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {INDUSTRIES.map(({ value, label, icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCompany(p => ({ ...p, industry: value }))}
                        className={clsx(
                          'flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all',
                          company.industry === value
                            ? 'border-brand-500 bg-brand-600/10 text-white'
                            : 'border-slate-700 text-slate-400 hover:border-slate-600'
                        )}
                      >
                        <span className="text-base">{icon}</span>
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Tipos de mercancía que maneja *</label>
                  <p className="text-xs text-slate-500 mb-2">Selecciona todos los que apliquen</p>
                  <div className="flex flex-wrap gap-2">
                    {CARGO_TYPES.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleItem(company.cargo_types, t, setCompany, 'cargo_types')}
                        className={clsx(
                          'text-xs px-3 py-1.5 rounded-full border transition-all',
                          company.cargo_types.includes(t)
                            ? 'border-brand-500 bg-brand-600/10 text-brand-300'
                            : 'border-slate-700 text-slate-400 hover:border-slate-600'
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Incoterms habituales</label>
                  <p className="text-xs text-slate-500 mb-2">Los que más utilizas en tus operaciones</p>
                  <div className="flex flex-wrap gap-2">
                    {INCOTERMS.map(term => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => toggleItem(company.main_incoterms, term, setCompany, 'main_incoterms')}
                        className={clsx(
                          'text-xs px-3 py-1.5 rounded-full border font-mono transition-all',
                          company.main_incoterms.includes(term)
                            ? 'border-brand-500 bg-brand-600/10 text-brand-300'
                            : 'border-slate-700 text-slate-400 hover:border-slate-600'
                        )}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleStep1Next}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Continuar a ruta
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: First Route */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Define tu primera ruta de importación</h2>
                <p className="text-slate-400 text-sm mt-1">Agrega la ruta comercial que más necesitas monitorear.</p>
              </div>

              <div className="card p-6 space-y-5">
                <div>
                  <label className="label">Nombre de la ruta *</label>
                  <input
                    className="input"
                    placeholder="Ej. China-México Electrónicos, Vietnam-EE.UU. Textiles"
                    value={routeData.name}
                    onChange={e => setRouteData(p => ({ ...p, name: e.target.value }))}
                  />
                  <p className="text-xs text-slate-500 mt-1">Un nombre descriptivo que te ayude a identificar la ruta.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">País de origen *</label>
                    <select className="input" value={routeData.origin_country} onChange={e => setRouteData(p => ({ ...p, origin_country: e.target.value }))}>
                      <option value="">Seleccionar país</option>
                      {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">País de destino *</label>
                    <select className="input" value={routeData.destination_country} onChange={e => setRouteData(p => ({ ...p, destination_country: e.target.value }))}>
                      <option value="">Seleccionar país</option>
                      {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Puerto / Ciudad de origen</label>
                    <input
                      className="input"
                      placeholder="Ej. Shanghái, Shenzhen, Guangzhou"
                      value={routeData.port_of_origin}
                      onChange={e => setRouteData(p => ({ ...p, port_of_origin: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Puerto / Ciudad de destino</label>
                    <input
                      className="input"
                      placeholder="Ej. Manzanillo, Veracruz, Lázaro Cárdenas"
                      value={routeData.port_of_destination}
                      onChange={e => setRouteData(p => ({ ...p, port_of_destination: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Tipo de mercancía *</label>
                    <select className="input" value={routeData.cargo_type} onChange={e => setRouteData(p => ({ ...p, cargo_type: e.target.value }))}>
                      <option value="">Seleccionar tipo</option>
                      {CARGO_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Incoterm</label>
                    <select className="input" value={routeData.incoterm} onChange={e => setRouteData(p => ({ ...p, incoterm: e.target.value }))}>
                      <option value="">Seleccionar incoterm</option>
                      {INCOTERMS.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Modo de transporte *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 'maritimo', label: 'Marítimo', icon: '🚢' },
                      { value: 'aereo', label: 'Aéreo', icon: '✈️' },
                      { value: 'terrestre', label: 'Terrestre', icon: '🚛' },
                      { value: 'multimodal', label: 'Multimodal', icon: '🔄' },
                    ].map(({ value, label, icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setRouteData(p => ({ ...p, transport_mode: value }))}
                        className={clsx(
                          'flex flex-col items-center gap-1 p-3 rounded-lg border transition-all',
                          routeData.transport_mode === value
                            ? 'border-brand-500 bg-brand-600/10 text-white'
                            : 'border-slate-700 text-slate-400 hover:border-slate-600'
                        )}
                      >
                        <span className="text-xl">{icon}</span>
                        <span className="text-xs font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="btn-ghost flex items-center gap-2 px-4 py-2.5"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Atrás
                </button>
                <button
                  onClick={handleStep2Next}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Configurar análisis
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Ready */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-emerald-600/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-600/20">
                  <Check className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">¡Tu plataforma está lista!</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  Hemos configurado tu perfil y tu primera ruta de monitoreo. El análisis de riesgo estará disponible de inmediato desde el dashboard.
                </p>
              </div>

              <div className="card p-6">
                <h3 className="text-sm font-semibold text-white mb-4">Lo que puedes hacer ahora:</h3>
                <div className="space-y-3">
                  {[
                    { icon: Zap, title: 'Analizar riesgo de tu ruta', desc: 'Obtén un análisis geopolítico detallado con IA en segundos' },
                    { icon: Route, title: 'Agregar más rutas', desc: 'Monitorea múltiples rutas de importación/exportación' },
                    { icon: FileText, title: 'Generar reportes', desc: 'Exporta informes para due diligence y presentaciones ejecutivas' },
                    { icon: MapPin, title: 'Configurar alertas', desc: 'Recibe notificaciones cuando el riesgo de tus rutas cambie' },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                      <div className="w-8 h-8 bg-brand-600/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-brand-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{title}</p>
                        <p className="text-xs text-slate-500">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={handleFinish}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                Ir al Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
