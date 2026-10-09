'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const DishSchema = z.object({
  codigo: z.string().min(2, 'El código debe tener al menos 2 caracteres'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  descripcion: z.string().optional(),
  componentes: z.array(z.string()).min(1, 'Debe incluir al menos un componente/ingrediente'),
  precio: z.number().positive('El precio debe ser mayor a 0'),
  calorias: z.number().nonnegative().optional(),
  imagen_url: z.string().url().optional().or(z.literal('')),
})

async function checkAdminAuth() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (profile?.rol !== 'admin') {
    throw new Error('Solo los administradores pueden gestionar el catálogo de platos.')
  }
}

export async function crearPlato(formData: FormData) {
  await checkAdminAuth()

  const codigo = formData.get('codigo') as string
  const nombre = formData.get('nombre') as string
  const descripcion = (formData.get('descripcion') as string) || ''
  const componentesRaw = (formData.get('componentes') as string) || ''
  const precio = parseFloat(formData.get('precio') as string)
  const calorias = formData.get('calorias') ? parseInt(formData.get('calorias') as string) : undefined
  const imagen_url = (formData.get('imagen_url') as string) || ''

  const componentes = componentesRaw
    .split(',')
    .map((c) => c.trim())
    .filter((c) => c.length > 0)

  const validation = DishSchema.safeParse({
    codigo,
    nombre,
    descripcion,
    componentes,
    precio,
    calorias,
    imagen_url,
  })

  if (!validation.success) {
    return { error: validation.error.errors[0].message }
  }

  const supabase = createClient()
  const { error } = await supabase.from('platos').insert({
    codigo: validation.data.codigo,
    nombre: validation.data.nombre,
    descripcion: validation.data.descripcion || null,
    componentes: validation.data.componentes,
    precio: validation.data.precio,
    calorias: validation.data.calorias || null,
    imagen_url: validation.data.imagen_url || null,
    activo: true,
  })

  if (error) {
    return { error: `Error al crear plato: ${error.message}` }
  }

  revalidatePath('/platos')
  return { success: true }
}

export async function toggleActivoPlato(id: string, activo: boolean) {
  await checkAdminAuth()
  const supabase = createClient()
  const { error } = await supabase.from('platos').update({ activo }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/platos')
  return { success: true }
}

export async function eliminarPlato(id: string) {
  await checkAdminAuth()
  const supabase = createClient()
  const { error } = await supabase.from('platos').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/platos')
  return { success: true }
}
