'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BrainCircuit, Loader2, CheckCircle2 } from 'lucide-react'
import { generarPrediccionesParaFecha } from '../menu/actions'

interface SyncAIButtonProps {
  fecha: string
}

export default function SyncAIButton({ fecha }: SyncAIButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  async function handleSync() {
    setLoading(true)
    setStatusMsg(null)
    try {
      const res = await generarPrediccionesParaFecha(fecha)
      if (res?.success) {
        setStatusMsg(res.mensaje)
        router.refresh()
        setTimeout(() => setStatusMsg(null), 4000)
      } else {
        alert(res?.mensaje || 'No se pudieron generar predicciones.')
      }
    } catch (err: unknown) {
      const errorText = err instanceof Error ? err.message : String(err)
      alert(`Error al invocar motor IA: ${errorText}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {statusMsg && (
        <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {statusMsg}
        </span>
      )}
      <button
        onClick={handleSync}
        disabled={loading}
        title="Generar o actualizar estimación de producción con Machine Learning para esta fecha"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <BrainCircuit className="w-3.5 h-3.5" />
        )}
        <span>{loading ? 'Calculando...' : 'Calcular con IA'}</span>
      </button>
    </div>
  )
}
