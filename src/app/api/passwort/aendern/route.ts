import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { sendPasswordChangeConfirmation } from '@/lib/mail'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  }

  const { currentPassword, newPassword } = await req.json()
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Alle Felder sind Pflicht' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Neues Passwort muss mindestens 8 Zeichen haben' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'Nutzer nicht gefunden' }, { status: 404 })

  // Altes Passwort prüfen
  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Aktuelles Passwort ist falsch' }, { status: 403 })
  }

  // Rate limiting: max 3 offene Anfragen
  const recentRequests = await prisma.passwordChangeRequest.count({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
  })
  if (recentRequests >= 3) {
    return NextResponse.json({ error: 'Zu viele Anfragen. Bitte warte etwas.' }, { status: 429 })
  }

  // Neuen Hash erstellen + Token generieren
  const newHash = await bcrypt.hash(newPassword, 12)
  const token = randomUUID()
  const tokenHash = await bcrypt.hash(token, 10)

  await prisma.passwordChangeRequest.create({
    data: {
      userId: user.id,
      newPasswordHash: newHash,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 Min
    },
  })

  // Bestätigungsmail senden
  const sent = await sendPasswordChangeConfirmation(user.email, token)
  if (!sent) {
    return NextResponse.json({ error: 'E-Mail konnte nicht gesendet werden' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Bestätigungsmail gesendet' })
}
