import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import DashboardHeader from '@/components/DashboardHeader'
import BoostKaufButton from '@/components/BoostKaufButton'
import { BOOST_PRICE_CENTS, BOOST_MAX_SLOTS, BOOST_COOLDOWN_DAYS, checkBoostEligibility } from '@/lib/boost'

export const dynamic = 'force-dynamic'

export default async function BoostPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!breeder) redirect('/dashboard')

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      breed: { select: { nameDe: true } },
      media: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], take: 1, select: { url: true } },
      boosts: { orderBy: { paidAt: 'desc' }, take: 1, select: { paidAt: true } },
    },
  })
  if (!listing || listing.breederId !== breeder.id) notFound()

  const eligibility = await checkBoostEligibility(listing.id)
  const priceLabel = (BOOST_PRICE_CENTS / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €'
  const listingTitle = listing.title || listing.breed.nameDe
  const targetPage = listing.type === 'adult_dog' ? '/hunde' : '/welpen'

  return (
    <div className="min-h-screen bg-cream font-sans">
      <DashboardHeader title="Topanzeige buchen" backHref="/dashboard" backLabel="Dashboard" />

      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Inserat-Vorschau */}
        <div className="bg-white rounded-2xl border border-cream-deep p-4 mb-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-cream-dark overflow-hidden flex items-center justify-center flex-shrink-0">
            {listing.media[0]?.url ? (
              <img src={listing.media[0].url} alt="" className="w-full h-full object-cover" />
            ) : (
              <svg className="w-8 h-8 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            )}
          </div>
          <div>
            <p className="font-semibold text-stone-900">{listingTitle}</p>
            <p className="text-xs text-stone-400">
              {listing.title && `${listing.breed.nameDe} · `}
              {listing.priceCents ? `${(listing.priceCents / 100).toLocaleString('de-DE')} €` : 'Preis auf Anfrage'}
              {' · '}{listing.viewCount} Aufrufe
            </p>
          </div>
        </div>

        {eligibility.allowed ? (
          <>
            {/* Was der Boost bringt — ehrliche Produktbeschreibung */}
            <div className="bg-white rounded-2xl border border-honey/40 p-6 mb-6">
              <h1 className="font-serif text-2xl font-bold text-stone-900 mb-4">
                Topanzeige — 24 Stunden im Empfohlen-Bereich
              </h1>
              <ul className="space-y-3 text-sm text-stone-600">
                <li className="flex gap-3">
                  <span className="text-honey flex-shrink-0">★</span>
                  <span>
                    Dein Inserat erscheint 24 Stunden im <strong>„Empfohlen"-Bereich über den normalen Suchergebnissen</strong> auf der Seite {targetPage} — passend zu den Filtern des Suchenden (Rasse, Ort, Bundesland).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-honey flex-shrink-0">★</span>
                  <span>
                    Der Empfohlen-Bereich zeigt <strong>maximal {BOOST_MAX_SLOTS} Inserate</strong>. Sind mehr Inserate geboostet, rotieren sie fair durch — jedes Inserat bekommt anteilig Impressionen. Ein bestimmter Platz (z.&nbsp;B. Platz&nbsp;1) ist nicht garantiert.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-honey flex-shrink-0">★</span>
                  <span>
                    Nach dem Boost siehst du in deinem Dashboard, <strong>wie oft dein Inserat im Empfohlen-Bereich eingeblendet wurde</strong> und wie viele Aufrufe es hat.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-stone-300 flex-shrink-0">•</span>
                  <span className="text-stone-500">
                    Pro Inserat ist {BOOST_COOLDOWN_DAYS === 7 ? '1 Boost pro Woche' : `1 Boost alle ${BOOST_COOLDOWN_DAYS} Tage`} möglich.
                  </span>
                </li>
              </ul>
              <div className="mt-6 pt-6 border-t border-cream-deep">
                <BoostKaufButton listingId={listing.id} priceLabel={priceLabel} />
                <p className="text-xs text-stone-400 text-center mt-3">
                  Sichere Zahlung über Stripe (Kreditkarte, SEPA, giropay). Kein Abo — einmalige Zahlung.
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-cream-deep p-6 text-center">
            <div className="text-3xl mb-3">⏳</div>
            <h1 className="font-serif text-xl font-bold text-stone-900 mb-2">Boost aktuell nicht möglich</h1>
            <p className="text-sm text-stone-500 mb-1">{eligibility.reason}</p>
            {eligibility.nextAvailableAt && (
              <p className="text-sm text-stone-500 mb-4">
                Nächster Boost möglich ab{' '}
                <strong>
                  {eligibility.nextAvailableAt.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
                </strong>
              </p>
            )}
            <Link href="/dashboard" className="text-sm text-forest font-semibold hover:underline">
              ← Zurück zum Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
