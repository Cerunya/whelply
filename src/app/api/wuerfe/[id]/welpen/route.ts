import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(80),
  sex: z.enum(['male', 'female']),
  birthDate: z.string().nullable().optional(),
  color: z.string().max(60).nullable().optional(),
  chipNumber: z.string().max(60).nullable().optional(),
  priceCents: z.number().int().positive().nullable().optional(),
  status: z.enum(['draft', 'available']).default('draft'),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })
  if (!breeder) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const litter = await prisma.litter.findUnique({ where: { id: params.id } })
  if (!litter || litter.breederId !== breeder.id) {
    return NextResponse.json({ error: 'Wurf nicht gefunden' }, { status: 404 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  // Chip-Nummer ist unique — vorher prüfen, um saubere Fehlermeldung zu geben
  if (parsed.data.chipNumber) {
    const existing = await prisma.dog.findUnique({ where: { chipNumber: parsed.data.chipNumber } })
    if (existing) {
      return NextResponse.json({ error: 'Diese Chip-Nummer ist bereits vergeben.' }, { status: 400 })
    }
  }

  // Dog und Listing zusammen anlegen
  const dog = await prisma.dog.create({
    data: {
      breederId: breeder.id,
      breedId: litter.breedId,
      name: parsed.data.name,
      sex: parsed.data.sex,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      color: parsed.data.color ?? null,
      chipNumber: parsed.data.chipNumber ?? null,
      isForSale: parsed.data.status === 'available',
    },
  })

  const listing = await prisma.listing.create({
    data: {
      breederId: breeder.id,
      breedId: litter.breedId,
      litterId: litter.id,
      dogId: dog.id,
      title: parsed.data.name,
      type: 'puppy',
      sex: parsed.data.sex,
      priceCents: parsed.data.priceCents ?? null,
      status: parsed.data.status,
    },
  })

  return NextResponse.json({ dogId: dog.id, listingId: listing.id }, { status: 201 })
}
