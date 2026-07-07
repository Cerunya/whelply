import Link from 'next/link'
import { auth, signOut } from '@/lib/auth'
import MobileNav from './MobileNav'

export default async function Navbar() {
  const session = await auth()

  const navItems = [
    { href: '/welpen', label: 'Welpen' },
    { href: '/hunde', label: 'Erwachsene Hunde' },
    { href: '/zuchtrueden', label: 'Deckrüden' },
    { href: '/zuechter', label: 'Züchter' },
    { href: '/rassen', label: 'Rassen' },
    { href: '/dienste', label: 'Dienste' },
  ]

  return (
    <header className="bg-white border-b border-cream-deep sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-forest tracking-tight font-serif">
            Whelply
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-stone-500 hover:text-forest transition-colors font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-3">
          {session ? (
            <>
              <Link href="/dashboard" className="text-sm text-stone-600 hover:text-forest transition-colors font-medium">
                {session.user.kennelName ?? 'Dashboard'}
              </Link>
              <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }) }}>
                <button type="submit" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
                  Abmelden
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-stone-500 hover:text-forest transition-colors font-medium">
                Anmelden
              </Link>
              <Link
                href="/register"
                className="bg-forest text-white text-sm px-4 py-2 rounded-lg hover:bg-forest-light transition-colors font-medium"
              >
                Registrieren
              </Link>
            </>
          )}
        </div>

        <MobileNav
          links={navItems}
          extra={
            session ? (
              <>
                <Link href="/dashboard" className="font-medium text-stone-700 hover:text-forest transition-colors">
                  {session.user.kennelName ?? 'Dashboard'}
                </Link>
                <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }) }}>
                  <button type="submit" className="text-stone-400 hover:text-stone-700 transition-colors">
                    Abmelden
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="font-medium text-stone-700 hover:text-forest transition-colors">
                  Anmelden
                </Link>
                <Link href="/register" className="font-semibold text-forest hover:underline">
                  Registrieren
                </Link>
              </>
            )
          }
        />
      </div>
    </header>
  )
}
