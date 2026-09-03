// Boost-Geschäftslogik: Preis, Frequenz-Deckel, Aktivierung (idempotent)
import { prisma } from '@/lib/prisma'

// Standardwerte — gelten, wenn in platform_settings nichts hinterlegt ist
// (oder die Tabelle noch nicht existiert). Der Admin kann beides unter
// /admin/einstellungen zur Laufzeit ändern.
export const BOOST_PRICE_CENTS = 100 // 1,00 €
export const BOOST_DURATION_HOURS = 24
export const BOOST_COOLDOWN_DAYS = 7 // max. 1 Boost pro Woche pro Inserat
export const BOOST_MAX_SLOTS = 5 // sichtbare Plätze im "Empfohlen"-Block

export type BoostSettings = {
  priceCents: number
  cooldownDays: number
}

// Liest Preis + Frequenz-Deckel aus platform_settings (Admin-Einstellungen).
// Fällt bei fehlenden/ungültigen Werten oder DB-Fehlern auf die Defaults zurück.
export async function getBoostSettings(): Promise<BoostSettings> {
  try {
    const rows = await prisma.platformSetting.findMany({
      where: { key: { in: ['boost_price_cents', 'boost_cooldown_days'] } },
    })
    const map: Record<string, string> = {}
    for (const r of rows) map[r.key] = r.value
    const priceCents = Math.round(Number(map['boost_price_cents']))
    const cooldownDays = Math.round(Number(map['boost_cooldown_days']))
    return {
      priceCents: Number.isFinite(priceCents) && priceCents >= 50 ? priceCents : BOOST_PRICE_CENTS,
      cooldownDays: Number.isFinite(cooldownDays) && cooldownDays >= 1 ? cooldownDays : BOOST_COOLDOWN_DAYS,
    }
  } catch {
    return { priceCents: BOOST_PRICE_CENTS, cooldownDays: BOOST_COOLDOWN_DAYS }
  }
}

// "1,00 €" aus Cent-Betrag
export function formatBoostPrice(priceCents: number): string {
  return (priceCents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €'
}

// Lesbares Label für den Frequenz-Deckel
export function cooldownLabel(days: number): string {
  if (days === 1) return '1 Boost pro Tag'
  if (days === 7) return '1 Boost pro Woche'
  return `1 Boost alle ${days} Tage`
}

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

  // Frequenz-Deckel: letzter Boost jünger als cooldownDays?
  const { cooldownDays } = await getBoostSettings()
  const lastBoost = await prisma.boost.findFirst({
    where: { listingId },
    orderBy: { paidAt: 'desc' },
    select: { paidAt: true },
  })
  if (lastBoost) {
    const nextAvailableAt = new Date(lastBoost.paidAt.getTime() + cooldownDays * 24 * 60 * 60 * 1000)
    if (nextAvailableAt > new Date()) {
      return {
        allowed: false,
        reason: `Pro Inserat ist nur ${cooldownLabel(cooldownDays)} möglich.`,
        nextAvailableAt,
      }
    }
  }

  return { allowed: true }
}

// Aktiviert einen Boost nach erfolgreicher Zahlung.
// Idempotent: gleiche Stripe-Session wird nicht doppelt gebucht.
// amountCents: tatsächlich gezahlter Betrag aus der Stripe-Session
// (Fallback: aktuell eingestellter Admin-Preis).
export async function activateBoost(listingId: string, stripeSessionId: string, amountCents?: number) {
  const existing = await prisma.boost.findFirst({
    where: { stripePaymentId: stripeSessionId },
  })
  if (existing) return { boost: existing, alreadyActive: true }

  const expiresAt = new Date(Date.now() + BOOST_DURATION_HOURS * 60 * 60 * 1000)
  const paidCents = amountCents && amountCents > 0
    ? amountCents
    : (await getBoostSettings()).priceCents

  const boost = await prisma.boost.create({
    data: {
      listingId,
      boostType: 'top_24h',
      amountCents: paidCents,
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
