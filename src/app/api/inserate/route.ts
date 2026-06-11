import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  breedId: z.number().int().positive(),
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

  const listing = await prisma.listing.create({
    data: {
      breederId: breeder.id,
      breedId: parsed.data.breedId,
      type: 'puppy',
      priceCents: parsed.data.priceCents ?? null,
      sex: parsed.data.sex ?? null,
      description: parsed.data.description ?? null,
      status: parsed.data.status,
    },
  })

  return NextResponse.json({ id: listing.id }, { status: 201 })
}
