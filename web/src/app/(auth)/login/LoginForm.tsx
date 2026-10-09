'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { loginAction } from './actions'
import { Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/60 text-white font-medium rounded-xl transition shadow-lg shadow-emerald-900/20 active:scale-[0.99]"
    >
      {pending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Verificando credenciales...</span>
        </>
      ) : (
        <>
          <span>Ingresar al Portal</span>
          <ArrowRight className="w-4 h-4" />
        </>
      )}
    </button>
  )
}

export default function LoginForm() {
  const [state, formAction] = useFormState(loginAction, null)

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="flex items-center gap-3 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
          Correo Electrónico
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Mail className="w-4 h-4" />
          </div>
          <input
            name="email"
            type="email"
            required
            placeholder="admin@campussabor.edu.pe"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-white placeholder-slate-500 text-sm outline-none transition"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
          Contraseña
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Lock className="w-4 h-4" />
          </div>
          <input
            name="password"
            type="password"
            required
            placeholder="••••••••••••"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-white placeholder-slate-500 text-sm outline-none transition"
          />
        </div>
      </div>

      <div className="pt-2">
        <SubmitButton />
      </div>
    </form>
  )
}
