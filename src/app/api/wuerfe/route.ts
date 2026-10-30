import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  breedId: z.number().int().positive(),
  damId: z.string().nullable().optional(),
  sireId: z.string().nullable().optional(),
  expectedDate: z.string().max(100).nullable().optional(),
  bornDate: z.string().nullable().optional(),
  puppyCount: z.number().int().min(1).max(20).nullable().optional(),
  sireExternal: z.string().max(200).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  status: z.enum(['planned', 'pregnant', 'born', 'available', 'sold_out']).default('planned'),
  hasPedigree: z.boolean().default(false),
  isVaccinated: z.boolean().default(false),
  isDewormed: z.boolean().default(false),
  isChipped: z.boolean().default(false),
  isInsured: z.boolean().default(false),
  trainingMedical: z.boolean().default(false),
  trainingCharaktertest: z.boolean().default(false),
  trainingAndereTiere: z.boolean().default(false),
  trainingHaushaltsgeraeusche: z.boolean().default(false),
  trainingKinder: z.boolean().default(false),
  trainingAutofahren: z.boolean().default(false),
  trainingBelebteOrte: z.boolean().default(false),
  trainingNotes: z.string().max(1000).nullable().optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
  })
  if (!breeder) return NextResponse.json({ error: 'Züchter-Profil nicht gefunden' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  // Neuer Wurf hat noch keine Welpen — "available"/"sold_out" ist nicht erlaubt
  if (parsed.data.status === 'available' || parsed.data.status === 'sold_out') {
    return NextResponse.json(
      { error: 'Dieser Status kann erst gesetzt werden, wenn mindestens ein Welpe eingetragen wurde.' },
      { status: 400 }
    )
  }

  // Prüfen ob damId/sireId diesem Züchter gehören
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

  const litter = await prisma.litter.create({
    data: {
      breederId: breeder.id,
      breedId: parsed.data.breedId,
      damId: parsed.data.damId ?? null,
      sireId: parsed.data.sireId ?? null,
      expectedDate: parsed.data.expectedDate || null,
      bornDate: parsed.data.bornDate ? new Date(parsed.data.bornDate) : null,
      puppyCount: parsed.data.puppyCount ?? null,
      sireExternal: parsed.data.sireExternal ?? null,
      notes: parsed.data.notes ?? null,
      status: parsed.data.status,
      hasPedigree: parsed.data.hasPedigree,
      isVaccinated: parsed.data.isVaccinated,
      isDewormed: parsed.data.isDewormed,
      isChipped: parsed.data.isChipped,
      isInsured: parsed.data.isInsured,
      trainingMedical: parsed.data.trainingMedical,
      trainingCharaktertest: parsed.data.trainingCharaktertest,
      trainingAndereTiere: parsed.data.trainingAndereTiere,
      trainingHaushaltsgeraeusche: parsed.data.trainingHaushaltsgeraeusche,
      trainingKinder: parsed.data.trainingKinder,
      trainingAutofahren: parsed.data.trainingAutofahren,
      trainingBelebteOrte: parsed.data.trainingBelebteOrte,
      trainingNotes: parsed.data.trainingNotes ?? null,
    },
  })

  return NextResponse.json({ id: litter.id }, { status: 201 })
}
