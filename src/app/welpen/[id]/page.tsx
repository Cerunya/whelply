import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default async function WelpenDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id, status: 'available' },
    include: {
      breed: true,
      breeder: true,
    },
  })

  if (!listing) notFound()

  const price = listing.priceCents
    ? `${(listing.priceCents / 100).toLocaleString('de-DE')} €`
    : 'Preis auf Anfrage'

  const sex =
    listing.sex === 'male' ? 'Rüde' : listing.sex === 'female' ? 'Hündin' : 'Nicht angegeben'

  const location = [listing.breeder.city, listing.breeder.state]
    .filter(Boolean)
    .join(', ')

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Breadcrumb */}
          <p className="text-sm text-stone-400 mb-6">
            <Link href="/" className="hover:text-stone-700">Startseite</Link>
            {' / '}
            <Link href="/welpen" className="hover:text-stone-700">Welpen</Link>
            {' / '}
            <span className="text-stone-700">{listing.breed.nameDe}</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Foto */}
            <div className="bg-cream-dark rounded-2xl aspect-square flex items-center justify-center border border-cream-deep">
              <div className="text-center text-stone-300">
                <svg className="w-20 h-20 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm">Noch kein Foto</p>
              </div>
            </div>

            {/* Infos */}
            <div>
              <p className="text-xs font-semibold text-forest uppercase tracking-wider mb-2">
                {listing.breed.nameDe}
              </p>
              <h1 className="font-serif text-3xl font-bold text-stone-900 mb-1">
                {listing.breeder.kennelName}
              </h1>
              {location && (
                <p className="text-stone-400 text-sm mb-6 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {location}
                </p>
              )}

              <div className="bg-white rounded-2xl border border-cream-deep p-5 space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400">Rasse</span>
                  <span className="font-medium text-stone-800">{listing.breed.nameDe}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stone-400">Geschlecht</span>
                  <span className="font-medium text-stone-800">{sex}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-cream-deep pt-3">
                  <span className="text-stone-400">Preis</span>
                  <span className="font-bold text-forest text-base">{price}</span>
                </div>
              </div>

              {listing.description && (
                <div className="mb-6">
                  <h2 className="font-semibold text-stone-800 mb-2 text-sm">Beschreibung</h2>
                  <p className="text-stone-500 text-sm leading-relaxed">{listing.description}</p>
                </div>
              )}

              {/* Kontakt */}
              <div className="bg-forest rounded-2xl p-5 text-white">
                <p className="font-serif font-bold text-lg mb-1">{listing.breeder.kennelName}</p>
                {listing.breeder.verificationLevel !== 'none' && (
                  <p className="text-white/70 text-xs mb-3">✓ Verifizierter Züchter</p>
                )}
                {listing.breeder.phone ? (
                  <a
                    href={`tel:${listing.breeder.phone}`}
                    className="block w-full bg-honey text-white text-center py-3 rounded-xl text-sm font-bold hover:bg-honey-light transition-colors mb-2"
                  >
                    Anrufen
                  </a>
                ) : null}
                <Link
                  href={`/zuechter/${listing.breeder.kennelName.toLowerCase().replace(/\s+/g, '-')}`}
                  className="block w-full bg-white/10 text-white text-center py-3 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  Züchter-Profil ansehen
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
