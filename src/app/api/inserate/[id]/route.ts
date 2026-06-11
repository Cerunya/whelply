import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  breedId: z.number().int().positive(),
  priceCents: z.number().int().positive().nullable().optional(),
  sex: z.enum(['male', 'female']).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  status: z.enum(['draft', 'available', 'reserved', 'sold']),
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

  const updated = await prisma.listing.update({
    where: { id: params.id },
    data: {
      breedId: parsed.data.breedId,
      priceCents: parsed.data.priceCents ?? null,
      sex: parsed.data.sex ?? null,
      description: parsed.data.description ?? null,
      status: parsed.data.status,
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
