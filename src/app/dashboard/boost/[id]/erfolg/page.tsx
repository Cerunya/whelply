import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import DashboardHeader from '@/components/DashboardHeader'
import { isStripeConfigured, getCheckoutSession } from '@/lib/stripe'
import { activateBoost } from '@/lib/boost'

export const dynamic = 'force-dynamic'

export default async function BoostErfolgPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { session_id?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!breeder) redirect('/dashboard')

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { breed: { select: { nameDe: true } } },
  })
  if (!listing || listing.breederId !== breeder.id) notFound()

  // Zahlung bei Stripe verifizieren und Boost aktivieren.
  // (Fallback zur Webhook-Route — activateBoost ist idempotent.)
  let paymentOk = false
  let errorMessage: string | null = null

  if (!searchParams.session_id) {
    errorMessage = 'Keine Zahlungs-Session übergeben.'
  } else if (!isStripeConfigured()) {
    errorMessage = 'Zahlungssystem nicht konfiguriert.'
  } else {
    try {
      const checkout = await getCheckoutSession(searchParams.session_id)
      const belongsToListing =
        (checkout.metadata?.listing_id === listing.id)
      const paid = checkout.payment_status === 'paid' || checkout.payment_status === 'no_payment_required'

      if (belongsToListing && paid) {
        // Tatsächlich gezahlten Betrag übernehmen (stimmt auch nach Preisänderung im Admin)
        const amountCents = typeof checkout.amount_total === 'number' ? checkout.amount_total : undefined
        await activateBoost(listing.id, checkout.id, amountCents)
        paymentOk = true
      } else if (!paid) {
        errorMessage = 'Die Zahlung wurde noch nicht abgeschlossen.'
      } else {
        errorMessage = 'Die Zahlung konnte diesem Inserat nicht zugeordnet werden.'
      }
    } catch (err) {
      console.error('Stripe-Verifizierung fehlgeschlagen:', err)
      errorMessage = 'Die Zahlung konnte gerade nicht verifiziert werden. Falls du bezahlt hast, wird dein Boost in Kürze automatisch aktiviert.'
    }
  }

  const isBoosted = !!listing.boostExpiresAt && listing.boostExpiresAt > new Date()
  const listingTitle = listing.title || listing.breed.nameDe
  const targetPage = listing.type === 'adult_dog' ? '/hunde' : '/welpen'

  // Aktuelle Boost-Statistiken
  const lastBoost = await prisma.boost.findFirst({
    where: { listingId: listing.id },
    orderBy: { paidAt: 'desc' },
  })

  return (
    <div className="min-h-screen bg-cream font-sans">
      <DashboardHeader title="Topanzeige" backHref="/dashboard" backLabel="Dashboard" />

      <main className="max-w-2xl mx-auto px-4 py-10">
        {paymentOk && isBoosted ? (
          <>
            <div className="bg-white rounded-2xl border border-green-200 p-8 text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">Boost aktiviert!</h1>
              <p className="text-sm text-stone-500 max-w-md mx-auto">
                <strong>„{listingTitle}"</strong> erscheint jetzt 24 Stunden im Empfohlen-Bereich auf {targetPage} —
                bis {listing.boostExpiresAt!.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })},{' '}
                {listing.boostExpiresAt!.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr.
              </p>
            </div>

            {/* Auswertung */}
            <div className="bg-white rounded-2xl border border-cream-deep p-6 mb-6">
              <h2 className="font-semibold text-stone-900 mb-4">Auswertung deines Boosts</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-cream rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-stone-900 font-serif">{listing.boostImpressions}</p>
                  <p className="text-xs text-stone-400 mt-1">Einblendungen im Empfohlen-Bereich</p>
                </div>
                <div className="bg-cream rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-stone-900 font-serif">{listing.viewCount}</p>
                  <p className="text-xs text-stone-400 mt-1">Aufrufe gesamt</p>
                </div>
              </div>
              <p className="text-xs text-stone-400 mt-4">
                Der Zähler startet jetzt. Schau später wieder vorbei, um zu sehen, wie dein Boost performt.
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <Link
                href="/dashboard"
                className="bg-forest text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-forest-light transition-colors"
              >
                Zum Dashboard
              </Link>
              <Link
                href={targetPage}
                className="border-2 border-forest/20 text-forest px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-forest/5 transition-colors"
              >
                Empfohlen-Bereich ansehen →
              </Link>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center">
            <div className="text-3xl mb-3">⚠️</div>
            <h1 className="font-serif text-xl font-bold text-stone-900 mb-2">Zahlung nicht bestätigt</h1>
            <p className="text-sm text-stone-500 max-w-md mx-auto mb-6">{errorMessage}</p>
            <div className="flex gap-3 justify-center">
              <Link
                href={`/dashboard/boost/${listing.id}`}
                className="bg-forest text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-forest-light transition-colors"
              >
                Erneut versuchen
              </Link>
              <Link href="/dashboard" className="text-sm text-stone-500 hover:text-stone-700 px-4 py-2.5">
                Zum Dashboard
              </Link>
            </div>
            {lastBoost && (
              <p className="text-xs text-stone-400 mt-6">
                Letzter erfolgreicher Boost: {lastBoost.paidAt.toLocaleDateString('de-DE')}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
