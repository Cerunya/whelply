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
  status: z.enum(['draft', 'available', 'reserved', 'sold']),
  hasPedigree: z.boolean().optional(),
  isVaccinated: z.boolean().optional(),
  isDewormed: z.boolean().optional(),
  isChipped: z.boolean().optional(),
  isInsured: z.boolean().optional(),
  birthLocation: z.string().max(200).nullable().optional(),
  chipNumber: z.string().max(30).nullable().optional(),
})

async function getBreederAndListing(userId: string, listingId: string) {
  const breeder = await prisma.breederProfile.findUnique({
    where: { userId },
  })
  if (!breeder) return null

  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
  })
  if (!listing || listing.breederId !== breeder.id) return null

  return { breeder, listing }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const data = await getBreederAndListing(session.user.id, params.id)
  if (!data) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  // Falls ein Wurf angegeben wurde: prüfen ob er diesem Züchter gehört
  if (parsed.data.litterId) {
    const litter = await prisma.litter.findUnique({ where: { id: parsed.data.litterId } })
    if (!litter || litter.breederId !== data.breeder.id) {
      return NextResponse.json({ error: 'Wurf nicht gefunden' }, { status: 404 })
    }
  }

  const updated = await prisma.listing.update({
    where: { id: params.id },
    data: {
      title: parsed.data.title ?? null,
      type: parsed.data.litterId ? 'puppy' : parsed.data.type,
      breedId: parsed.data.breedId,
      litterId: parsed.data.litterId ?? null,
      priceCents: parsed.data.priceCents ?? null,
      sex: parsed.data.sex ?? null,
      description: parsed.data.description ?? null,
      status: parsed.data.status,
      ...(parsed.data.hasPedigree !== undefined && { hasPedigree: parsed.data.hasPedigree }),
      ...(parsed.data.isVaccinated !== undefined && { isVaccinated: parsed.data.isVaccinated }),
      ...(parsed.data.isDewormed !== undefined && { isDewormed: parsed.data.isDewormed }),
      ...(parsed.data.isChipped !== undefined && { isChipped: parsed.data.isChipped }),
      ...(parsed.data.isInsured !== undefined && { isInsured: parsed.data.isInsured }),
      birthLocation: parsed.data.birthLocation ?? null,
      chipNumber: parsed.data.chipNumber ?? null,
    },
  })

  return NextResponse.json({ id: updated.id })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const data = await getBreederAndListing(session.user.id, params.id)
  if (!data) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  await prisma.listing.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
