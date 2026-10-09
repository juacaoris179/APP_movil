'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Plus, Trash2, Check, Loader2, Utensils, AlertCircle } from 'lucide-react'
import { agregarPlatoAlMenu, actualizarCantidadPreparada, eliminarDelMenu } from './actions'

export interface PlatoOption {
  id: string
  codigo: string
  nombre: string
  precio: number
}

export interface MenuItem {
  id: string
  fecha: string
  cantidad_preparada: number
  platos: {
    id: string
    codigo: string
    nombre: string
    precio: number
    calorias: number | null
  }
}

interface MenuManagerProps {
  initialDate: string
  menuItems: MenuItem[]
  availablePlatos: PlatoOption[]
  canManagePlatos: boolean
}

export default function MenuManager({
  initialDate,
  menuItems,
  availablePlatos,
  canManagePlatos,
}: MenuManagerProps) {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [selectedPlatoId, setSelectedPlatoId] = useState(availablePlatos[0]?.id || '')
  const [cantidad, setCantidad] = useState(100)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editQty, setEditQty] = useState<number>(0)

  function handleDateChange(newDate: string) {
    setSelectedDate(newDate)
    router.push(`/menu?fecha=${newDate}`)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPlatoId) return
    setLoading(true)
    setError(null)

    const res = await agregarPlatoAlMenu(selectedDate, selectedPlatoId, cantidad)
    setLoading(false)
    if (res?.error) {
      setError(res.error)
    }
  }

  async function handleSaveQty(menuId: string) {
    setLoading(true)
    await actualizarCantidadPreparada(menuId, editQty)
    setEditingId(null)
    setLoading(false)
  }

  async function handleDelete(menuId: string) {
    if (confirm('¿Quitar este plato de la programación del día?')) {
      setLoading(true)
      await eliminarDelMenu(menuId)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Selector de Fecha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Fecha de Programación</h2>
            <p className="text-xs text-slate-400">Selecciona el día para organizar o ajustar las porciones</p>
          </div>
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Formulario para Asignar Plato (Solo Admin) */}
      {canManagePlatos && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            Asignar Plato a la Fecha
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Selecciona un plato del catálogo maestro y la cantidad de porciones iniciales preparadas
          </p>

          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <select
                value={selectedPlatoId}
                onChange={(e) => setSelectedPlatoId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
              >
                {availablePlatos.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.codigo}] {p.nombre} — S/. {Number(p.precio).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(parseInt(e.target.value) || 0)}
                placeholder="Cantidad"
                className="w-28 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:border-emerald-500 focus:outline-none"
              />

              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Asignar</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Platos Programados para la Fecha */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">Platos del Menú ({menuItems.length})</h3>
          <p className="text-xs text-slate-400">
            La cocina puede actualizar en vivo la cantidad preparada para reflejar la disponibilidad
          </p>
        </div>

        {menuItems.length > 0 ? (
          <div className="divide-y divide-slate-800/60">
            {menuItems.map((item) => (
              <div
                key={item.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                    <Utensils className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-400">
                        {item.platos.codigo}
                      </span>
                      <h4 className="text-sm font-semibold text-white">{item.platos.nombre}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Precio base: <span className="text-emerald-400 font-bold">S/. {Number(item.platos.precio).toFixed(2)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Edición de Cantidad Preparada */}
                  <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-400">Preparado:</span>
                    {editingId === item.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={editQty}
                          onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-xs text-white"
                        />
                        <button
                          onClick={() => handleSaveQty(item.id)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(item.id)
                          setEditQty(item.cantidad_preparada)
                        }}
                        className="text-xs font-bold text-white hover:text-emerald-400 flex items-center gap-1"
                        title="Clic para editar cantidad"
                      >
                        <span>{item.cantidad_preparada} porciones</span>
                      </button>
                    )}
                  </div>

                  {canManagePlatos && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition"
                      title="Quitar plato del menú"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h4 className="text-white text-sm font-semibold">No hay platos configurados para esta fecha</h4>
            <p className="text-xs text-slate-400 mt-1">
              Asigna los platos que el comedor preparará para este almuerzo.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
