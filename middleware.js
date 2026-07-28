import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(function (c) { request.cookies.set(c.name, c.value) })
          response = NextResponse.next({ request })
          cookiesToSet.forEach(function (c) { response.cookies.set(c.name, c.value, c.options) })
        },
      },
    }
  )

  const authRes = await supabase.auth.getUser()
  const user = authRes.data ? authRes.data.user : null
  const path = request.nextUrl.pathname

  const publicPaths = ['/login', '/signup', '/auth/callback']
  const isPublic = publicPaths.some(function (p) { return path.startsWith(p) })

  if (isPublic) {
    return response
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const profileRes = await supabase.from('profiles').select('onboarding_completed, status').eq('id', user.id).single()
  const profile = profileRes.data

  if (profile && !profile.onboarding_completed) {
    if (path !== '/onboarding') {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
    return response
  }

  if (profile && profile.status !== 'active') {
    if (path !== '/hold') {
      return NextResponse.redirect(new URL('/hold', request.url))
    }
    return response
  }

  if (path === '/onboarding' || path === '/hold') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|tcf-logo.png).*)'],
}