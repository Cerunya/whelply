import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  status: z.enum(['planned', 'pregnant', 'born', 'available', 'sold_out']).optional(),
  damId: z.string().nullable().optional(),
  sireId: z.string().nullable().optional(),
  sireExternal: z.string().max(200).nullable().optional(),
  expectedDate: z.string().nullable().optional(),
  bornDate: z.string().nullable().optional(),
  puppyCount: z.number().int().min(1).max(20).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })
  if (!breeder) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const litter = await prisma.litter.findUnique({
    where: { id: params.id },
    include: { _count: { select: { listings: true } } },
  })
  if (!litter || litter.breederId !== breeder.id) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  // Geschäftsregel: "available" / "sold_out" erst möglich, wenn mind. ein Welpe (Listing) existiert
  if (
    parsed.data.status &&
    (parsed.data.status === 'available' || parsed.data.status === 'sold_out') &&
    litter._count.listings === 0
  ) {
    return NextResponse.json(
      { error: 'Du musst zuerst mindestens einen Welpen hinzufügen.' },
      { status: 400 }
    )
  }

  // Falls damId/sireId angegeben: prüfen ob diese Hunde dem Züchter gehören
  if (parsed.data.damId) {
    const dam = await prisma.dog.findUnique({ where: { id: parsed.data.damId } })
    if (!dam || dam.breederId !== breeder.id) {
      return NextResponse.json({ error: 'Mutterhündin nicht gefunden' }, { status: 404 })
    }
  }
  if (parsed.data.sireId) {
    const sire = await prisma.dog.findUnique({ where: { id: parsed.data.sireId } })
    if (!sire || sire.breederId !== breeder.id) {
      return NextResponse.json({ error: 'Deckrüde nicht gefunden' }, { status: 404 })
    }
  }

  // Nur tatsächlich übergebene Felder aktualisieren
  const data: Record<string, unknown> = {}
  if (parsed.data.status !== undefined) data.status = parsed.data.status
  if (parsed.data.damId !== undefined) data.damId = parsed.data.damId
  if (parsed.data.sireId !== undefined) {
    data.sireId = parsed.data.sireId
    // Wenn ein interner Deckrüde gewählt wird, externen Namen leeren
    if (parsed.data.sireId) data.sireExternal = null
  }
  if (parsed.data.sireExternal !== undefined) data.sireExternal = parsed.data.sireExternal
  if (parsed.data.expectedDate !== undefined) {
    data.expectedDate = parsed.data.expectedDate ? new Date(parsed.data.expectedDate) : null
  }
  if (parsed.data.bornDate !== undefined) {
    data.bornDate = parsed.data.bornDate ? new Date(parsed.data.bornDate) : null
  }
  if (parsed.data.puppyCount !== undefined) data.puppyCount = parsed.data.puppyCount
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes

  await prisma.litter.update({
    where: { id: params.id },
    data,
  })

  return NextResponse.json({ ok: true })
}
