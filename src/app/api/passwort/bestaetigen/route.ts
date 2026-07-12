import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Token fehlt' }, { status: 400 })

  // Alle nicht-abgelaufenen Requests prüfen
  const requests = await prisma.passwordChangeRequest.findMany({
    where: { expiresAt: { gt: new Date() }, usedAt: null },
  })

  let matched = null
  for (const r of requests) {
    const valid = await bcrypt.compare(token, r.tokenHash)
    if (valid) { matched = r; break }
  }

  if (!matched) {
    return NextResponse.json({ error: 'Ungültiger oder abgelaufener Link' }, { status: 400 })
  }

  // Passwort aktualisieren
  await prisma.user.update({
    where: { id: matched.userId },
    data: { passwordHash: matched.newPasswordHash },
  })

  // Request als benutzt markieren + alte Sessions löschen
  await prisma.passwordChangeRequest.update({
    where: { id: matched.id },
    data: { usedAt: new Date() },
  })
  await prisma.session.deleteMany({ where: { userId: matched.userId } })

  // Alte abgelaufene Requests aufräumen
  await prisma.passwordChangeRequest.deleteMany({
    where: { OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }] },
  })

  return NextResponse.json({ success: true })
}
