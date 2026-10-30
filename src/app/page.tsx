import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { slugify } from '@/lib/slugify'
import { getBreederCanonicalUrl } from '@/lib/subdomain'
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
      subdomain: true,
      dogs: { select: { sex: true, isStud: true, breed: { select: { nameDe: true } } } },
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

  // Nur Zuecher mit Hintergrundbild anzeigen, max 6
  const featuredBreeders = allFeaturedBreeders
    .filter((b) => b.media[0]?.url && b.isPublished !== false && b.isActive !== false)
    .slice(0, 6)

  const now = new Date()
  const heroImages = [
    {
      url: 'https://images.pexels.com/photos/25902170/pexels-photo-25902170.jpeg?auto=compress&cs=tinysrgb&w=1200',
      alt: 'Weißer Welpe mit einem lila Kuscheltier im Gras',
    },
    {
      url: 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=900',
      alt: 'Junger Hund liegt auf einer hellen Decke',
    },
  ]

  return (
    <>
      <Navbar />
      <main className="bg-cream">

        {/* ── Hero ── */}
        <section className="relative overflow-visible bg-[linear-gradient(135deg,#1B3A2D_0%,#122619_100%)] px-4 pb-16 pt-12 md:pb-[72px]">
          <svg className="absolute inset-0 h-full w-full text-white opacity-[0.035]" aria-hidden="true">
            <defs>
              <pattern id="home-paw-pattern" width="190" height="190" patternUnits="userSpaceOnUse">
                <g fill="currentColor" transform="translate(22 24) rotate(-18 30 30)">
                  <ellipse cx="30" cy="40" rx="13" ry="15" />
                  <ellipse cx="10" cy="25" rx="6" ry="8" />
                  <ellipse cx="23" cy="14" rx="6" ry="8" />
                  <ellipse cx="37" cy="14" rx="6" ry="8" />
                  <ellipse cx="50" cy="25" rx="6" ry="8" />
                </g>
                <g fill="currentColor" transform="translate(112 108) rotate(16 30 30)">
                  <ellipse cx="30" cy="40" rx="13" ry="15" />
                  <ellipse cx="10" cy="25" rx="6" ry="8" />
                  <ellipse cx="23" cy="14" rx="6" ry="8" />
                  <ellipse cx="37" cy="14" rx="6" ry="8" />
                  <ellipse cx="50" cy="25" rx="6" ry="8" />
                </g>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#home-paw-pattern)" />
          </svg>

          <div className="max-w-6xl mx-auto relative grid items-start gap-10 lg:grid-cols-[minmax(0,570px)_minmax(0,1fr)]">
            <div className="relative z-10 max-w-[570px]">
              <span className="mb-6 inline-flex rounded-lg border border-white/15 bg-white/[0.06] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-honey-light">
                Nur FCI-anerkannte Rassen
              </span>
              <h1 className="mb-6 font-serif text-5xl font-bold leading-[1.08] text-white md:text-6xl">
                Finde deinen<br />
                <span className="text-honey-light">Rassewelpen.</span>
              </h1>
              <p className="mb-8 max-w-[540px] text-lg leading-relaxed text-white/75">
                Finde deutschlandweit Welpen, erwachsene Hunde und Deckrüden von seriösen Züchtern.
              </p>
              <div className="rounded-2xl bg-white/10 p-2 backdrop-blur-sm">
                <SearchForm breeds={breeds} />
              </div>
            </div>

            {heroImages.length > 0 && (
              <div className="relative z-10 mt-6 h-[350px] sm:h-[390px] lg:mt-0 lg:h-[400px]">
                <div className="absolute -top-10 right-0 h-[440px] w-[440px] rounded-full bg-honey-light/10" aria-hidden="true" />
                <div className="absolute right-2 top-2 h-40 w-40 rounded-full border border-honey-light/40" aria-hidden="true" />

                <div className="absolute right-0 top-4 w-[78%] max-w-[400px] rotate-3">
                  <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[30px] bg-forest-dark" aria-hidden="true" />
                  <img
                    src={heroImages[0].url}
                    alt={heroImages[0].alt}
                    className="relative aspect-[400/385] w-full rounded-[30px] border-[6px] border-white object-cover"
                  />
                </div>

                {heroImages[1].url && (
                  <div className="absolute left-0 top-[47%] w-[58%] max-w-[250px] -rotate-6">
                    <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[26px] bg-forest-dark" aria-hidden="true" />
                    <img
                      src={heroImages[1].url}
                      alt={heroImages[1].alt}
                      className="relative aspect-[250/235] w-full rounded-[26px] border-[5px] border-white object-cover"
                    />
                  </div>
                )}

                <Link
                  href="/welpen"
                  className="absolute bottom-[-42px] right-0 -rotate-3 rounded-xl bg-honey px-5 py-3 text-center text-forest-dark shadow-[6px_6px_0_#122619] transition-transform hover:-translate-y-1"
                >
                  <span className="block text-sm font-bold">Welpen entdecken</span>
                  <span className="mt-0.5 block text-[10px]">von echten Züchtern</span>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ── Statistiken ── */}
        <section className="bg-[#35634B] px-4 py-4">
          <div className="max-w-6xl mx-auto grid grid-cols-3 divide-x divide-white/15">
            {[
              { value: totalListings, label: 'aktive Inserate' },
              { value: totalBreeders, label: 'Züchter' },
              { value: breeds.length, label: 'Rassen' },
            ].map((stat) => (
              <div key={stat.label} className="px-2 text-center sm:px-4">
                <p className="font-serif text-[22px] font-bold leading-tight text-white">{stat.value}</p>
                <p className="mt-1 text-[10px] text-white/75 sm:text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Aktuelle Welpen ── */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <span className="mb-4 inline-flex rounded-lg border border-forest/10 bg-[#EAF3EC] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-forest shadow-[3px_3px_0_#EDE4CE]">
                Frisch eingestellt
              </span>
              <h2 className="font-serif text-3xl font-bold text-stone-900 sm:text-4xl">Aktuelle Welpen</h2>
            </div>
            <Link href="/welpen" className="whitespace-nowrap text-sm text-forest font-semibold hover:text-forest-light transition-colors">
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
            <div className="grid grid-cols-2 items-stretch gap-6 sm:gap-7 md:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  slug={listing.slug}
                  listingType={listing.type}
                  breedName={listing.breed.nameDe}
                  kennelName={listing.breeder.kennelName}
                  puppyName={listing.title}
                  city={listing.breeder.city}
                  state={listing.breeder.state}
                  priceCents={listing.priceCents}
                  isBoosted={!!listing.boostExpiresAt && listing.boostExpiresAt > now}
                  imageUrl={listing.media[0]?.url}
                  tint={listing.sex === 'male' ? 'male' : listing.sex === 'female' ? 'female' : null}
                  sticker
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Züchter entdecken ── */}
        {featuredBreeders.length > 0 && (
          <section className="relative overflow-hidden bg-[#35634B] px-4 py-16">
            <svg className="absolute inset-0 h-full w-full text-white opacity-[0.035]" aria-hidden="true">
              <defs>
                <pattern id="breeder-paw-pattern" width="190" height="190" patternUnits="userSpaceOnUse">
                  <g fill="currentColor" transform="translate(22 24) rotate(-18 30 30)">
                    <ellipse cx="30" cy="40" rx="13" ry="15" />
                    <ellipse cx="10" cy="25" rx="6" ry="8" />
                    <ellipse cx="23" cy="14" rx="6" ry="8" />
                    <ellipse cx="37" cy="14" rx="6" ry="8" />
                    <ellipse cx="50" cy="25" rx="6" ry="8" />
                  </g>
                  <g fill="currentColor" transform="translate(112 108) rotate(16 30 30)">
                    <ellipse cx="30" cy="40" rx="13" ry="15" />
                    <ellipse cx="10" cy="25" rx="6" ry="8" />
                    <ellipse cx="23" cy="14" rx="6" ry="8" />
                    <ellipse cx="37" cy="14" rx="6" ry="8" />
                    <ellipse cx="50" cy="25" rx="6" ry="8" />
                  </g>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#breeder-paw-pattern)" />
            </svg>
            <div className="max-w-6xl mx-auto relative">
              <div className="pointer-events-none absolute right-[-40px] top-[-150px] z-20 h-[380px] w-[380px] rounded-full bg-honey-light/[0.08]" aria-hidden="true" />
              <div className="relative z-30 mb-10 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-honey-light">Unsere Züchter</p>
                  <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">Züchter entdecken</h2>
                </div>
                <Link href="/zuechter" className="whitespace-nowrap text-sm font-semibold text-honey-light hover:underline">
                  Alle Züchter →
                </Link>
              </div>

              <div className="grid grid-cols-1 items-stretch gap-7 sm:grid-cols-2 lg:grid-cols-3">
                {featuredBreeders.map((breeder, index) => {
                  const breederUrl = getBreederCanonicalUrl(breeder.subdomain, slugify(breeder.kennelName))
                  const badgeCount = Number(breeder.listings.length > 0) + Number(breeder.litters.length > 0) + Number(breeder.dogs.some((dog) => dog.sex === 'male' && dog.isStud))
                  const rotations = ['-rotate-[1.2deg]', 'rotate-[0.8deg]', '-rotate-[0.7deg]', 'rotate-[0.8deg]', '-rotate-[0.9deg]', 'rotate-[1deg]']
                  return (
                    <a key={breeder.id} href={breederUrl} className={`group relative block ${rotations[index % rotations.length]}`}>
                      <div className="absolute inset-0 translate-x-[7px] translate-y-[7px] rounded-[22px] bg-[#173A2A]" aria-hidden="true" />
                      <div className="relative flex h-full flex-col overflow-hidden rounded-[22px] bg-white">
                        <div className="h-32 flex-shrink-0 overflow-hidden">
                          <img
                            src={breeder.media[0]?.url}
                            alt={breeder.kennelName}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>

                        <div className="absolute right-4 top-24 z-40 flex gap-2">
                          {breeder.listings.length > 0 && (
                            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full border-[3px] border-white bg-honey text-center text-white shadow-lg">
                              <span className="text-[8px] font-black uppercase leading-tight">Welpen</span>
                              <span className="text-[8px] font-black uppercase leading-tight">verfügbar</span>
                            </div>
                          )}
                          {breeder.litters.length > 0 && (
                            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full border-[3px] border-white bg-[#77B9E5] text-center text-white shadow-lg">
                              <span className="text-[8px] font-black uppercase leading-tight">Wurf</span>
                              <span className="text-[8px] font-black uppercase leading-tight">
                                {breeder.litters[0].status === 'pregnant' ? 'erwartet' : 'geplant'}
                              </span>
                            </div>
                          )}
                          {breeder.dogs.some((dog) => dog.sex === 'male' && dog.isStud) && (
                            <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full border-[3px] border-white bg-forest text-center text-white shadow-lg">
                              <span className="text-[8px] font-black uppercase leading-tight">Deckrüde</span>
                              <span className="text-[8px] font-black uppercase leading-tight">verfügbar</span>
                            </div>
                          )}
                        </div>

                        <div className={`relative z-30 min-h-[108px] flex-1 bg-white p-4 ${badgeCount > 0 ? 'pt-10' : 'pt-3'}`}>
                          <p className="font-serif text-lg font-bold text-forest">{breeder.kennelName}</p>
                          {breeder.dogs[0]?.breed?.nameDe && (
                            <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-forest">
                              {breeder.dogs[0].breed.nameDe}
                            </p>
                          )}
                          {(breeder.city || breeder.state) && (
                            <p className="mt-2 text-[11px] text-stone-400">{[breeder.city, breeder.state].filter(Boolean).join(', ')}</p>
                          )}
                        </div>
                      </div>
                    </a>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── Hunde zu vergeben ── */}
        {adultListings.length > 0 && (
          <section className="border-y border-forest/10 bg-[#EAF3EC] px-4 py-16">
            <div className="max-w-6xl mx-auto">
              <div className="mb-10 flex items-end justify-between gap-4">
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-forest">Hunde jeden Alters</p>
                  <h2 className="font-serif text-3xl font-bold text-stone-900 sm:text-4xl">Erwachsene Hunde</h2>
                </div>
                <Link href="/hunde" className="whitespace-nowrap text-sm font-semibold text-forest hover:underline">
                  Alle anzeigen →
                </Link>
              </div>
              <div className="grid grid-cols-2 items-stretch gap-6 sm:gap-7 md:grid-cols-3">
                {adultListings.slice(0, 6).map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    slug={listing.slug}
                    listingType={listing.type}
                    breedName={listing.breed.nameDe}
                    kennelName={listing.breeder.kennelName}
                    puppyName={listing.title}
                    city={listing.breeder.city}
                    state={listing.breeder.state}
                    priceCents={listing.priceCents}
                    isBoosted={!!listing.boostExpiresAt && listing.boostExpiresAt > now}
                    imageUrl={listing.media[0]?.url}
                    tint={listing.sex === 'male' ? 'male' : listing.sex === 'female' ? 'female' : null}
                    sticker
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Trust-Sektion ── */}
        <section className="bg-cream px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-forest">Gut zu wissen</p>
            <h2 className="mb-8 font-serif text-3xl font-bold text-forest sm:text-4xl">Warum Whelply?</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  title: 'Nur reinrassige Welpen',
                  desc: 'Keine Hybridrassen und keine selbstgemachten Ahnentafeln: Bei uns inserieren ausschließlich Züchter aus seriösen Vereinsverbänden.',
                },
                {
                  title: 'Seriös und sicher',
                  desc: 'Unser Ziel ist es, den Verkauf von Welpen so seriös und sicher wie möglich zu machen – mit klaren Regeln für jede Zuchtstätte.',
                },
                {
                  title: 'Transparent auf einen Blick',
                  desc: 'Elterntiere, Gesundheitstests und Aufzucht: Auf einen Blick erkennst du, wie die Welpen aufwachsen.',
                },
              ].map((item) => (
                <div key={item.title}>
                  <div className="mb-4 h-1 w-12 bg-honey" aria-hidden="true" />
                  <h3 className="mb-2 font-serif text-xl font-bold text-forest">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-stone-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Züchter-CTA ── */}
        <section className="bg-honey px-4 py-14">
          <div className="max-w-6xl mx-auto flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            {session?.user ? (
              <>
                <div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-forest-dark">Für Züchter</p>
                  <h2 className="mb-4 font-serif text-4xl font-bold text-forest-dark">Willkommen zurück.</h2>
                  <p className="max-w-2xl leading-relaxed text-forest-dark">
                    Verwalte deine Inserate, Würfe und Zuchthunde in deinem Dashboard.
                  </p>
                </div>
                <Link
                  href="/dashboard"
                  className="inline-flex flex-shrink-0 items-center justify-center rounded-xl bg-forest-dark px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-forest"
                >
                  Zum Dashboard
                </Link>
              </>
            ) : (
              <>
                <div>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-forest-dark">Für Züchter</p>
                  <h2 className="mb-4 font-serif text-4xl font-bold text-forest-dark">Deine Zuchtstätte auf Whelply.</h2>
                  <p className="max-w-2xl leading-relaxed text-forest-dark">
                    Profil anlegen, Würfe eintragen und Käufer in ganz Deutschland erreichen. Kostenlos, ohne versteckte Gebühren.
                  </p>
                </div>
                <div className="flex flex-shrink-0 flex-col items-center gap-4 sm:flex-row md:flex-col">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-xl bg-forest-dark px-8 py-4 text-sm font-bold text-white transition-colors hover:bg-forest"
                  >
                    Kostenlos registrieren
                  </Link>
                  <Link href="/welpen" className="text-sm font-bold text-forest-dark hover:underline">
                    Inserate durchsuchen →
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
