import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const TRACK_COOKIE = 'career-track'
const VALID_TRACKS = ['hydro', 'ai', 'devtools', 'indie']
const TRACK_FILTERED_PATHS = ['/about', '/blog', '/projects', '/tools', '/research', '/contact', '/resume', '/life']

/**
 * Middleware:
 * 1. 过滤非 ASCII cookie（防 ByteString 崩溃）
 * 2. 将 cookie 中的 track 转发到 URL searchParams（让 SSR 读到正确方向）
 */
export function middleware(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie')

  // Phase 1: 非 ASCII cookie 清理
  let safeCookieHeader = cookieHeader
  if (cookieHeader) {
    let hasNonAscii = false
    for (let i = 0; i < cookieHeader.length; i++) {
      if (cookieHeader.charCodeAt(i) > 127) {
        hasNonAscii = true
        break
      }
    }

    if (hasNonAscii) {
      safeCookieHeader = cookieHeader
        .split(';')
        .map(c => c.trim())
        .filter(c => {
          for (let i = 0; i < c.length; i++) {
            if (c.charCodeAt(i) > 127) return false
          }
          return true
        })
        .join('; ')
    }
  }

  // Phase 2: Track cookie → URL searchParams 转发
  const { pathname, searchParams } = request.nextUrl
  const isTrackFilteredPath = TRACK_FILTERED_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (isTrackFilteredPath && !searchParams.has('track') && safeCookieHeader) {
    const match = safeCookieHeader.match(new RegExp(`(?:^|;\\s*)${TRACK_COOKIE}=([^;]*)`))
    const trackValue = match?.[1]

    if (trackValue && VALID_TRACKS.includes(trackValue) && trackValue !== 'hydro') {
      // rewrite：服务端内部路由，protocol 用 http（Node 内部不走 SSL）
      const url = request.nextUrl.clone()
      url.protocol = 'http'
      url.searchParams.set('track', trackValue)
      return NextResponse.rewrite(url)
    }
  }

  // Apply cleaned cookies if needed
  if (safeCookieHeader !== cookieHeader && cookieHeader) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('cookie', safeCookieHeader || '')
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon|images|archives).*)',
  ],
}
