import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const OLD_TO_NEW: Record<string, string> = {
  '/vehicles': '/dashboard/vehicles',
  '/drivers': '/dashboard/drivers',
  '/inspections': '/dashboard/inspections',
  '/admin': '/dashboard/admin',
  '/control-panel': '/dashboard/control-panel',
  '/home': '/dashboard/home',
  '/about': '/dashboard/about',
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const redirectTo = OLD_TO_NEW[pathname]
  if (redirectTo) {
    const url = request.nextUrl.clone()
    url.pathname = redirectTo
    return NextResponse.redirect(url)
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
