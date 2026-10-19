// E-Mail-Bestätigung bei Registrierung: Token erzeugen + Mail versenden.
// Gleiches Muster wie beim Passwort-Reset (bcrypt-gehashter Token, 24h gültig).
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { sendEmailVerification } from '@/lib/mail'

export async function createAndSendVerificationToken(userId: string, email: string): Promise<void> {
  const token = randomUUID()
  const tokenHash = await bcrypt.hash(token, 10)

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 Stunden
    },
  })

  await sendEmailVerification(email, token)
}
