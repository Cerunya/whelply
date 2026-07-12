import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const { token, newPassword } = await req.json()
  if (!token || !newPassword) {
    return NextResponse.json({ error: 'Token und Passwort sind Pflicht' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Passwort muss mindestens 8 Zeichen haben' }, { status: 400 })
  }

  const tokens = await prisma.passwordResetToken.findMany({
    where: { expiresAt: { gt: new Date() }, usedAt: null },
  })

  let matched = null
  for (const t of tokens) {
    const valid = await bcrypt.compare(token, t.tokenHash)
    if (valid) { matched = t; break }
  }

  if (!matched) {
    return NextResponse.json({ error: 'Ungültiger oder abgelaufener Link' }, { status: 400 })
  }

  const newHash = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: matched.userId },
    data: { passwordHash: newHash },
  })

  await prisma.passwordResetToken.update({
    where: { id: matched.id },
    data: { usedAt: new Date() },
  })
  await prisma.session.deleteMany({ where: { userId: matched.userId } })

  // Cleanup
  await prisma.passwordResetToken.deleteMany({
    where: { OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }] },
  })

  return NextResponse.json({ success: true })
}
