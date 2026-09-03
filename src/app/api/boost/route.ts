import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isStripeConfigured, createCheckoutSession } from '@/lib/stripe'
import { getBoostSettings, checkBoostEligibility } from '@/lib/boost'

// POST /api/boost — Stripe-Checkout-Session für einen 24h-Boost erstellen
// Body: { listingId: string }
// Antwort: { url: string } → Weiterleitung zu Stripe Checkout
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 })
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: 'Das Zahlungssystem ist noch nicht eingerichtet. Bitte versuch es später erneut.' },
      { status: 503 }
    )
  }

  let body: { listingId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 })
  }
  if (!body.listingId) {
    return NextResponse.json({ error: 'listingId fehlt.' }, { status: 400 })
  }

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })
  if (!breeder) {
    return NextResponse.json({ error: 'Kein Züchter-Profil.' }, { status: 403 })
  }

  const listing = await prisma.listing.findUnique({
    where: { id: body.listingId },
    include: { breed: { select: { nameDe: true } } },
  })
  if (!listing || listing.breederId !== breeder.id) {
    return NextResponse.json({ error: 'Inserat nicht gefunden.' }, { status: 404 })
  }

  const eligibility = await checkBoostEligibility(listing.id)
  if (!eligibility.allowed) {
    return NextResponse.json(
      { error: eligibility.reason, nextAvailableAt: eligibility.nextAvailableAt ?? null },
      { status: 409 }
    )
  }

  // Preis aus den Admin-Einstellungen (platform_settings, Fallback: 1,00 €)
  const { priceCents } = await getBoostSettings()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://whelply.de'
  const listingTitle = listing.title || listing.breed.nameDe

  try {
    const checkout = await createCheckoutSession({
      listingId: listing.id,
      listingTitle,
      amountCents: priceCents,
      successUrl: `${appUrl}/dashboard/boost/${listing.id}/erfolg?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${appUrl}/dashboard/boost/${listing.id}`,
    })
    return NextResponse.json({ url: checkout.url })
  } catch (err) {
    console.error('Stripe Checkout fehlgeschlagen:', err)
    return NextResponse.json(
      { error: 'Die Zahlung konnte nicht gestartet werden. Bitte versuch es später erneut.' },
      { status: 502 }
    )
  }
}
