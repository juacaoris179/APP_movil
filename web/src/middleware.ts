import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Si aún no están configuradas las variables de entorno, permitir renderizar páginas para no romper la build
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isPublicRoute =
    pathname === '/login' ||
    pathname === '/unauthorized' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'

  // 1. Si no está autenticado y quiere ingresar a una ruta protegida
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Si está autenticado
  if (user) {
    // Si intenta ir al login estando ya autenticado
    if (pathname === '/login') {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Comprobar rol de usuario en perfiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('rol, activo')
      .eq('id', user.id)
      .single()

    // Si la cuenta fue desactivada por administración
    if (profile && !profile.activo) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'cuenta_inactiva')
      return NextResponse.redirect(url)
    }

    // Los estudiantes no tienen acceso a la web administrativa (deben usar la App Android)
    if (profile?.rol === 'estudiante') {
      if (pathname !== '/unauthorized') {
        const url = request.nextUrl.clone()
        url.pathname = '/unauthorized'
        return NextResponse.redirect(url)
      }
    }

    // Si el rol es cocina y pretende entrar a gestión de usuarios
    if (profile?.rol === 'cocina' && pathname.startsWith('/usuarios')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
