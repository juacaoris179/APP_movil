'use client'

import { useState } from 'react'
import { Plus, X, Loader2, AlertCircle, UtensilsCrossed } from 'lucide-react'
import { crearPlato } from './actions'

export default function DishFormModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const res = await crearPlato(formData)

    setLoading(false)
    if (res?.error) {
      setError(res.error)
    } else {
      setIsOpen(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition shadow-lg shadow-emerald-900/20"
      >
        <Plus className="w-4 h-4" />
        <span>Nuevo Plato</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Registrar Plato en el Menú</h3>
                <p className="text-xs text-slate-400">
                  Agrega un nuevo ítem culinario con sus componentes separables
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 flex items-center gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                    Código Único
                  </label>
                  <input
                    name="codigo"
                    type="text"
                    required
                    placeholder="PL-006"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                    Precio Base (S/.)
                  </label>
                  <input
                    name="precio"
                    type="number"
                    step="0.10"
                    required
                    placeholder="11.50"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Nombre del Plato
                </label>
                <input
                  name="nombre"
                  type="text"
                  required
                  placeholder="Arroz Chaufa de Pollo Especial"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  rows={2}
                  placeholder="Arroz salteado con pollo, huevo revuelto, cebollita china y sillao oriental."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Componentes / Ingredientes Separables (separados por coma)
                </label>
                <input
                  name="componentes"
                  type="text"
                  required
                  placeholder="Arroz frito, Pollo, Huevo, Cebollita china, Wantán frito"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Los estudiantes podrán desmarcar cualquiera de estos componentes en la app.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                    Calorías Estimadas (kcal)
                  </label>
                  <input
                    name="calorias"
                    type="number"
                    placeholder="650"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                    URL de Imagen (Opcional)
                  </label>
                  <input
                    name="imagen_url"
                    type="url"
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{loading ? 'Guardando...' : 'Crear Plato'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
