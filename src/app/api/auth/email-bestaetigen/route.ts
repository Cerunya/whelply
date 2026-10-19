import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// POST /api/auth/email-bestaetigen — bestätigt die E-Mail-Adresse anhand des Tokens
export async function POST(req: Request) {
  const { token } = await req.json().catch(() => ({}))
  if (!token) {
    return NextResponse.json({ error: 'Token fehlt' }, { status: 400 })
  }

  const tokens = await prisma.emailVerificationToken.findMany({
    where: { expiresAt: { gt: new Date() }, usedAt: null },
  })

  let matched = null
  for (const t of tokens) {
    const valid = await bcrypt.compare(token, t.tokenHash)
    if (valid) { matched = t; break }
  }

  if (!matched) {
    return NextResponse.json({ error: 'Ungültiger oder abgelaufener Link. Bitte fordere einen neuen an.' }, { status: 400 })
  }

  await prisma.$transaction(async (tx) => {
    await tx.emailVerificationToken.update({
      where: { id: matched.id },
      data: { usedAt: new Date() },
    })
    await tx.user.update({
      where: { id: matched.userId },
      data: { emailVerifiedAt: new Date() },
    })
    // Züchter-Profil: Level 'none' → 'email_verified' (E-Mail jetzt tatsächlich bestätigt)
    await tx.breederProfile.updateMany({
      where: { userId: matched.userId, verificationLevel: 'none' },
      data: { verificationLevel: 'email_verified' },
    })
  })

  // Cleanup abgelaufener/benutzter Tokens
  await prisma.emailVerificationToken.deleteMany({
    where: { OR: [{ expiresAt: { lt: new Date() } }, { usedAt: { not: null } }] },
  })

  return NextResponse.json({ success: true })
}
