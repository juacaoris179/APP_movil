import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import UserTable from './UserTable'
import CreateUserModal from './CreateUserModal'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar que sea admin
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (currentProfile?.rol !== 'admin') {
    redirect('/dashboard')
  }

  // Obtener lista completa de perfiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nombre, codigo_estudiante, carrera, rol, activo, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Gestión de Usuarios y Personal
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Administra los roles de estudiantes, personal de cocina y supervisores de comedor
          </p>
        </div>

        <CreateUserModal />
      </div>

      {/* Lista de Usuarios */}
      <UserTable initialUsers={profiles || []} currentUserId={user.id} />
    </div>
  )
}
