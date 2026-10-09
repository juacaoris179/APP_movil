import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MenuManager, { MenuItem } from './MenuManager'

export const dynamic = 'force-dynamic'

interface MenuPageProps {
  searchParams: {
    fecha?: string
  }
}

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  const canManagePlatos = profile?.rol === 'admin'
  const today = new Date().toISOString().split('T')[0]
  const fecha = searchParams.fecha || today

  // Obtener platos del menú para la fecha
  const { data: menuItems } = await supabase
    .from('menu_dia')
    .select('id, fecha, cantidad_preparada, platos(id, codigo, nombre, precio, calorias)')
    .eq('fecha', fecha)

  // Obtener platos activos del catálogo para asignar
  const { data: platosDisponibles } = await supabase
    .from('platos')
    .select('id, codigo, nombre, precio')
    .eq('activo', true)
    .order('nombre')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Menú del Día y Disponibilidad</h1>
        <p className="text-sm text-slate-400 mt-1">
          Planifica la oferta culinaria y actualiza la cantidad de raciones preparadas por fecha
        </p>
      </div>

      <MenuManager
        initialDate={fecha}
        menuItems={(menuItems as unknown as MenuItem[]) || []}
        availablePlatos={platosDisponibles || []}
        canManagePlatos={canManagePlatos}
      />
    </div>
  )
}
