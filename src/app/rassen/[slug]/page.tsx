import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { getBreederCanonicalUrl } from '@/lib/subdomain'
import { FCI_GROUPS } from '@/lib/fci-groups'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ListingCard from '@/components/ListingCard'
import Link from 'next/link'
import { renderMarkdown, extractAsins, extractFonts } from '@/lib/render-markdown'
import FontLoader from '@/components/FontLoader'

export const dynamic = 'force-dynamic'

export default async function RassenDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const breed = await prisma.breed.findUnique({
    where: { slug: params.slug },
  })

  if (!breed) notFound()

  const article = await prisma.article.findFirst({
    where: { breedId: breed.id, category: 'rassen', isPublished: true },
  })

  const productsMap = new Map()
  if (article) {
    const asins = extractAsins(article.content)
    if (asins.length > 0) {
      const products = await prisma.product.findMany({ where: { asin: { in: asins } } })
      products.forEach((product) => productsMap.set(product.asin, product))
    }
  }

  const usedFonts = article ? extractFonts(article.content) : []
  const now = new Date()
  const listingInclude = {
    breed: { select: { nameDe: true } },
    breeder: { select: { id: true, kennelName: true, displayName: true, city: true, state: true, subdomain: true } },
    media: { where: { isPrimary: true }, take: 1, select: { url: true } },
  } as const

  const [puppies, adultDogs] = await Promise.all([
    prisma.listing.findMany({
      where: { breedId: breed.id, status: 'available', type: 'puppy', breeder: { isActive: true } },
      include: listingInclude,
      orderBy: [{ boostExpiresAt: 'desc' }, { createdAt: 'desc' }],
    }),
    prisma.listing.findMany({
      where: { breedId: breed.id, status: 'available', type: 'adult_dog', breeder: { isActive: true } },
      include: listingInclude,
      orderBy: [{ boostExpiresAt: 'desc' }, { createdAt: 'desc' }],
    }),
  ])

  // Nur Züchter mit aktuell verfügbaren Welpen dieser Rasse anzeigen.
  const breederIds = new Set<string>()
  const breeders: (typeof puppies)[number]['breeder'][] = []
  for (const listing of puppies) {
    if (!breederIds.has(listing.breeder.id)) {
      breederIds.add(listing.breeder.id)
      breeders.push(listing.breeder)
    }
  }

  return (
    <>
      <FontLoader fonts={usedFonts} />
      <Navbar />
      <main className="min-h-screen bg-cream">
        <section className="bg-forest px-4 py-12">
          <div className="mx-auto max-w-6xl">
            <p className="mb-2 text-sm">
              <Link href="/rassen" className="text-white/60 hover:text-white">Rasselexikon</Link>
              {' / '}
              <span className="text-white/90">{breed.nameDe}</span>
            </p>
            <h1 className="mb-2 font-serif text-3xl font-bold text-white sm:text-4xl">{breed.nameDe}</h1>
            <p className="text-sm text-white/70">
              FCI-Gruppe {breed.fciGroup} — {FCI_GROUPS[breed.fciGroup]}
              {' · '}FCI-Standard Nr. {breed.fciNumber}
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-10">
          {article && (
            <Link
              href="#rasseportraet"
              className="group mb-12 flex items-center justify-between gap-5 rounded-2xl border border-cream-deep bg-white p-5 shadow-[7px_7px_0_#EDE4CE] transition-all hover:-translate-y-0.5 hover:border-forest sm:p-6"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-forest text-honey-light">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.25A4.25 4.25 0 0 0 7.75 2H3v15.5h4.75A4.25 4.25 0 0 1 12 21.75m0-15.5A4.25 4.25 0 0 1 16.25 2H21v15.5h-4.75A4.25 4.25 0 0 0 12 21.75m0-15.5v15.5" />
                  </svg>
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-honey">Rassewissen</p>
                  <h2 className="mt-1 font-serif text-xl font-bold text-forest sm:text-2xl">{breed.nameDe}-Rasseporträt ansehen</h2>
                  <p className="mt-1 text-sm text-stone-500">Wesen, Haltung, Pflege und Besonderheiten der Rasse.</p>
                </div>
              </div>
              <svg className="h-6 w-6 flex-shrink-0 text-honey transition-transform group-hover:translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-6-6 6 6 6-6" />
              </svg>
            </Link>
          )}

          <section aria-labelledby="verfuegbare-welpen">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 id="verfuegbare-welpen" className="font-serif text-2xl font-bold text-stone-900">Verfügbare Welpen</h2>
              <Link href={`/welpen?rasse=${breed.slug}`} className="text-sm font-semibold text-forest hover:underline">Alle anzeigen →</Link>
            </div>
            {puppies.length === 0 ? (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 py-16 text-center">
                <p className="text-sm text-stone-400">Aktuell keine {breed.nameDe}-Welpen verfügbar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 items-stretch gap-5 md:grid-cols-3">
                {puppies.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    slug={listing.slug}
                    listingType={listing.type}
                    breedName={breed.nameDe}
                    kennelName={listing.breeder.displayName || listing.breeder.kennelName}
                    puppyName={listing.title}
                    city={listing.breeder.city}
                    state={listing.breeder.state}
                    priceCents={listing.priceCents}
                    isBoosted={!!listing.boostExpiresAt && listing.boostExpiresAt > now}
                    imageUrl={listing.media[0]?.url}
                    tint={listing.sex === 'male' ? 'male' : listing.sex === 'female' ? 'female' : null}
                    status={listing.status}
                    sticker
                  />
                ))}
              </div>
            )}
          </section>

          <section className="mt-16" aria-labelledby="verfuegbare-hunde">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 id="verfuegbare-hunde" className="font-serif text-2xl font-bold text-stone-900">Verfügbare erwachsene Hunde</h2>
              <Link href={`/hunde?rasse=${breed.slug}`} className="text-sm font-semibold text-forest hover:underline">Alle anzeigen →</Link>
            </div>
            {adultDogs.length === 0 ? (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 py-16 text-center">
                <p className="text-sm text-stone-400">Aktuell keine erwachsenen {breed.nameDe}-Hunde verfügbar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 items-stretch gap-5 md:grid-cols-3">
                {adultDogs.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    slug={listing.slug}
                    listingType={listing.type}
                    breedName={breed.nameDe}
                    kennelName={listing.breeder.displayName || listing.breeder.kennelName}
                    puppyName={listing.title}
                    city={listing.breeder.city}
                    state={listing.breeder.state}
                    priceCents={listing.priceCents}
                    isBoosted={!!listing.boostExpiresAt && listing.boostExpiresAt > now}
                    imageUrl={listing.media[0]?.url}
                    tint={listing.sex === 'male' ? 'male' : listing.sex === 'female' ? 'female' : null}
                    status={listing.status}
                    sticker
                  />
                ))}
              </div>
            )}
          </section>

          <section className="mt-16" aria-labelledby="passende-zuechter">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 id="passende-zuechter" className="font-serif text-2xl font-bold text-stone-900">Züchter für {breed.nameDe}</h2>
              <Link href={`/zuechter?rasse=${breed.slug}`} className="text-sm font-semibold text-forest hover:underline">Züchterverzeichnis →</Link>
            </div>
            {breeders.length === 0 ? (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 py-16 text-center">
                <p className="text-sm text-stone-400">Aktuell sind keine Züchter für diese Rasse eingetragen.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {breeders.map((breeder) => {
                  const name = breeder.displayName || breeder.kennelName
                  const location = [breeder.city, breeder.state].filter(Boolean).join(', ')
                  return (
                    <Link
                      key={breeder.id}
                      href={getBreederCanonicalUrl(breeder.subdomain, slugify(breeder.kennelName))}
                      className="flex min-h-[76px] items-center justify-between gap-4 rounded-2xl border border-cream-deep bg-white px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-forest"
                    >
                      <div>
                        <span className="block font-serif text-base font-bold text-stone-800">{name}</span>
                        {location && <span className="mt-1 block text-xs text-stone-400">{location}</span>}
                      </div>
                      <svg className="h-5 w-5 flex-shrink-0 text-honey" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-6-6 6 6-6 6" />
                      </svg>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>

          {article && (
            <section id="rasseportraet" className="mt-16 scroll-mt-8 rounded-2xl border border-cream-deep bg-white p-6 sm:p-8" aria-label={`${breed.nameDe}-Rasseporträt`}>
              <div className="prose-stone" dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content, productsMap) }} />
            </section>
          )}

          <div className="mt-10 text-center">
            <Link href="/rassen" className="text-sm font-semibold text-forest hover:underline">← Alle Rassen</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
