import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { FCI_GROUPS } from '@/lib/fci-groups'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ListingCard from '@/components/ListingCard'
import Link from 'next/link'

// Immer dynamisch rendern, damit Aenderungen (Theme, Status, neue Inserate etc.)
// sofort sichtbar sind, ohne dass der Full Route Cache veraltete Daten zeigt.
export const dynamic = 'force-dynamic'

import { renderMarkdown, extractAsins } from '@/lib/render-markdown'

export default async function RassenDetailPage({
  params,
}: {
  params: { slug: string }
}) {
  const breed = await prisma.breed.findUnique({
    where: { slug: params.slug },
  })

  if (!breed) notFound()

  // Rassen-Artikel (falls vorhanden)
  const article = await prisma.article.findFirst({
    where: { breedId: breed.id, category: 'rassen', isPublished: true },
  })

  // Produkte für :::produkt[ASIN] Shortcodes laden
  const productsMap = new Map()
  if (article) {
    const asins = extractAsins(article.content)
    if (asins.length > 0) {
      const products = await prisma.product.findMany({ where: { asin: { in: asins } } })
      products.forEach((p) => productsMap.set(p.asin, p))
    }
  }

  const listings = await prisma.listing.findMany({
    where: { breedId: breed.id, status: 'available', type: 'puppy' },
    include: {
      breeder: { select: { kennelName: true, displayName: true, city: true, state: true } },
      media: { where: { isPrimary: true }, take: 1, select: { url: true } },
    },
    orderBy: [{ boostExpiresAt: 'desc' }, { createdAt: 'desc' }],
  })

  // Züchter dieser Rasse (über Inserate, eindeutig)
  const breederIds = new Set<string>()
  const breeders: { kennelName: string; displayName: string | null; city: string | null; state: string | null }[] = []
  for (const l of listings) {
    const key = l.breeder.kennelName
    if (!breederIds.has(key)) {
      breederIds.add(key)
      breeders.push(l.breeder)
    }
  }

  const now = new Date()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <section className="bg-forest px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <p className="text-sm mb-2">
              <Link href="/rassen" className="text-white/60 hover:text-white">Rasselexikon</Link>
              {' / '}
              <span className="text-white/90">{breed.nameDe}</span>
            </p>
            <h1 className="font-serif text-3xl font-bold text-white mb-2">
              {breed.nameDe}
            </h1>
            <p className="text-white/70 text-sm">
              FCI-Gruppe {breed.fciGroup} — {FCI_GROUPS[breed.fciGroup]}
              {' · '}FCI-Standard Nr. {breed.fciNumber}
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-10">
          {/* Verfügbare Welpen */}
          <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">
            Verfügbare Welpen
          </h2>

          {listings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-cream-deep mb-10">
              <p className="text-stone-400 text-sm">
                Aktuell keine {breed.nameDe}-Welpen verfügbar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  breedName={breed.nameDe}
                  kennelName={listing.breeder.displayName || listing.breeder.kennelName}
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

          {/* Rassen-Artikel */}
          {article && (
            <div className="bg-white rounded-2xl border border-cream-deep p-8 mb-10">
              <div className="prose-stone" dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content, productsMap) }} />
            </div>
          )}

          {/* Züchter dieser Rasse */}
          {breeders.length > 0 && (
            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">
                Züchter für {breed.nameDe}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {breeders.map((breeder) => {
                  const name = breeder.displayName || breeder.kennelName
                  const location = [breeder.city, breeder.state].filter(Boolean).join(', ')
                  return (
                    <Link
                      key={breeder.kennelName}
                      href={`/zuechter/${slugify(breeder.kennelName)}`}
                      className="bg-white rounded-xl border border-cream-deep px-5 py-3 hover:border-forest/30 transition-colors flex items-center justify-between"
                    >
                      <span className="font-medium text-stone-800 text-sm">{name}</span>
                      {location && <span className="text-xs text-stone-400">{location}</span>}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          <div className="text-center mt-10">
            <Link href="/rassen" className="text-sm text-forest font-semibold hover:underline">
              ← Alle Rassen
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
