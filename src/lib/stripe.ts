// Stripe REST-API Helper — bewusst OHNE stripe npm-Package (gleiches Muster wie Resend via fetch),
// damit package-lock.json nicht angefasst werden muss (npm ci im Build).
import crypto from 'crypto'

const STRIPE_API = 'https://api.stripe.com/v1'

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

function authHeader(): string {
  return `Bearer ${process.env.STRIPE_SECRET_KEY}`
}

// Stripe erwartet application/x-www-form-urlencoded mit verschachtelten Keys
// z.B. line_items[0][price_data][currency]=eur
function encodeParams(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
}

export type CheckoutSession = {
  id: string
  url: string | null
  payment_status: string // 'paid' | 'unpaid' | 'no_payment_required'
  metadata?: Record<string, string>
  amount_total?: number
}

export async function createCheckoutSession(opts: {
  listingId: string
  listingTitle: string
  amountCents: number
  successUrl: string
  cancelUrl: string
}): Promise<CheckoutSession> {
  const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: encodeParams({
      mode: 'payment',
      client_reference_id: opts.listingId,
      'metadata[listing_id]': opts.listingId,
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(opts.amountCents),
      'line_items[0][price_data][product_data][name]': `Topanzeige (24 h) — ${opts.listingTitle}`,
      'line_items[0][quantity]': '1',
      success_url: opts.successUrl,
      cancel_url: opts.cancelUrl,
    }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message || `Stripe-Fehler (${res.status})`)
  }
  return data
}

export async function getCheckoutSession(sessionId: string): Promise<CheckoutSession> {
  const res = await fetch(`${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: authHeader() },
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error?.message || `Stripe-Fehler (${res.status})`)
  }
  return data
}

// Webhook-Signatur prüfen: stripe-signature Header = "t=<ts>,v1=<sig>,..."
// Signatur = HMAC-SHA256(secret, "<t>.<payload>")
export function verifyWebhookSignature(payload: string, signatureHeader: string, secret: string): boolean {
  const parts = signatureHeader.split(',')
  let timestamp = ''
  const signatures: string[] = []
  for (const part of parts) {
    const [key, value] = part.split('=')
    if (key === 't') timestamp = value
    if (key === 'v1') signatures.push(value)
  }
  if (!timestamp || signatures.length === 0) return false

  // Zeitstempel-Toleranz: 5 Minuten (Replay-Schutz)
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp))
  if (ageSeconds > 300) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`, 'utf8')
    .digest('hex')

  return signatures.some((sig) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(sig, 'utf8'), Buffer.from(expected, 'utf8'))
    } catch {
      return false
    }
  })
}
