import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  kennelName: z.string().min(2).max(80),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'Nutzer nicht gefunden' }, { status: 404 })

  // Züchter können nicht downgraden
  if (user.role === 'breeder') {
    return NextResponse.json({ error: 'Du bist bereits als Züchter registriert' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { kennelName } = parsed.data

  const existingKennel = await prisma.breederProfile.findUnique({ where: { kennelName } })
  if (existingKennel) return NextResponse.json({ error: 'Dieser Zwingername ist bereits vergeben' }, { status: 409 })

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { role: 'breeder' } })
    const breeder = await tx.breederProfile.create({
      data: { userId: user.id, kennelName, verificationLevel: 'email_verified' },
    })
    await tx.subscription.create({ data: { breederId: breeder.id, plan: 'free' } })
  })

  return NextResponse.json({ message: 'Konto erfolgreich zu Züchter upgradet' })
}
