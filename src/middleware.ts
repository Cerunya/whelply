import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const host = request.headers.get('host') || ''

  // ── Subdomain-Erkennung ──────────────────────────────────────────
  // bella.whelply.de → subdomain = "bella"
  // whelply.de / www.whelply.de / localhost → kein Subdomain
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'whelply.de'
  let subdomain: string | null = null

  if (host.endsWith(`.${baseDomain}`)) {
    const sub = host.replace(`.${baseDomain}`, '').toLowerCase()
    // "www" ist kein Züchter-Subdomain
    if (sub && sub !== 'www') {
      subdomain = sub
    }
  }

  // ── Subdomain-Rewrite ────────────────────────────────────────────
  // Auf Subdomains: interne Umschreibung auf /zuechter/[subdomain]/...
  // Ausgenommen: API-Routen, _next, statische Dateien, Dashboard, Admin, Auth
  if (subdomain) {
	if (pathname.startsWith(`/zuechter/${subdomain}`)) {
      const shortPath = pathname.replace(`/zuechter/${subdomain}`, '') || '/'
      const url = request.nextUrl.clone()
      url.pathname = shortPath
      return NextResponse.redirect(url)
    }
    const skipRewrite = [
      '/api/',
      '/_next/',
      '/favicon.ico',
      '/dashboard',
      '/admin',
      '/preview',
      '/login',
      '/registrieren',
      '/passwort-',
      '/welpen-alert',
	  '/zuechter/',   
	  '/welpen/',
      '/hunde/',
      '/zuchtrueden/',
      '/rassen/',
      '/ratgeber/',
      '/dienste/',
      '/impressum',
      '/datenschutz',
      '/agb',
    ]

    const shouldSkip = skipRewrite.some((prefix) => pathname.startsWith(prefix))

    if (!shouldSkip) {
      // / → /zuechter/bella
      // /wuerfe → /zuechter/bella/wuerfe
      // /kontakt → /zuechter/bella/kontakt
      const rewritePath =
        pathname === '/'
          ? `/zuechter/${subdomain}`
          : `/zuechter/${subdomain}${pathname}`

      const url = request.nextUrl.clone()
      url.pathname = rewritePath
      return NextResponse.rewrite(url)
    }
  }

  // ── Preview-Passwort (Vorschaltseite) ────────────────────────────
  const previewPassword = process.env.PREVIEW_PASSWORD
  if (!previewPassword) return NextResponse.next()

  const alwaysAllowed = [
    '/api/auth',
    '/api/preview-login',
    '/api/inserate',
    '/api/wuerfe',
    '/api/upload',
    '/api/media',
    '/api/media-item',
    '/api/profil',
    '/api/hunde',
    '/api/news',
    '/api/admin',
    '/api/bookmarks',
    '/api/reports',
    '/api/reviews',
    '/api/upgrade-to-breeder',
    '/api/user-profile',
    '/api/welpen-alert',
    '/api/cron',
    '/api/messages',
    '/api/artikel',
    '/api/passwort',
    '/api/produkte',
    '/api/profil/check-subdomain',
    '/welpen-alert',
    '/passwort-',
    '/admin',
    '/preview',
    '/_next',
    '/favicon.ico',
  ]

  if (alwaysAllowed.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next()
  }

  const cookie = request.cookies.get('preview_access')?.value
  if (cookie === previewPassword) return NextResponse.next()

  const url = request.nextUrl.clone()
  url.pathname = '/preview'
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
