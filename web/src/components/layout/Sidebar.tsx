import Link from 'next/link'
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  UtensilsCrossed,
  Users,
  LogOut,
  ChefHat,
} from 'lucide-react'
import { logoutAction } from '@/app/(auth)/login/actions'
import { RolUsuario } from '@/types/database.types'

interface SidebarProps {
  userEmail: string
  userName: string
  userRol: RolUsuario
}

export default function Sidebar({ userEmail, userName, userRol }: SidebarProps) {
  const navItems = [
    {
      name: 'Dashboard (Demanda)',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['cocina', 'admin'],
    },
    {
      name: 'Pedidos en Cocina',
      href: '/pedidos',
      icon: ClipboardList,
      roles: ['cocina', 'admin'],
    },
    {
      name: 'Menú del Día',
      href: '/menu',
      icon: CalendarDays,
      roles: ['cocina', 'admin'],
    },
    {
      name: 'Catálogo de Platos',
      href: '/platos',
      icon: UtensilsCrossed,
      roles: ['admin'],
    },
    {
      name: 'Usuarios y Personal',
      href: '/usuarios',
      icon: Users,
      roles: ['admin'],
    },
  ]

  const visibleItems = navItems.filter((item) => item.roles.includes(userRol))

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
          <ChefHat className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">Campus Sabor</h1>
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            {userRol === 'admin' ? 'Administrador' : 'Equipo Cocina'}
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {visibleItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 text-sm font-medium transition"
            >
              <Icon className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Footer & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{userName}</p>
            <p className="text-[11px] text-slate-400 truncate">{userEmail}</p>
          </div>
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl border border-rose-500/20 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
