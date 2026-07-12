import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Immer zugänglich
  const alwaysAllowed = ['/api/auth', '/api/preview-login', '/api/inserate', '/api/wuerfe', '/api/upload', '/api/media', '/api/media-item', '/api/profil', '/api/hunde', '/api/news', '/api/admin', '/api/bookmarks', '/api/reports', '/api/reviews', '/api/upgrade-to-breeder', '/api/user-profile', '/api/welpen-alert', '/api/cron', '/api/messages', '/api/artikel', '/api/passwort', '/welpen-alert', '/passwort-', '/admin', '/preview', '/_next', '/favicon.ico']
  if (alwaysAllowed.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // Vorschaltseite: wenn PREVIEW_PASSWORD gesetzt, alle Besucher ohne Cookie blocken
  const previewPassword = process.env.PREVIEW_PASSWORD
  if (previewPassword) {
    const cookie = req.cookies.get('preview_access')
    if (cookie?.value !== previewPassword) {
      return NextResponse.redirect(new URL('/preview', req.url))
    }
  }

  // Dashboard nur für eingeloggte Nutzer
  if (pathname.startsWith('/dashboard')) {
    const { auth } = await import('@/lib/auth')
    const session = await auth()
    if (!session?.user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
