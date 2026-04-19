import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refresh session — use getUser() not getSession() to validate JWT against Supabase server
  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public routes that don't need auth
  const publicRoutes = ['/', '/login', '/search', '/auth/callback']
  const isPublicRoute =
    publicRoutes.includes(pathname) ||
    pathname.startsWith('/categories/') ||
    pathname.startsWith('/products/') ||
    pathname.startsWith('/auth/')

  if (isPublicRoute) {
    return response
  }

  // Protected routes
  const isCheckout = pathname === '/checkout'
  const isOrders = pathname.startsWith('/orders')
  const isVendor = pathname.startsWith('/vendor')
  const isProvider = pathname.startsWith('/provider')
  const isAdmin = pathname.startsWith('/admin')
  // Customer bookings (service bookings) need auth but services landing is public
  const isServiceBooking =
    pathname.startsWith('/services/book') ||
    pathname.startsWith('/services/bookings')

  if (!user) {
    // Not authenticated — redirect to login with return path
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Fetch user role from DB
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = profile?.role as string | undefined

  // Customer-level protected routes
  const isAccount = pathname.startsWith('/account')
  const isWishlist = pathname === '/wishlist'
  const isNotifications = pathname === '/notifications'
  const isRefer = pathname === '/refer'

  if (
    isCheckout || isOrders || isAccount || isWishlist ||
    isNotifications || isRefer || isServiceBooking
  ) {
    // Any authenticated user can access these
    return response
  }

  // Vendor routes
  if (isVendor) {
    if (role !== 'vendor' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  // Provider routes — provider OR admin
  if (isProvider) {
    if (role !== 'provider' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  // Admin routes
  if (isAdmin) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/webhooks (webhook routes, verified separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)',
  ],
}
