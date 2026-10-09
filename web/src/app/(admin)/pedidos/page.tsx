import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrdersKanban, { PedidoItem } from './OrdersKanban'

export const dynamic = 'force-dynamic'

export default async function PedidosPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  // Consultar pedidos del día
  const { data: pedidos } = await supabase
    .from('pedidos')
    .select(
      `
      id,
      numero,
      hora_recojo,
      porcion,
      componentes_excluidos,
      estado,
      total,
      created_at,
      profiles (
        nombre,
        codigo_estudiante,
        carrera
      ),
      menu_dia (
        platos (
          codigo,
          nombre
        )
      )
    `
    )
    .eq('fecha', today)
    .order('hora_recojo', { ascending: true })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Cola de Pedidos del Comedor</h1>
        <p className="text-sm text-slate-400 mt-1">
          Flujo de preparación en cocina y despacho en caja para el almuerzo de hoy
        </p>
      </div>

      <OrdersKanban initialPedidos={(pedidos as unknown as PedidoItem[]) || []} />
    </div>
  )
}
