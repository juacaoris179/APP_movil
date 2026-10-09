'use client'

import { useState } from 'react'
import {
  Clock,
  User,
  ChefHat,
  CheckCircle2,
  PackageCheck,
  Ban,
  Loader2,
} from 'lucide-react'
import { EstadoPedido, TamanoPorcion } from '@/types/database.types'
import { cambiarEstadoPedido } from './actions'

export interface PedidoItem {
  id: string
  numero: number
  hora_recojo: string
  porcion: TamanoPorcion
  componentes_excluidos: string[]
  estado: EstadoPedido
  total: number
  created_at: string
  profiles: {
    nombre: string
    codigo_estudiante: string | null
    carrera: string | null
  }
  menu_dia: {
    platos: {
      codigo: string
      nombre: string
    }
  }
}

interface OrdersKanbanProps {
  initialPedidos: PedidoItem[]
}

const ESTADOS: { key: EstadoPedido; label: string; badgeColor: string }[] = [
  { key: 'pendiente', label: 'Pendientes', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  { key: 'en_preparacion', label: 'En Preparación', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { key: 'listo', label: 'Listos para Recojo', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { key: 'entregado', label: 'Entregados y Cobrados', badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
]

export default function OrdersKanban({ initialPedidos }: OrdersKanbanProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [filterEstado, setFilterEstado] = useState<'todos' | EstadoPedido>('todos')

  async function handleAdvance(pedidoId: string, siguienteEstado: EstadoPedido) {
    setLoadingId(pedidoId)
    await cambiarEstadoPedido(pedidoId, siguienteEstado)
    setLoadingId(null)
  }

  const pedidosFiltrados = initialPedidos.filter((p) =>
    filterEstado === 'todos' ? true : p.estado === filterEstado
  )

  return (
    <div className="space-y-6">
      {/* Selector de filtro rápido */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilterEstado('todos')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            filterEstado === 'todos'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Todos ({initialPedidos.length})
        </button>
        {ESTADOS.map((e) => {
          const count = initialPedidos.filter((p) => p.estado === e.key).length
          return (
            <button
              key={e.key}
              onClick={() => setFilterEstado(e.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                filterEstado === e.key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {e.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Grid de Pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {pedidosFiltrados.length > 0 ? (
          pedidosFiltrados.map((p) => {
            const isBusy = loadingId === p.id

            return (
              <div
                key={p.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
              >
                <div>
                  {/* Header de la tarjeta */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-950 text-emerald-400 border border-slate-800">
                      #{p.numero}
                    </span>

                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        p.estado === 'pendiente'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : p.estado === 'en_preparacion'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          : p.estado === 'listo'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : p.estado === 'entregado'
                          ? 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}
                    >
                      {p.estado}
                    </span>
                  </div>

                  {/* Plato y Porción */}
                  <h3 className="font-bold text-white text-base mb-1">
                    {p.menu_dia.platos.nombre}
                  </h3>

                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        p.porcion === 'pequena'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : p.porcion === 'regular'
                          ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                          : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      }`}
                    >
                      Porción: {p.porcion.toUpperCase()}
                    </span>

                    <span className="text-xs text-slate-400 font-mono">
                      Total: S/. {Number(p.total).toFixed(2)}
                    </span>
                  </div>

                  {/* Componentes Excluidos */}
                  {p.componentes_excluidos && p.componentes_excluidos.length > 0 && (
                    <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <p className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5" /> Sin los siguientes ingredientes:
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {p.componentes_excluidos.map((comp, idx) => (
                          <span
                            key={idx}
                            className="bg-rose-950/80 text-rose-300 text-[10px] px-1.5 py-0.5 rounded font-medium"
                          >
                            {comp}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Datos del Estudiante y Hora de Recojo */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{p.profiles.nombre}</span>
                      {p.profiles.codigo_estudiante && (
                        <span className="font-mono text-slate-500">
                          ({p.profiles.codigo_estudiante})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Hora de recojo reservada: <strong className="text-white">{p.hora_recojo}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Acciones de Flujo de Cocina */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  {p.estado === 'pendiente' && (
                    <button
                      onClick={() => handleAdvance(p.id, 'en_preparacion')}
                      disabled={isBusy}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChefHat className="w-3.5 h-3.5" />}
                      <span>Empezar a Preparar</span>
                    </button>
                  )}

                  {p.estado === 'en_preparacion' && (
                    <button
                      onClick={() => handleAdvance(p.id, 'listo')}
                      disabled={isBusy}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                      <span>Marcar como Listo</span>
                    </button>
                  )}

                  {p.estado === 'listo' && (
                    <button
                      onClick={() => handleAdvance(p.id, 'entregado')}
                      disabled={isBusy}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition"
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PackageCheck className="w-3.5 h-3.5" />}
                      <span>Entregar y Cobrar</span>
                    </button>
                  )}

                  {p.estado === 'entregado' && (
                    <span className="w-full text-center text-xs text-slate-500 font-semibold py-1">
                      ✓ Pedido completado y cobrado
                    </span>
                  )}

                  {p.estado === 'cancelado' && (
                    <span className="w-full text-center text-xs text-rose-400 font-semibold py-1">
                      ✕ Pedido cancelado
                    </span>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-full p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <ChefHat className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h4 className="text-white text-sm font-semibold">No hay pedidos con el filtro seleccionado</h4>
            <p className="text-xs text-slate-400 mt-1">
              Los pedidos realizados desde la app aparecerán aquí para su preparación en cocina.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
