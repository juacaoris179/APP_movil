'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const LoginSchema = z.object({
  email: z.string().email('Ingresa un correo institucional o corporativo válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
})

export async function loginAction(prevState: { error?: string } | null, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const validation = LoginSchema.safeParse({ email, password })
  if (!validation.success) {
    return { error: validation.error.errors[0].message }
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Credenciales inválidas o usuario no registrado.' }
  }

  // Verificar perfil y rol
  if (data?.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol, activo')
      .eq('id', data.user.id)
      .single()

    if (profile && !profile.activo) {
      await supabase.auth.signOut()
      return { error: 'Esta cuenta ha sido desactivada por administración.' }
    }

    if (profile?.rol === 'estudiante') {
      redirect('/unauthorized')
    }
  }

  redirect('/dashboard')
}

export async function logoutAction() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
