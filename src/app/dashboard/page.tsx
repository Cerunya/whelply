import { auth, signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MobileNav from '@/components/MobileNav'
import { slugify } from '@/lib/slugify'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      listings: {
        where: { status: { in: ['available', 'draft', 'reserved', 'sold'] } },
        include: { breed: { select: { nameDe: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      litters: {
        include: {
          breed: { select: { nameDe: true } },
          _count: { select: { listings: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      dogs: {
        include: {
          breed: { select: { nameDe: true } },
          media: { take: 1, select: { url: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      subscription: true,
      user: { select: { role: true } },
      _count: { select: { listings: true } },
    },
  })

  if (!breeder) redirect('/login')

  const activeListings = breeder.listings.filter((l) => l.status === 'available')
  const draftListings = breeder.listings.filter((l) => l.status === 'draft')
  const totalViews = breeder.listings.reduce((sum, l) => sum + l.viewCount, 0)
  const plan = breeder.subscription?.plan ?? 'free'
  const maxFree = 3
  const canAddMore = plan !== 'free' || activeListings.length < maxFree

  return (
    <div className="min-h-screen bg-cream font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-cream-deep sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-serif font-bold text-forest text-xl">Whelply</Link>
            <span className="text-stone-300">|</span>
            <span className="text-sm text-stone-500 font-medium">Mein Dashboard</span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            {breeder.user.role === 'admin' && (
              <Link href="/admin" className="text-sm text-honey font-semibold hover:text-honey-light transition-colors">
                Admin
              </Link>
            )}
            <Link href="/dashboard/profil" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
              Profil bearbeiten
            </Link>
            <Link href="/" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
              Zur Website
            </Link>
            <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }) }}>
              <button type="submit" className="text-sm text-stone-400 hover:text-stone-700 transition-colors">
                Abmelden
              </button>
            </form>
          </div>

          <MobileNav
            links={[]}
            extra={
              <>
                {breeder.user.role === 'admin' && (
                  <Link href="/admin" className="font-semibold text-honey hover:text-honey-light transition-colors">
                    Admin
                  </Link>
                )}
                <Link href="/dashboard/profil" className="font-medium text-stone-700 hover:text-forest transition-colors">
                  Profil bearbeiten
                </Link>
                <Link href="/" className="font-medium text-stone-700 hover:text-forest transition-colors">
                  Zur Website
                </Link>
                <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }) }}>
                  <button type="submit" className="text-stone-400 hover:text-stone-700 transition-colors">
                    Abmelden
                  </button>
                </form>
              </>
            }
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Begrüßung */}
        <div className="mb-10">
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-1">
            {breeder.kennelName}
          </h1>
          <p className="text-stone-400 text-sm">
            {breeder.city ? `${breeder.city} · ` : ''}
            Plan: <span className="font-medium text-forest capitalize">{plan}</span>
            {plan === 'free' && (
              <span className="text-stone-400"> · {activeListings.length}/{maxFree} Inserate</span>
            )}
          </p>
        </div>

        {/* Stat-Karten */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {[
            { label: 'Aktive Inserate', value: activeListings.length },
            { label: 'Entwürfe', value: draftListings.length },
            { label: 'Profilaufrufe', value: totalViews },
            { label: 'Inserate gesamt', value: breeder._count.listings },
            { label: 'Verifizierung', value: breeder.verificationLevel === 'none' ? '—' : '✓' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-cream-deep p-5">
              <p className="text-2xl font-bold text-stone-900 font-serif">{s.value}</p>
              <p className="text-xs text-stone-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Aktionen */}
        <div className="flex flex-wrap gap-3 mb-6">
          {canAddMore ? (
            <Link
              href="/dashboard/inserat-erstellen"
              className="bg-forest text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-forest-light transition-colors"
            >
              + Neues Inserat
            </Link>
          ) : (
            <div className="flex items-center gap-3 bg-honey-pale border border-honey/30 rounded-xl px-5 py-2.5">
              <p className="text-sm text-stone-700">
                Free-Limit erreicht ({maxFree} Inserate).
              </p>
              <Link href="/dashboard/upgrade" className="text-sm font-semibold text-honey hover:underline">
                Pro werden →
              </Link>
            </div>
          )}
          <Link
            href="/dashboard/wurf-eintragen"
            className="border-2 border-forest/20 text-forest px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-forest/5 transition-colors"
          >
            + Wurf eintragen
          </Link>
          <Link
            href="/dashboard/hund-eintragen"
            className="border-2 border-forest/20 text-forest px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-forest/5 transition-colors"
          >
            + Zuchthund eintragen
          </Link>
        </div>

        {/* Meine Züchterseite */}
        <div className="bg-white rounded-2xl border border-cream-deep p-5 mb-10">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
            <div>
              <h3 className="font-serif text-base font-bold text-stone-900">Meine Züchterseite</h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Branding, Neuigkeiten und Fotos für deine öffentliche Profilseite
              </p>
            </div>
            <Link
              href={`/zuechter/${slugify(breeder.kennelName)}`}
              target="_blank"
              className="text-sm text-forest font-semibold hover:underline whitespace-nowrap"
            >
              Seite ansehen →
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/theme"
              className="border-2 border-stone-200 text-stone-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-colors"
            >
              Theme & Branding
            </Link>
            <Link
              href="/dashboard/news"
              className="border-2 border-stone-200 text-stone-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-colors"
            >
              Aktuelles
            </Link>
            <Link
              href="/dashboard/galerie"
              className="border-2 border-stone-200 text-stone-600 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-stone-50 transition-colors"
            >
              Galerie
            </Link>
          </div>
        </div>

        {/* Würfe */}
        {breeder.litters.length > 0 && (
          <div className="mb-10">
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-4">Würfe</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {breeder.litters.map((litter) => (
                <Link
                  key={litter.id}
                  href={`/dashboard/wurf/${litter.id}`}
                  className="bg-white rounded-xl border border-cream-deep p-4 hover:border-forest/30 transition-colors flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-stone-800 text-sm">{litter.breed.nameDe}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {litter.bornDate
                        ? `Geboren am ${litter.bornDate.toLocaleDateString('de-DE')}`
                        : litter.expectedDate
                        ? `Erwartet: ${litter.expectedDate}`
                        : 'Geplant'}
                      {' · '}{litter._count.listings} Welpe{litter._count.listings !== 1 ? 'n' : ''}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                    litter.status === 'available' ? 'bg-green-50 text-green-700'
                    : litter.status === 'sold_out' ? 'bg-stone-200 text-stone-600'
                    : 'bg-stone-100 text-stone-500'
                  }`}>
                    {litter.status === 'available' ? 'Verfügbar'
                      : litter.status === 'sold_out' ? 'Ausverkauft'
                      : litter.status === 'born' ? 'Geboren'
                      : litter.status === 'pregnant' ? 'Trächtig'
                      : 'Geplant'}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Zuchthunde */}
        {breeder.dogs.length > 0 && (
          <div className="mb-10">
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-4">Meine Zuchthunde</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {breeder.dogs.map((dog) => (
                <Link
                  key={dog.id}
                  href={`/dashboard/hund/${dog.id}`}
                  className="bg-white rounded-xl border border-cream-deep p-4 hover:border-forest/30 transition-colors flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-lg bg-cream-dark overflow-hidden flex items-center justify-center flex-shrink-0">
                    {dog.media[0]?.url ? (
                      <img src={dog.media[0].url} alt={dog.name} className="w-full h-full object-cover" />
                    ) : (
                      <svg className="w-6 h-6 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-stone-800 text-sm truncate">{dog.name}</p>
                    <p className="text-xs text-stone-400 truncate">
                      {dog.sex === 'male' ? 'Rüde' : 'Hündin'} · {dog.breed.nameDe}
                      {dog.isStud && ' · Deckrüde'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Inserate-Tabelle */}
        <div className="bg-white rounded-2xl border border-cream-deep overflow-hidden">
          <div className="px-6 py-4 border-b border-cream-deep flex items-center justify-between">
            <h2 className="font-semibold text-stone-900">Meine Inserate</h2>
          </div>

          {breeder.listings.length === 0 ? (
            <div className="text-center py-16 px-4">
              <p className="text-stone-400 text-sm mb-4">Noch keine Inserate.</p>
              <Link
                href="/dashboard/inserat-erstellen"
                className="text-forest font-semibold text-sm hover:underline"
              >
                Erstes Inserat erstellen →
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cream-deep bg-cream">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wide">Rasse</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wide hidden md:table-cell">Preis</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wide">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wide hidden md:table-cell">Aufrufe</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-stone-400 uppercase tracking-wide">Boost</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-deep">
                {breeder.listings.map((listing) => {
                  const isBoosted = !!listing.boostExpiresAt && listing.boostExpiresAt > new Date()
                  return (
                    <tr key={listing.id} className="hover:bg-cream/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-stone-800">
                        <Link
                          href={`/welpen/${listing.id}`}
                          target="_blank"
                          className="hover:text-forest transition-colors"
                        >
                          {listing.title || listing.breed.nameDe}
                        </Link>
                        {listing.title && (
                          <span className="text-stone-400 font-normal"> · {listing.breed.nameDe}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-stone-500 hidden md:table-cell">
                        {listing.priceCents
                          ? `${(listing.priceCents / 100).toLocaleString('de-DE')} €`
                          : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          listing.status === 'available' ? 'bg-green-50 text-green-700'
                          : listing.status === 'reserved' ? 'bg-amber-50 text-amber-700'
                          : listing.status === 'sold' ? 'bg-stone-200 text-stone-600'
                          : 'bg-stone-100 text-stone-500'
                        }`}>
                          {listing.status === 'available' ? 'Aktiv'
                            : listing.status === 'reserved' ? 'Reserviert'
                            : listing.status === 'sold' ? 'Verkauft'
                            : 'Entwurf'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-stone-500 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {listing.viewCount}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isBoosted ? (
                          <span className="text-xs text-honey font-semibold">★ Aktiv</span>
                        ) : (
                          <Link
                            href={`/dashboard/boost/${listing.id}`}
                            className="text-xs text-stone-400 hover:text-honey transition-colors font-medium"
                          >
                            1 € buchen
                          </Link>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/dashboard/inserat/${listing.id}`}
                          className="text-xs text-stone-400 hover:text-forest transition-colors"
                        >
                          Bearbeiten
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
