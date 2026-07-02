import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const schema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  breedId: z.number().int().optional(),
  state: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { email, breedId, state } = parsed.data

  // Doppelte Abonnements vermeiden
  const existing = await prisma.welpenAlert.findFirst({
    where: { email, breedId: breedId ?? null, state: state ?? null },
  })
  if (existing) {
    return NextResponse.json({ message: 'Du erhältst bereits Alerts für diese Suche.' })
  }

  const unsubscribeToken = randomBytes(32).toString('hex')

  await prisma.welpenAlert.create({
    data: {
      email,
      breedId: breedId ?? null,
      state: state ?? null,
      unsubscribeToken,
    },
  })

  return NextResponse.json({ message: 'Alert erfolgreich eingerichtet! Du erhältst ab morgen täglich eine E-Mail wenn neue Welpen eingetragen werden.' })
}
