import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  title: z.string().max(80).nullable().optional(),
  type: z.enum(['puppy', 'stud', 'adult_dog']).default('adult_dog'),
  breedId: z.number().int().positive(),
  litterId: z.string().nullable().optional(),
  priceCents: z.number().int().positive().nullable().optional(),
  sex: z.enum(['male', 'female']).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(['draft', 'available']).default('draft'),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
    include: { subscription: true },
  })
  if (!breeder) return NextResponse.json({ error: 'Züchter-Profil nicht gefunden' }, { status: 404 })

  // Free-Plan Limit
  const plan = breeder.subscription?.plan ?? 'free'
  if (plan === 'free') {
    const activeCount = await prisma.listing.count({
      where: { breederId: breeder.id, status: 'available' },
    })
    if (activeCount >= 3) {
      return NextResponse.json({ error: 'Free-Plan erlaubt maximal 3 aktive Inserate' }, { status: 403 })
    }
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  // Falls ein Wurf angegeben wurde: prüfen ob er diesem Züchter gehört
  if (parsed.data.litterId) {
    const litter = await prisma.litter.findUnique({ where: { id: parsed.data.litterId } })
    if (!litter || litter.breederId !== breeder.id) {
      return NextResponse.json({ error: 'Wurf nicht gefunden' }, { status: 404 })
    }
  }

  const listing = await prisma.listing.create({
    data: {
      breederId: breeder.id,
      breedId: parsed.data.breedId,
      litterId: parsed.data.litterId ?? null,
      title: parsed.data.title ?? null,
      type: parsed.data.litterId ? 'puppy' : parsed.data.type,
      priceCents: parsed.data.priceCents ?? null,
      sex: parsed.data.sex ?? null,
      description: parsed.data.description ?? null,
      status: parsed.data.status,
    },
  })

  return NextResponse.json({ id: listing.id }, { status: 201 })
}
