import Link from 'next/link'
import { auth, signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import MobileNav from './MobileNav'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://whelply.de'

export default async function Navbar() {
  const session = await auth()

  // Ungelesene Nachrichten zählen (für Züchter und Interessenten)
  let unreadCount = 0
  if (session?.user?.id) {
    const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
    if (me?.role === 'breeder') {
      unreadCount = await prisma.message.count({
        where: { senderRole: 'user', readAt: null, conversation: { breeder: { userId: session.user.id } } },
      })
    } else if (me) {
      unreadCount = await prisma.message.count({
        where: { senderRole: 'breeder', readAt: null, conversation: { userId: session.user.id } },
      })
    }
  }

  // Postfach-Icon ist fuer eingeloggte Nutzer immer sichtbar (direkter Weg zum Postfach),
  // der rote Zaehler erscheint nur bei ungelesenen Nachrichten
  const mailBadge = (
    <a
      href={`${BASE}/dashboard/nachrichten`}
      className="relative inline-flex items-center text-stone-600 hover:text-forest transition-colors"
      title={unreadCount > 0 ? `${unreadCount} ungelesene Nachricht${unreadCount === 1 ? '' : 'en'}` : 'Nachrichten'}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 px-0.5 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </a>
  )

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
              {mailBadge}
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
                {mailBadge}
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
