import { createClient } from '@/lib/supabase/server'
import {
  TrendingUp,
  Utensils,
  DollarSign,
  PieChart,
  Calendar,
  Sparkles,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  // Consultar la vista de demanda agregada
  const { data: demanda } = await supabase
    .from('demanda_dia')
    .select('*')
    .eq('fecha', today)

  // Calcular métricas
  const totalPedidos = demanda?.reduce((acc, curr) => acc + (curr.total_pedidos || 0), 0) || 0
  const totalRecaudacion =
    demanda?.reduce((acc, curr) => acc + Number(curr.total_estimado_recaudo || 0), 0) || 0

  const pedidosPorcion = {
    pequena: demanda?.filter((d) => d.porcion === 'pequena').reduce((acc, c) => acc + (c.total_pedidos || 0), 0) || 0,
    regular: demanda?.filter((d) => d.porcion === 'regular').reduce((acc, c) => acc + (c.total_pedidos || 0), 0) || 0,
    grande: demanda?.filter((d) => d.porcion === 'grande').reduce((acc, c) => acc + (c.total_pedidos || 0), 0) || 0,
  }

  // Estimación de desperdicio ahorrado por raciones pequeñas (25% menos por ración pequeña)
  const ahorroPorcionesKg = (pedidosPorcion.pequena * 0.12).toFixed(1) // ~120g de comida ahorrada por ración pequeña

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Demanda del Comedor en Tiempo Real
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-400" />
            Almuerzo del día: <span className="font-semibold text-slate-200">{today}</span>
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Sparkles className="w-4 h-4" />
          <span>Vista Reactiva de Cocina</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Reservas
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{totalPedidos}</p>
          <p className="text-xs text-slate-400 mt-1">Platos solicitados anticipadamente</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Recaudo Estimado
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-emerald-400">S/. {totalRecaudacion.toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">Cobro en caja al recoger</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Raciones Pequeñas
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-400">{pedidosPorcion.pequena}</p>
          <p className="text-xs text-slate-400 mt-1">
            {totalPedidos > 0
              ? `${Math.round((pedidosPorcion.pequena / totalPedidos) * 100)}% del total pedido`
              : 'Sin pedidos aún'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Comida Ahorrada
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold text-teal-300">~{ahorroPorcionesKg} kg</p>
          <p className="text-xs text-slate-400 mt-1">Desperdicio prevenido hoy</p>
        </div>
      </div>

      {/* Desglose de Porciones por Plato (Para el Jefe de Cocina) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Desglose de Producción para Cocina</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Consolidación directa de la vista PostgreSQL <code className="text-emerald-400">demanda_dia</code>
            </p>
          </div>
        </div>

        {demanda && demanda.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-6">Código</th>
                  <th className="py-3 px-6">Plato</th>
                  <th className="py-3 px-6">Tamaño de Porción</th>
                  <th className="py-3 px-6 text-center">Cantidad Solicitada</th>
                  <th className="py-3 px-6 text-right">Subtotal Estimado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {demanda.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-mono text-xs text-slate-400">
                      {item.plato_codigo}
                    </td>
                    <td className="py-4 px-6 font-medium text-white">{item.plato_nombre}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.porcion === 'pequena'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : item.porcion === 'regular'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {item.porcion === 'pequena'
                          ? 'Pequeña (0.75×)'
                          : item.porcion === 'regular'
                          ? 'Regular (1.00×)'
                          : 'Grande (1.25×)'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center font-bold text-white text-base">
                      {item.total_pedidos}
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-slate-300">
                      S/. {Number(item.total_estimado_recaudo || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Utensils className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No hay pedidos registrados para hoy</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Asegúrate de programar los platos en el <strong>Menú del Día</strong> para que los estudiantes puedan armar sus pedidos desde la App Android.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
