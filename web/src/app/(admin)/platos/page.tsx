import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DishFormModal from './DishFormModal'
import { UtensilsCrossed, Flame, Layers } from 'lucide-react'
import { toggleActivoPlato, eliminarPlato } from './actions'

export const dynamic = 'force-dynamic'

export default async function PlatosPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (profile?.rol !== 'admin') redirect('/dashboard')

  const { data: platos } = await supabase
    .from('platos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Catálogo Maestro de Platos
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Administra las recetas, precios base y componentes separables disponibles en el comedor
          </p>
        </div>

        <DishFormModal />
      </div>

      {/* Grid de Platos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platos && platos.length > 0 ? (
          platos.map((plato) => (
            <div
              key={plato.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div>
                {/* Imagen del Plato */}
                <div className="h-44 bg-slate-950 relative overflow-hidden">
                  {plato.imagen_url ? (
                    <img
                      src={plato.imagen_url}
                      alt={plato.nombre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-700">
                      <UtensilsCrossed className="w-12 h-12" />
                    </div>
                  )}

                  <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-xs font-mono font-bold text-white">
                    {plato.codigo}
                  </div>

                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        plato.activo
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-rose-500/90 text-white'
                      }`}
                    >
                      {plato.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                {/* Detalles */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-white text-base leading-snug">{plato.nombre}</h3>
                    <span className="text-emerald-400 font-bold font-mono text-base shrink-0">
                      S/. {Number(plato.precio).toFixed(2)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                    {plato.descripcion || 'Sin descripción detallada.'}
                  </p>

                  {/* Componentes */}
                  <div className="mb-4">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                      <Layers className="w-3.5 h-3.5" /> Componentes desmarcables:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {plato.componentes.map((c, i) => (
                        <span
                          key={i}
                          className="bg-slate-950 border border-slate-800 text-slate-300 px-2 py-0.5 rounded-md text-[11px]"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {plato.calorias && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{plato.calorias} kcal</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="p-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
                <form
                  action={async () => {
                    'use server'
                    await toggleActivoPlato(plato.id, !plato.activo)
                  }}
                >
                  <button
                    type="submit"
                    className="text-xs font-semibold text-slate-400 hover:text-white transition"
                  >
                    {plato.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </form>

                <form
                  action={async () => {
                    'use server'
                    await eliminarPlato(plato.id)
                  }}
                >
                  <button
                    type="submit"
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
                  >
                    Eliminar
                  </button>
                </form>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-12 text-center bg-slate-900 rounded-2xl border border-slate-800">
            <UtensilsCrossed className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-white font-semibold text-sm">No hay platos registrados en el catálogo</h3>
            <p className="text-xs text-slate-400 mt-1">
              Haz clic en &quot;Nuevo Plato&quot; para dar de alta las opciones del comedor.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
