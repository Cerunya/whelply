import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { sendPasswordResetLink } from '@/lib/mail'

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'E-Mail fehlt' }, { status: 400 })

  // Immer gleiche Antwort (kein Leaken ob E-Mail existiert)
  const successResponse = NextResponse.json({
    success: true,
    message: 'Falls ein Konto mit dieser E-Mail existiert, wurde ein Link gesendet.',
  })

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (!user) return successResponse

  // Rate limiting
  const recent = await prisma.passwordResetToken.count({
    where: { userId: user.id, expiresAt: { gt: new Date() } },
  })
  if (recent >= 3) return successResponse

  const token = randomUUID()
  const tokenHash = await bcrypt.hash(token, 10)

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 Stunde
    },
  })

  await sendPasswordResetLink(user.email, token)
  return successResponse
}
