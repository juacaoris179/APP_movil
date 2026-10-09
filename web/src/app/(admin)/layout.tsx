import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import { RolUsuario } from '@/types/database.types'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('nombre, rol, activo')
    .eq('id', user.id)
    .single()

  if (profile?.rol === 'estudiante') {
    redirect('/unauthorized')
  }

  const userRol = (profile?.rol || 'cocina') as RolUsuario
  const userName = profile?.nombre || 'Usuario Staff'
  const userEmail = user.email || 'usuario@campussabor.edu.pe'

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500 selection:text-white">
      <Sidebar userEmail={userEmail} userName={userName} userRol={userRol} />
      <main className="flex-1 min-w-0 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
