import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SearchForm from '@/components/SearchForm'
import ListingCard from '@/components/ListingCard'
import Link from 'next/link'

export default async function Home() {
  const breeds = await prisma.breed.findMany({
    orderBy: { nameDe: 'asc' },
    select: { id: true, nameDe: true, slug: true },
  }).catch(() => [])

  const listings = await prisma.listing.findMany({
    where: { status: 'available', type: 'puppy' },
    orderBy: [{ boostExpiresAt: 'desc' }, { createdAt: 'desc' }],
    take: 12,
    include: {
      breed: { select: { nameDe: true } },
      breeder: { select: { kennelName: true, city: true, state: true } },
    },
  }).catch(() => [])

  const [totalListings, totalBreeders] = await Promise.all([
    prisma.listing.count({ where: { status: 'available' } }).catch(() => 0),
    prisma.breederProfile.count().catch(() => 0),
  ])

  const now = new Date()

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-stone-50 border-b border-stone-200 py-16 md:py-24 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-sm font-medium text-stone-500 mb-4 tracking-wide uppercase">
              Nur FCI-anerkannte Rassen · Geprüfte Züchter
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-stone-900 mb-4 leading-tight">
              Finde deinen Rassewelpen
            </h1>
            <p className="text-lg text-stone-500 mb-10 max-w-xl mx-auto">
              Whelply verbindet dich mit seriösen VDH-Züchtern in ganz Deutschland.
              Kein Tierschutz, keine Mischlinge — nur echte Rassehunde mit Stammbaum.
            </p>
            <div className="flex justify-center">
              <SearchForm breeds={breeds} />
            </div>
          </div>
        </section>

        <section className="border-b border-stone-100 bg-white py-6 px-4">
          <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-8 md:gap-16">
            <div className="text-center">
              <p className="text-2xl font-bold text-stone-900">{totalListings}</p>
              <p className="text-sm text-stone-500">aktive Inserate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-stone-900">{totalBreeders}</p>
              <p className="text-sm text-stone-500">Züchter</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-stone-900">{breeds.length}</p>
              <p className="text-sm text-stone-500">Rassen</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-stone-900">100%</p>
              <p className="text-sm text-stone-500">FCI-anerkannt</p>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-stone-900">Aktuelle Welpen</h2>
              <p className="text-stone-500 text-sm mt-1">Zuletzt eingetragene Inserate</p>
            </div>
            <Link href="/welpen" className="text-sm text-stone-600 hover:text-stone-900 font-medium transition-colors">
              Alle anzeigen →
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-20 bg-stone-50 rounded-2xl border border-stone-200">
              <div className="text-5xl mb-4">🐾</div>
              <p className="text-stone-600 font-medium mb-2">Noch keine Inserate</p>
              <p className="text-stone-400 text-sm mb-6">Sei der erste Züchter und trag deinen Wurf ein.</p>
              <Link href="/register" className="bg-stone-900 text-white text-sm px-6 py-2.5 rounded-lg hover:bg-stone-700 transition-colors font-medium">
                Jetzt als Züchter registrieren
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  id={listing.id}
                  breedName={listing.breed.nameDe}
                  kennelName={listing.breeder.kennelName}
                  city={listing.breeder.city}
                  state={listing.breeder.state}
                  priceCents={listing.priceCents}
                  isBoosted={!!listing.boostExpiresAt && listing.boostExpiresAt > now}
                />
              ))}
            </div>
          )}
        </section>

        <section className="bg-stone-50 border-y border-stone-200 py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-stone-900 text-center mb-12">Warum Whelply?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { title: 'Nur echte Züchter', desc: 'Jeder Züchter muss seinen FCI-Zwingernamen angeben. Vermehrer und Händler haben keinen.' },
                { title: 'Nur FCI-Rassen', desc: 'Kein Maltipoo, kein Labradoodle. Nur die ~355 offiziell anerkannten Rassen der FCI.' },
                { title: 'Kostenlos für Züchter', desc: 'Basis-Account immer gratis. Mehr Sichtbarkeit gibt es schon ab 1 € — kein Abo nötig.' },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-2xl border border-stone-200 p-6">
                  <div className="w-8 h-8 bg-stone-900 rounded-lg mb-4" />
                  <h3 className="font-semibold text-stone-900 mb-2">{item.title}</h3>
                  <p className="text-stone-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-stone-900 mb-3">Du bist Züchter?</h2>
          <p className="text-stone-500 mb-8 max-w-lg mx-auto">
            Erstelle kostenlos dein Züchter-Profil, trage deine Würfe ein und erreiche Käufer in ganz Deutschland.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="bg-stone-900 text-white px-8 py-3 rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors">
              Kostenlos registrieren
            </Link>
            <Link href="/welpen" className="border border-stone-300 text-stone-700 px-8 py-3 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors">
              Inserate durchsuchen
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
