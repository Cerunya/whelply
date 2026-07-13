import Link from 'next/link'
import { auth, signOut } from '@/lib/auth'
import MobileNav from './MobileNav'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://whelply.de'

export default async function Navbar() {
  const session = await auth()
  const navItems = [
    { href: '/welpen', label: 'Welpen' },
    { href: '/hunde', label: 'Erwachsene Hunde' },
    { href: '/zuchtrueden', label: 'Deckrüden' },
    { href: '/zuechter', label: 'Züchter' },
    { href: '/rassen', label: 'Rassen' },
    { href: '/ratgeber', label: 'Ratgeber' },
    { href: '/dienste', label: 'Dienste' },
  ]
  return (
    <header className="bg-white border-b border-cream-deep sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <a href={BASE} className="text-xl font-bold text-forest tracking-tight font-serif">
            Whelply
          </a>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={`${BASE}${item.href}`}
                className="text-sm text-stone-500 hover:text-forest transition-colors font-medium"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              <a href={`${BASE}/dashboard`} className="text-sm text-stone-600 hover:text-forest transition-colors font-medium">
                {session.user.kennelName ?? 'Dashboard'}
              </a>
              <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }) }}>
                <button type="submit" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
                  Abmelden
                </button>
              </form>
            </>
          ) : (
            <>
              <a href={`${BASE}/login`} className="text-sm text-stone-500 hover:text-forest transition-colors font-medium">
                Anmelden
              </a>
              <a
                href={`${BASE}/register`}
                className="bg-forest text-white text-sm px-4 py-2 rounded-lg hover:bg-forest-light transition-colors font-medium"
              >
                Registrieren
              </a>
            </>
          )}
        </div>
        <MobileNav
          links={navItems.map((item) => ({ ...item, href: `${BASE}${item.href}` }))}
          extra={
            session ? (
              <>
                <a href={`${BASE}/dashboard`} className="font-medium text-stone-700 hover:text-forest transition-colors">
                  {session.user.kennelName ?? 'Dashboard'}
                </a>
                <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }) }}>
                  <button type="submit" className="text-stone-400 hover:text-stone-700 transition-colors">
                    Abmelden
                  </button>
                </form>
              </>
            ) : (
              <>
                <a href={`${BASE}/login`} className="font-medium text-stone-700 hover:text-forest transition-colors">
                  Anmelden
                </a>
                <a href={`${BASE}/register`} className="font-semibold text-forest hover:underline">
                  Registrieren
                </a>
              </>
            )
          }
        />
      </div>
    </header>
  )
}
