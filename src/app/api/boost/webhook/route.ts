import { NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/stripe'
import { activateBoost } from '@/lib/boost'

// POST /api/boost/webhook — Stripe-Webhook (checkout.session.completed)
// Muss in Stripe Dashboard als Endpoint eingetragen werden:
// https://whelply.de/api/boost/webhook (Event: checkout.session.completed)
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'Webhook nicht konfiguriert.' }, { status: 503 })
  }

  const payload = await request.text()
  const signature = request.headers.get('stripe-signature') || ''

  if (!verifyWebhookSignature(payload, signature, secret)) {
    return NextResponse.json({ error: 'Ungültige Signatur.' }, { status: 400 })
  }

  let event: { type?: string; data?: { object?: any } }
  try {
    event = JSON.parse(payload)
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON.' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const obj = event.data?.object
    const listingId = obj?.metadata?.listing_id || obj?.client_reference_id
    const paid = obj?.payment_status === 'paid' || obj?.payment_status === 'no_payment_required'

    if (listingId && paid) {
      try {
        await activateBoost(listingId, obj.id)
      } catch (err) {
        console.error('Boost-Aktivierung via Webhook fehlgeschlagen:', err)
        // 500 → Stripe versucht es erneut (Retry-Mechanismus)
        return NextResponse.json({ error: 'Aktivierung fehlgeschlagen.' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ received: true })
}
