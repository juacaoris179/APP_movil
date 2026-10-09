import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceRoleKey) {
  // Advertencia formativa para desarrollo si no se ha configurado .env.local todavía
  console.warn(
    '[ADVERTENCIA] SUPABASE_SERVICE_ROLE_KEY no está definida. Las Server Actions que requieren privilegios administrativos fallarán.'
  )
}

export const supabaseAdmin = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceRoleKey || 'placeholder-service-role-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
