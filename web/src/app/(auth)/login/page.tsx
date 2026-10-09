import LoginForm from './LoginForm'
import { Utensils } from 'lucide-react'

export const metadata = {
  title: 'Iniciar Sesión | Campus Sabor - Portal Administrativo',
  description: 'Acceso para el equipo de cocina y administradores del comedor universitario Campus Sabor',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-emerald-500 selection:text-white">
      {/* Fondo con destello sutil */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Cabecera / Marca */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-xl shadow-emerald-500/20 mb-4 border border-emerald-400/30">
            <Utensils className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            Campus Sabor
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Staff
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestión de cocina, pedidos y reducción de desperdicio alimentario
          </p>
        </div>

        {/* Tarjeta del formulario */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Bienvenido de vuelta</h2>
            <p className="text-xs text-slate-400">
              Ingresa tus credenciales asignadas para administrar la plataforma
            </p>
          </div>

          <LoginForm />

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500">
              ¿Eres nuevo en el equipo de cocina? Contacta al administrador para que registre tu cuenta.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
