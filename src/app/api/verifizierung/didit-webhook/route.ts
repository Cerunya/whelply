import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyDiditWebhook } from '@/lib/didit'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  // Webhook-Signatur verifizieren
  const signature = req.headers.get('x-signature') || req.headers.get('x-signature-v2') || ''
  const isValid = await verifyDiditWebhook(rawBody, signature)

  if (!isValid) {
    console.warn('Didit webhook: invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const sessionId = payload.session_id
  const status = payload.status // 'Approved', 'Declined', 'In Review', etc.

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  // Züchter anhand der Session-ID finden
  const breeder = await prisma.breederProfile.findFirst({
    where: { diditSessionId: sessionId },
  })

  if (!breeder) {
    console.warn(`Didit webhook: no breeder for session ${sessionId}`)
    return NextResponse.json({ ok: true }) // 200 zurückgeben, damit Didit nicht erneut sendet
  }

  // Status aktualisieren
  const normalizedStatus = status?.toLowerCase()

  if (normalizedStatus === 'approved' || normalizedStatus === 'success') {
    await prisma.breederProfile.update({
      where: { id: breeder.id },
      data: { diditStatus: 'approved' },
    })
  } else if (normalizedStatus === 'declined' || normalizedStatus === 'rejected') {
    await prisma.breederProfile.update({
      where: { id: breeder.id },
      data: { diditStatus: 'declined' },
    })
  }
  // 'In Review' und andere Status → wir warten einfach auf den nächsten Webhook

  return NextResponse.json({ ok: true })
}
