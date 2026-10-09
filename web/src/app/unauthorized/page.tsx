import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-5 border border-amber-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Acceso Exclusivo de Personal</h1>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Esta plataforma web está reservada exclusivamente para el equipo de cocina y administradores de <strong>Campus Sabor</strong>.
        </p>
        <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-emerald-400 mb-1">¿Eres estudiante?</p>
          <p className="text-xs text-slate-300">
            Descarga e inicia sesión en la <strong>App Android Campus Sabor</strong> para ver el menú del día, elegir tus porciones y gestionar tus pedidos.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center justify-center w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-xl transition-colors"
        >
          Volver a Iniciar Sesión con otra cuenta
        </Link>
      </div>
    </div>
  )
}
