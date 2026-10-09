'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function agregarPlatoAlMenu(fecha: string, platoId: string, cantidad: number) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase.from('menu_dia').insert({
    fecha,
    plato_id: platoId,
    cantidad_preparada: cantidad,
  })

  if (error) {
    if (error.code === '23505') {
      return { error: 'Este plato ya está asignado al menú de esta fecha.' }
    }
    return { error: error.message }
  }

  revalidatePath('/menu')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function actualizarCantidadPreparada(menuId: string, nuevaCantidad: number) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase
    .from('menu_dia')
    .update({ cantidad_preparada: nuevaCantidad })
    .eq('id', menuId)

  if (error) return { error: error.message }

  revalidatePath('/menu')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function eliminarDelMenu(menuId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { error } = await supabase.from('menu_dia').delete().eq('id', menuId)
  if (error) return { error: error.message }

  revalidatePath('/menu')
  revalidatePath('/dashboard')
  return { success: true }
}
