import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Debug: log JWT_SECRET presence in Edge Runtime
console.log('[proxy.ts] process.env.JWT_SECRET exists:', !!process.env.JWT_SECRET)
console.log('[proxy.ts] JWT_SECRET first 10 chars:', process.env.JWT_SECRET?.slice(0, 10))

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'development-secret-min-32-characters-long'
)

const ACCESS_TOKEN_COOKIE = 'trafi_access_token'

// Public routes that don't require authentication
const publicRoutes = ['/login', '/forgot-password', '/reset-password']

// Routes that should redirect to dashboard if authenticated
const authRoutes = ['/login']

/**
 * Verify JWT token in Edge Runtime
 */
async function verifyToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    })

    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return false
    }

    return true
  } catch {
    return false
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Get access token from cookie
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  const isValidSession = accessToken ? await verifyToken(accessToken) : false

  // Redirect unauthenticated users from protected routes to login
  if (!isPublicRoute && !isValidSession) {
    const loginUrl = new URL('/login', request.url)

    // Add the original URL as a redirect parameter
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname)
    }

    // Check if session expired (had token but it's invalid)
    if (accessToken) {
      loginUrl.searchParams.set('expired', '1')
    }

    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users from auth routes (login) to dashboard
  if (isAuthRoute && isValidSession) {
    // Check if there's a redirect parameter
    const redirectTo = request.nextUrl.searchParams.get('redirect') ?? '/'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}
