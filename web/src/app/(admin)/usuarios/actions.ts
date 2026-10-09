'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { z } from 'zod'
import { RolUsuario } from '@/types/database.types'

const CreateStaffSchema = z.object({
  email: z.string().email('Correo electrónico no válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  rol: z.enum(['cocina', 'admin']),
})

// Helper para validar que quien ejecuta la acción sea Administrador
async function checkAdminAuth() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No autenticado')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (profile?.rol !== 'admin') {
    throw new Error('Permiso denegado: solo los administradores pueden gestionar usuarios.')
  }

  return user
}

export async function crearUsuarioStaff(formData: FormData) {
  await checkAdminAuth()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nombre = formData.get('nombre') as string
  const rol = formData.get('rol') as RolUsuario

  const validation = CreateStaffSchema.safeParse({ email, password, nombre, rol })
  if (!validation.success) {
    return { error: validation.error.errors[0].message }
  }

  // 1. Crear el usuario en auth.users mediante supabaseAdmin
  const { data: createdAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Confirmado inmediatamente por el admin
    user_metadata: {
      nombre,
    },
  })

  if (authError) {
    return { error: `Error creando usuario en Auth: ${authError.message}` }
  }

  // 2. El trigger `handle_new_user` crea el perfil con rol 'estudiante'.
  // Lo actualizamos inmediatamente a 'cocina' o 'admin' usando supabaseAdmin.
  if (createdAuthUser?.user) {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        rol: rol,
        nombre: nombre,
      })
      .eq('id', createdAuthUser.user.id)

    if (profileError) {
      return { error: `Error asignando rol al perfil: ${profileError.message}` }
    }
  }

  revalidatePath('/usuarios')
  return { success: true }
}

export async function cambiarRolUsuario(userId: string, nuevoRol: RolUsuario) {
  await checkAdminAuth()

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ rol: nuevoRol })
    .eq('id', userId)

  if (error) {
    return { error: `Error al actualizar rol: ${error.message}` }
  }

  revalidatePath('/usuarios')
  return { success: true }
}

export async function toggleActivoUsuario(userId: string, nuevoEstado: boolean) {
  await checkAdminAuth()

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ activo: nuevoEstado })
    .eq('id', userId)

  if (error) {
    return { error: `Error al cambiar estado: ${error.message}` }
  }

  revalidatePath('/usuarios')
  return { success: true }
}

export async function eliminarUsuario(userId: string) {
  await checkAdminAuth()

  // Eliminar de auth.users (la FK con CASCADE eliminará el perfil automáticamente)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

  if (error) {
    return { error: `Error al eliminar usuario: ${error.message}` }
  }

  revalidatePath('/usuarios')
  return { success: true }
}
