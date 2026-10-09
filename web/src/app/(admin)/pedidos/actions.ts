'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { EstadoPedido } from '@/types/database.types'

export async function cambiarEstadoPedido(pedidoId: string, nuevoEstado: EstadoPedido) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('pedidos')
    .update({ estado: nuevoEstado })
    .eq('id', pedidoId)

  if (error) {
    return { error: `Error al actualizar estado del pedido: ${error.message}` }
  }

  revalidatePath('/pedidos')
  revalidatePath('/dashboard')
  return { success: true }
}
