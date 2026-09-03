// Boost-Geschäftslogik: Preis, Frequenz-Deckel, Aktivierung (idempotent)
import { prisma } from '@/lib/prisma'

export const BOOST_PRICE_CENTS = 100 // 1,00 €
export const BOOST_DURATION_HOURS = 24
export const BOOST_COOLDOWN_DAYS = 7 // max. 1 Boost pro Woche pro Inserat
export const BOOST_MAX_SLOTS = 5 // sichtbare Plätze im "Empfohlen"-Block

// Prüft, ob ein Inserat geboostet werden darf.
// Rückgabe: { allowed: true } oder { allowed: false, reason, nextAvailableAt }
export async function checkBoostEligibility(listingId: string): Promise<
  | { allowed: true }
  | { allowed: false; reason: string; nextAvailableAt?: Date }
> {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { status: true, boostExpiresAt: true },
  })
  if (!listing) return { allowed: false, reason: 'Inserat nicht gefunden.' }
  if (listing.status !== 'available') {
    return { allowed: false, reason: 'Nur aktive Inserate können geboostet werden.' }
  }
  if (listing.boostExpiresAt && listing.boostExpiresAt > new Date()) {
    return { allowed: false, reason: 'Für dieses Inserat läuft bereits ein Boost.' }
  }

  // Frequenz-Deckel: letzter Boost jünger als BOOST_COOLDOWN_DAYS?
  const lastBoost = await prisma.boost.findFirst({
    where: { listingId },
    orderBy: { paidAt: 'desc' },
    select: { paidAt: true },
  })
  if (lastBoost) {
    const nextAvailableAt = new Date(lastBoost.paidAt.getTime() + BOOST_COOLDOWN_DAYS * 24 * 60 * 60 * 1000)
    if (nextAvailableAt > new Date()) {
      return {
        allowed: false,
        reason: `Pro Inserat ist nur 1 Boost pro Woche möglich.`,
        nextAvailableAt,
      }
    }
  }

  return { allowed: true }
}

// Aktiviert einen Boost nach erfolgreicher Zahlung.
// Idempotent: gleiche Stripe-Session wird nicht doppelt gebucht.
export async function activateBoost(listingId: string, stripeSessionId: string) {
  const existing = await prisma.boost.findFirst({
    where: { stripePaymentId: stripeSessionId },
  })
  if (existing) return { boost: existing, alreadyActive: true }

  const expiresAt = new Date(Date.now() + BOOST_DURATION_HOURS * 60 * 60 * 1000)

  const boost = await prisma.boost.create({
    data: {
      listingId,
      boostType: 'top_24h',
      amountCents: BOOST_PRICE_CENTS,
      stripePaymentId: stripeSessionId,
      expiresAt,
    },
  })

  await prisma.listing.update({
    where: { id: listingId },
    data: {
      boostExpiresAt: expiresAt,
      boostImpressions: 0, // Impressionen-Zähler für diesen Boost zurücksetzen
    },
  })

  return { boost, alreadyActive: false }
}
