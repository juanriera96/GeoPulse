import { Route, Bell, FileText, Settings, Construction } from 'lucide-react'

function ComingSoon({ icon: Icon, title, description }) {
  return (
      <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                              <Icon className="w-8 h-8 text-slate-500" />
                                      </div>
                                              <div className="flex items-center gap-2 mb-3">
                                                        <Construction className="w-4 h-4 text-amber-400" />
                                                                  <span className="text-amber-400 text-sm font-medium">En construccion</span>
                                                                          </div>
                                                                                  <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
                                                                                          <p className="text-slate-400 max-w-md">{description}</p>
                                                                                                </div>
                                                                                                    </div>
                                                                                                      )
                                                                                                      }

                                                                                                      export function RoutesPage() {
                                                                                                        return <ComingSoon icon={Route} title="Gestion de Rutas" description="Pronto podras crear, editar y analizar todas tus rutas de importacion con un solo click." />
                                                                                                        }

                                                                                                        export function AlertsPage() {
                                                                                                          return <ComingSoon icon={Bell} title="Centro de Alertas" description="Aqui apareceran todas las alertas automaticas sobre eventos geopoliticos que afectan tus rutas." />
                                                                                                          }

                                                                                                          export function ReportsPage() {
                                                                                                            return <ComingSoon icon={FileText} title="Reportes PDF" description="Reportes ejecutivos semanales generados automaticamente con IA. Proximamente disponible." />
                                                                                                            }

                                                                                                            export function SettingsPage() {
                                                                                                              return <ComingSoon icon={Settings} title="Configuracion" description="Administra tu cuenta, empresa, integraciones y preferencias de notificacion." />
                                                                                                              }