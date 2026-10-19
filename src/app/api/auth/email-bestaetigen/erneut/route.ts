import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createAndSendVerificationToken } from '@/lib/email-verification'

// POST /api/auth/email-bestaetigen/erneut — schickt den Bestätigungslink erneut
export async function POST(req: Request) {
  const { email } = await req.json().catch(() => ({}))
  if (!email) return NextResponse.json({ error: 'E-Mail fehlt' }, { status: 400 })

  // Immer gleiche Antwort (kein Leaken ob E-Mail existiert / schon bestätigt ist)
  const successResponse = NextResponse.json({
    success: true,
    message: 'Falls ein Konto mit dieser E-Mail existiert und noch nicht bestätigt ist, wurde ein neuer Link gesendet.',
  })

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (!user) return successResponse
  if (user.emailVerifiedAt) return successResponse

  // Rate limiting: max. 3 aktive Links pro Account
  const recent = await prisma.emailVerificationToken.count({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
  })
  if (recent >= 3) return successResponse

  await createAndSendVerificationToken(user.id, user.email)
  return successResponse
}
