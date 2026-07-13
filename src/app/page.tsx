@ -1,368 +1,372 @@
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { slugify } from '@/lib/slugify'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SearchForm from '@/components/SearchForm'
import ListingCard from '@/components/ListingCard'
import Link from 'next/link'

// Immer dynamisch rendern, damit Aenderungen (Theme, Status, neue Inserate etc.)
// sofort sichtbar sind, ohne dass der Full Route Cache veraltete Daten zeigt.
export const dynamic = 'force-dynamic'

export default async function Home() {
  const session = await auth()

  const breeds = await prisma.breed.findMany({
    orderBy: { nameDe: 'asc' },
    select: { id: true, nameDe: true, slug: true },
  }).catch(() => [])

  const listings = await prisma.listing.findMany({
    where: { status: 'available', type: 'puppy', breeder: { isActive: true } },
    orderBy: [{ boostExpiresAt: 'desc' }, { createdAt: 'desc' }],
    take: 15,
    include: {
      breed: { select: { nameDe: true } },
      breeder: { select: { kennelName: true, city: true, state: true } },
      media: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
  }).catch(() => [])

  const [totalListings, totalBreeders] = await Promise.all([
    prisma.listing.count({ where: { status: 'available' } }).catch(() => 0),
    prisma.breederProfile.count().catch(() => 0),
  ])

  const adultListings = await prisma.listing.findMany({
    where: { status: 'available', type: 'adult_dog', breeder: { isActive: true } },
    orderBy: [{ boostExpiresAt: 'desc' }, { createdAt: 'desc' }],
    take: 6,
    include: {
      breed: { select: { nameDe: true } },
      breeder: { select: { kennelName: true, city: true, state: true } },
      media: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
  }).catch(() => [])

  // Zuechterpraesentation: neueste Zuecher mit Hintergrundbild-Media
  const allFeaturedBreeders = await prisma.breederProfile.findMany({
    where: { kennelName: { not: '' } },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      id: true,
      kennelName: true,
      displayName: true,
      city: true,
      state: true,
      bio: true,
      isPublished: true,
      isActive: true,
      dogs: { take: 1, select: { breed: { select: { nameDe: true } } } },
      media: { where: { purpose: 'card' }, take: 1, select: { url: true } },
      listings: {
        where: { status: 'available', type: 'puppy' },
        take: 1,
        select: { id: true },
      },
      litters: {
        where: { status: { in: ['planned', 'pregnant'] } },
        take: 1,
        select: { id: true, status: true },
      },
    },
  }).catch(() => [])

  // Nur Zuecher mit Hintergrundbild anzeigen, max 9
  const featuredBreeders = allFeaturedBreeders
    .filter((b) => b.media[0]?.url && b.isPublished !== false && b.isActive !== false)
    .slice(0, 9)

  const now = new Date()

  return (
    <>
      <Navbar />
      <main className="bg-cream">

        {/* ── Hero ── */}
        <section className="bg-forest px-4 py-20 md:py-28 relative overflow-hidden">
          {/* Subtile Textur-Punkte */}
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
          />
          <div className="max-w-6xl mx-auto relative">
            <div className="max-w-2xl">
              <span className="inline-block text-xs font-semibold text-honey uppercase tracking-widest mb-5">
                Nur FCI-anerkannte Rassen
              </span>
              <h1 className="font-serif text-5xl md:text-6xl font-bold text-white leading-tight mb-5">
                Finde deinen<br />
                <span className="text-honey">Rassewelpen.</span>
              </h1>
              <p className="text-white/75 text-lg mb-10 leading-relaxed">
                Whelply verbindet dich mit geprüften Züchtern in ganz Deutschland —
                mit FCI-Stammbaum, ohne Vermehrer.
              </p>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2">
                <SearchForm breeds={breeds} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Statistiken ── */}
        <section className="bg-forest-dark px-4 py-5">
          <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-10 md:gap-20">
            {[
              { value: totalListings, label: 'aktive Inserate' },
              { value: totalBreeders, label: 'Züchter' },
              { value: breeds.length, label: 'Rassen' },
              { value: '100%', label: 'FCI-anerkannt' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-white font-serif">{stat.value}</p>
                <p className="text-xs text-white/60 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Aktuelle Welpen ── */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-serif text-3xl font-bold text-stone-900">Aktuelle Welpen</h2>
              <p className="text-stone-400 text-sm mt-1">Zuletzt eingetragene Inserate</p>
            </div>
            <Link href="/welpen" className="text-sm text-forest font-semibold hover:text-forest-light transition-colors">
              Alle anzeigen →
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-cream-deep">
              <p className="text-5xl mb-5">🐾</p>
              <p className="font-serif text-xl font-semibold text-stone-700 mb-2">Noch keine Inserate</p>
              <p className="text-stone-400 text-sm mb-8 max-w-xs mx-auto">
                Sei der erste Züchter auf Whelply und trag deinen nächsten Wurf ein.
              </p>
              <Link
                href="/register"
                className="bg-forest text-white text-sm px-6 py-3 rounded-xl hover:bg-forest-light transition-colors font-semibold"
              >
                Jetzt registrieren
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 items-stretch">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  breedName={listing.breed.nameDe}
                  kennelName={listing.breeder.kennelName}
                  puppyName={listing.title}
                  city={listing.breeder.city}
                  state={listing.breeder.state}
                  priceCents={listing.priceCents}
                  isBoosted={!!listing.boostExpiresAt && listing.boostExpiresAt > now}
                  imageUrl={listing.media[0]?.url}
                  tint={listing.sex === 'male' ? 'male' : listing.sex === 'female' ? 'female' : null}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Züchter entdecken ── */}
        {featuredBreeders.length > 0 && (
          <section className="bg-forest-dark py-16 px-4">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-xs font-semibold text-honey uppercase tracking-widest mb-1">Unsere Züchter</p>
                  <h2 className="font-serif text-3xl font-bold text-white">Züchter entdecken</h2>
                </div>
                <Link href="/zuechter" className="text-sm font-semibold text-honey hover:underline">
                  Alle Züchter →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredBreeders.map((breeder) => (
                  <Link key={breeder.id} href={`/zuechter/${slugify(breeder.kennelName)}`}
                    className="group rounded-2xl overflow-hidden border border-white/10 hover:shadow-xl transition-all flex flex-col relative">
                    {/* Runder Badge an der Bild/Text-Grenze */}
                    {breeder.listings.length > 0 && (
                      <div className="absolute right-4 z-10" style={{ bottom: '95px' }}>
                        <div className="w-16 h-16 rounded-full bg-honey text-white flex flex-col items-center justify-center text-center shadow-lg border-[3px] border-white translate-y-1/2">
                          <span className="text-[10px] font-black leading-tight uppercase">Welpen</span>
                          <span className="text-[10px] font-black leading-tight uppercase">Dispo</span>
                        </div>
                      </div>
                    )}
                    {breeder.listings.length === 0 && breeder.litters.length > 0 && (
                      <div className="absolute right-4 z-10" style={{ bottom: '95px' }}>
                        <div className="w-16 h-16 rounded-full bg-blue-400 text-white flex flex-col items-center justify-center text-center shadow-lg border-[3px] border-white translate-y-1/2">
                          <span className="text-[10px] font-black leading-tight uppercase">
                            {breeder.litters[0].status === 'pregnant' ? 'Wurf' : 'Wurf'}
                          </span>
                          <span className="text-[10px] font-black leading-tight uppercase">
                            {breeder.litters[0].status === 'pregnant' ? 'Erwartet' : 'Geplant'}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="h-40 overflow-hidden flex-shrink-0">
                      {breeder.media[0]?.url ? (
                        <img src={breeder.media[0].url} alt={breeder.kennelName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-white/5" />
                      )}
                    </div>
                    <div className="p-4 bg-white flex-1 flex flex-col">
                      <p className="font-serif font-bold text-stone-900 text-base">{breeder.kennelName}</p>
                      {breeder.dogs[0]?.breed?.nameDe && (
                        <p className="text-xs text-forest font-semibold uppercase tracking-wider mt-0.5">
                          {breeder.dogs[0].breed.nameDe}
                        </p>
                      )}
                      {(breeder.city || breeder.state) && (
                        <p className="text-xs text-stone-400 mt-1">{[breeder.city, breeder.state].filter(Boolean).join(', ')}</p>
                      )}
                      {breeder.bio && (
                        <p className="text-xs text-stone-500 mt-2 line-clamp-2">{breeder.bio.replace(/!\[[^\]]*\]\([^)]+\)/g, '').replace(/\*\*|__|\*|_|@youtube\[[^\]]*\]/g, '').trim()}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Hunde zu vergeben ── */}
        {adultListings.length > 0 && (
          <section className="bg-white border-y border-cream-deep py-16 px-4"><div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-semibold text-forest uppercase tracking-widest mb-1">Hunde jeden Alters</p>
                <h2 className="font-serif text-3xl font-bold text-stone-900">Erwachsene Hunde</h2>
              </div>
              <Link href="/hunde" className="text-sm font-semibold text-forest hover:underline">
                Alle anzeigen →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 items-stretch">
              {adultListings.slice(0, 6).map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  breedName={listing.breed.nameDe}
                  kennelName={listing.breeder.kennelName}
                  puppyName={listing.title}
                  city={listing.breeder.city}
                  state={listing.breeder.state}
                  priceCents={listing.priceCents}
                  isBoosted={!!listing.boostExpiresAt && listing.boostExpiresAt > now}
                  imageUrl={listing.media[0]?.url}
                  tint={listing.sex === 'male' ? 'male' : listing.sex === 'female' ? 'female' : null}
                />
              ))}
            </div>
          </div></section>
        )}

        {/* ── Trust-Sektion ── */}
        <section className="bg-white border-y border-cream-deep py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-serif text-3xl font-bold text-stone-900 text-center mb-12">
              Warum Whelply?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: '✓',
                  title: 'Nur echte Züchter',
                  desc: 'Jeder Züchter muss seinen FCI-Zwingernamen angeben. Vermehrer und Händler haben keinen — das ist unser einziger Filter, aber er wirkt.',
                },
                {
                  icon: '♦',
                  title: 'Nur FCI-Rassen',
                  desc: 'Kein Maltipoo, kein Labradoodle, kein F1B-Irgendwas. Nur die offiziell anerkannten Rassen der FCI — etwa 355 an der Zahl.',
                },
                {
                  icon: '€',
                  title: 'Kostenlos für Züchter',
                  desc: 'Ein Basis-Account ist dauerhaft gratis. Mehr Sichtbarkeit gibt es ab 1 € für 24 Stunden — kein Monats-Abo, kein Risiko.',
                },
              ].map((item) => (
                <div key={item.title} className="bg-cream rounded-2xl p-7 border border-cream-deep">
                  <div className="w-10 h-10 bg-forest rounded-xl flex items-center justify-center text-honey font-bold text-lg mb-5">
                    {item.icon}
                  </div>
                  <h3 className="font-serif font-semibold text-stone-900 text-lg mb-2">{item.title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Züchter-CTA ── */}
        <section className="max-w-6xl mx-auto px-4 py-20 text-center">
          {session?.user ? (
            <>
              <p className="text-xs font-semibold text-forest uppercase tracking-widest mb-4">Für Züchter</p>
              <h2 className="font-serif text-4xl font-bold text-stone-900 mb-4">
                Willkommen zurück.
              </h2>
              <p className="text-stone-500 mb-10 max-w-lg mx-auto text-lg leading-relaxed">
                Verwalte deine Inserate, Würfe und Zuchthunde in deinem Dashboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/dashboard"
                  className="bg-forest text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors shadow-sm"
                >
                  Zum Dashboard
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold text-forest uppercase tracking-widest mb-4">Für Züchter</p>
              <h2 className="font-serif text-4xl font-bold text-stone-900 mb-4">
                Dein Zwinger auf Whelply.
              </h2>
              <p className="text-stone-500 mb-10 max-w-lg mx-auto text-lg leading-relaxed">
                Profil anlegen, Würfe eintragen, Käufer in ganz Deutschland erreichen.
                Kostenlos, ohne versteckte Gebühren.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/register"
                  className="bg-forest text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors shadow-sm"
                >
                  Kostenlos registrieren
                </Link>
                <Link
                  href="/welpen"
                  className="border-2 border-forest/20 text-forest px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-forest/5 transition-colors"
                >
                  Inserate durchsuchen
                </Link>
              </div>
            </>
          )}
        </section>

      </main>
      <Footer />
    </>
  )
}
