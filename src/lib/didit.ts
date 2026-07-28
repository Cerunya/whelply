/**
 * Didit Identity Verification API Helper
 * Docs: https://docs.didit.me
 */

const API_KEY = process.env.DIDIT_API_KEY!
const WEBHOOK_SECRET = process.env.DIDIT_WEBHOOK_SECRET!
const WORKFLOW_ID = process.env.DIDIT_WORKFLOW_ID!
const BASE_URL = 'https://verification.didit.me'

/** Erstellt eine neue Didit-Verifizierungssession */
export async function createDiditSession(breederId: string, callbackUrl: string) {
  const res = await fetch(`${BASE_URL}/v3/session/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      workflow_id: WORKFLOW_ID,
      vendor_data: breederId,
      callback: callbackUrl,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Didit session error: ${res.status} ${err}`)
  }

  return res.json() as Promise<{
    session_id: string
    url: string
    status: string
  }>
}

/** Holt den Status einer Didit-Session */
export async function getDiditSession(sessionId: string) {
  const res = await fetch(`${BASE_URL}/v3/session/${sessionId}/decision/`, {
    headers: { 'x-api-key': API_KEY },
  })

  if (!res.ok) return null
  return res.json()
}

/** Verifiziert die HMAC-Signatur eines Didit-Webhooks */
export async function verifyDiditWebhook(rawBody: string, signatureHeader: string): Promise<boolean> {
  if (!WEBHOOK_SECRET || !signatureHeader) return false

  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody))
    const computed = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    return computed === signatureHeader
  } catch {
    return false
  }
}
