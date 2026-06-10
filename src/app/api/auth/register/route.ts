import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
  kennelName: z
    .string()
    .min(2, 'Zwingername muss mindestens 2 Zeichen haben')
    .max(80, 'Zwingername zu lang')
    .regex(
      /^[a-zA-ZäöüÄÖÜß\s\-']+$/,
      'Zwingername darf nur Buchstaben, Leerzeichen und Bindestriche enthalten'
    ),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, password, kennelName } = parsed.data

    // Prüfen ob E-Mail bereits vergeben
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse ist bereits registriert' },
        { status: 409 }
      )
    }

    // Prüfen ob Zwingername bereits vergeben (UNIQUE constraint)
    const existingKennel = await prisma.breederProfile.findUnique({
      where: { kennelName },
    })
    if (existingKennel) {
      return NextResponse.json(
        { error: 'Dieser Zwingername ist bereits registriert' },
        { status: 409 }
      )
    }

    // Passwort hashen
    const passwordHash = await bcrypt.hash(password, 12)

    // User + BreederProfile in einer Transaktion anlegen
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'breeder',
        },
      })

      await tx.breederProfile.create({
        data: {
          userId: newUser.id,
          kennelName,
          verificationLevel: 'email_verified',
        },
      })

      await tx.subscription.create({
        data: {
          breederId: (
            await tx.breederProfile.findUnique({
              where: { userId: newUser.id },
            })
          )!.id,
          plan: 'free',
        },
      })

      return newUser
    })

    return NextResponse.json(
      { message: 'Registrierung erfolgreich', userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.' },
      { status: 500 }
    )
  }
}
