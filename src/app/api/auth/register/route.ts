import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
  role: z.enum(['buyer', 'breeder', 'service']).default('buyer'),
  kennelName: z.string().min(2).max(80).optional(),
}).refine((data) => {
  if (data.role === 'breeder' && (!data.kennelName || data.kennelName.trim().length < 2)) {
    return false
  }
  return true
}, { message: 'Zwingername muss mindestens 2 Zeichen haben', path: ['kennelName'] })

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

    const { email, password, role, kennelName } = parsed.data

    // Züchter braucht Zwingernamen
    if (role === 'breeder' && !kennelName) {
      return NextResponse.json(
        { error: 'Zwingername ist für Züchter erforderlich' },
        { status: 400 }
      )
    }

    // E-Mail prüfen
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse ist bereits registriert' },
        { status: 409 }
      )
    }

    // Zwingername prüfen
    if (role === 'breeder' && kennelName) {
      const existingKennel = await prisma.breederProfile.findUnique({ where: { kennelName } })
      if (existingKennel) {
        return NextResponse.json(
          { error: 'Dieser Zwingername ist bereits registriert' },
          { status: 409 }
        )
      }
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email, passwordHash, role },
      })

      if (role === 'breeder' && kennelName) {
        const breeder = await tx.breederProfile.create({
          data: {
            userId: newUser.id,
            kennelName,
            verificationLevel: 'email_verified',
          },
        })
        await tx.subscription.create({
          data: { breederId: breeder.id, plan: 'free' },
        })
      }

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
