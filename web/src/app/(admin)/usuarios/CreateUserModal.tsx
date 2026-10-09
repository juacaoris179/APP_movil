'use client'

import { useState } from 'react'
import { Plus, X, Loader2, AlertCircle, ShieldCheck } from 'lucide-react'
import { crearUsuarioStaff } from './actions'

export default function CreateUserModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await crearUsuarioStaff(formData)

    setLoading(false)
    if (result?.error) {
      setError(result.error)
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
        <span>Nuevo Personal (Cocina / Admin)</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Registrar Miembro de Staff</h3>
                <p className="text-xs text-slate-400">
                  Crea una cuenta verificada para el equipo de cocina o administración
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
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Nombre Completo
                </label>
                <input
                  name="nombre"
                  type="text"
                  required
                  placeholder="Ej: Carmen Salinas"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Correo Electrónico
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="cocina.turno1@campussabor.edu.pe"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Contraseña Inicial
                </label>
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Rol Asignado
                </label>
                <select
                  name="rol"
                  defaultValue="cocina"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-emerald-500 focus:outline-none"
                >
                  <option value="cocina">Cocina (Visualiza demanda, menús y gestiona pedidos)</option>
                  <option value="admin">Administrador (Control total del sistema)</option>
                </select>
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
                  <span>{loading ? 'Creando cuenta...' : 'Crear Usuario'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
