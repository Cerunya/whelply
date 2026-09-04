import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben'),
  role: z.enum(['buyer', 'breeder', 'service']).default('buyer'),
  kennelName: z.string().min(2).max(80).optional(),
  verband: z.string().min(1).max(20).optional(),
  serviceName: z.string().min(2).max(120).optional(),
  serviceCategory: z.enum(['vet', 'groomer', 'pension', 'trainer', 'other']).optional(),
}).refine((data) => {
  if (data.role === 'breeder' && (!data.kennelName || data.kennelName.trim().length < 2)) {
    return false
  }
  return true
}, { message: 'Zwingername muss mindestens 2 Zeichen haben', path: ['kennelName'] }).refine((data) => {
  if (data.role === 'breeder' && !data.verband) {
    return false
  }
  return true
}, { message: 'Bitte wähle einen Verband aus', path: ['verband'] }).refine((data) => {
  if (data.role === 'service' && (!data.serviceName || data.serviceName.trim().length < 2)) {
    return false
  }
  return true
}, { message: 'Firmenname muss mindestens 2 Zeichen haben', path: ['serviceName'] }).refine((data) => {
  if (data.role === 'service' && !data.serviceCategory) {
    return false
  }
  return true
}, { message: 'Bitte wähle eine Kategorie aus', path: ['serviceCategory'] })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Leeren kennelName-String als undefined behandeln
    if (body.kennelName === '' || body.kennelName === null) {
      delete body.kennelName
    }
    if (body.verband === '' || body.verband === null) {
      delete body.verband
    }
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      )
    }

    const { password, role, kennelName, verband, serviceName, serviceCategory } = parsed.data
    // E-Mails immer klein schreiben — sonst funktionieren Login und Dubletten-Check
    // nur mit exakt der Schreibweise wie bei der Registrierung
    const email = parsed.data.email.toLowerCase().trim()

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
            verband: verband || null,
            verificationLevel: 'email_verified',
          },
        })
        await tx.subscription.create({
          data: { breederId: breeder.id, plan: 'free' },
        })
      }

      if (role === 'service' && serviceName && serviceCategory) {
        await tx.serviceProvider.create({
          data: {
            userId: newUser.id,
            name: serviceName,
            category: serviceCategory as any,
          },
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
