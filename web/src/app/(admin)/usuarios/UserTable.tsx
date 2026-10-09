'use client'

import { useState } from 'react'
import { Search, Trash2, Power, Loader2 } from 'lucide-react'
import { RolUsuario } from '@/types/database.types'
import { cambiarRolUsuario, toggleActivoUsuario, eliminarUsuario } from './actions'

interface ProfileItem {
  id: string
  nombre: string
  codigo_estudiante: string | null
  carrera: string | null
  rol: RolUsuario
  activo: boolean
  created_at: string
}

interface UserTableProps {
  initialUsers: ProfileItem[]
  currentUserId: string
}

export default function UserTable({ initialUsers, currentUserId }: UserTableProps) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'todos' | RolUsuario>('todos')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filteredUsers = initialUsers.filter((user) => {
    const matchesSearch =
      user.nombre.toLowerCase().includes(search.toLowerCase()) ||
      (user.codigo_estudiante && user.codigo_estudiante.toLowerCase().includes(search.toLowerCase())) ||
      (user.carrera && user.carrera.toLowerCase().includes(search.toLowerCase()))

    const matchesRole = roleFilter === 'todos' || user.rol === roleFilter
    return matchesSearch && matchesRole
  })

  async function handleRoleChange(userId: string, newRole: RolUsuario) {
    if (userId === currentUserId) {
      alert('No puedes cambiar tu propio rol de administrador.')
      return
    }
    setLoadingId(userId)
    await cambiarRolUsuario(userId, newRole)
    setLoadingId(null)
  }

  async function handleToggleActivo(userId: string, currentState: boolean) {
    if (userId === currentUserId) {
      alert('No puedes desactivar tu propia cuenta de administrador.')
      return
    }
    setLoadingId(userId)
    await toggleActivoUsuario(userId, !currentState)
    setLoadingId(null)
  }

  async function handleDelete(userId: string, userName: string) {
    if (userId === currentUserId) {
      alert('No puedes eliminar tu propia cuenta de administrador.')
      return
    }
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente a "${userName}"?`)) {
      setLoadingId(userId)
      await eliminarUsuario(userId)
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, código o carrera..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['todos', 'estudiante', 'cocina', 'admin'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition ${
                roleFilter === r
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Usuario</th>
                <th className="py-3.5 px-6">Código / Carrera</th>
                <th className="py-3.5 px-6">Rol del Sistema</th>
                <th className="py-3.5 px-6">Estado</th>
                <th className="py-3.5 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.map((u) => {
                const isCurrent = u.id === currentUserId
                const isBusy = loadingId === u.id

                return (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                          {u.nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-white flex items-center gap-1.5">
                            {u.nombre}
                            {isCurrent && (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                Tú
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono">ID: {u.id.slice(0, 8)}...</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-mono text-slate-300">{u.codigo_estudiante || '—'}</p>
                      <p className="text-slate-500 text-[11px]">{u.carrera || 'Personal Institucional'}</p>
                    </td>

                    <td className="py-4 px-6">
                      <select
                        value={u.rol}
                        disabled={isCurrent || isBusy}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as RolUsuario)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border focus:outline-none transition ${
                          u.rol === 'admin'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            : u.rol === 'cocina'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        <option value="estudiante" className="bg-slate-900 text-white">Estudiante</option>
                        <option value="cocina" className="bg-slate-900 text-white">Cocina</option>
                        <option value="admin" className="bg-slate-900 text-white">Admin</option>
                      </select>
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          u.activo
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isBusy ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        ) : (
                          <>
                            <button
                              onClick={() => handleToggleActivo(u.id, u.activo)}
                              disabled={isCurrent}
                              title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                              className={`p-1.5 rounded-lg border transition ${
                                u.activo
                                  ? 'text-amber-400 border-amber-500/20 hover:bg-amber-500/10'
                                  : 'text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/10'
                              } disabled:opacity-40`}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDelete(u.id, u.nombre)}
                              disabled={isCurrent}
                              title="Eliminar usuario"
                              className="p-1.5 rounded-lg text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 transition disabled:opacity-40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
