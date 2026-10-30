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
  useLitterCare: z.boolean().default(true),
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

export async function POST(
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
    return NextResponse.json({ error: 'Wurf nicht gefunden' }, { status: 404 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  if (!litter.bornDate && !parsed.data.birthDate) {
    return NextResponse.json({ error: 'Bitte gib beim ersten Welpen das Geburtsdatum des Wurfs an.' }, { status: 400 })
  }

  const birthDate = litter.bornDate ?? new Date(parsed.data.birthDate!)

  // Chip-Nummer ist unique — vorher prüfen, um saubere Fehlermeldung zu geben
  if (parsed.data.chipNumber) {
    const existing = await prisma.dog.findUnique({ where: { chipNumber: parsed.data.chipNumber } })
    if (existing) {
      return NextResponse.json({ error: 'Diese Chip-Nummer ist bereits vergeben.' }, { status: 400 })
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const dog = await tx.dog.create({
      data: {
        breederId: breeder.id,
        breedId: litter.breedId,
        name: parsed.data.name,
        sex: parsed.data.sex,
        birthDate,
        color: parsed.data.color ?? null,
        chipNumber: parsed.data.chipNumber ?? null,
        isForSale: parsed.data.status === 'available',
      },
    })

    const listing = await tx.listing.create({
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
        hasPedigree: parsed.data.useLitterCare ? litter.hasPedigree : parsed.data.hasPedigree,
        isVaccinated: parsed.data.useLitterCare ? litter.isVaccinated : parsed.data.isVaccinated,
        isDewormed: parsed.data.useLitterCare ? litter.isDewormed : parsed.data.isDewormed,
        isChipped: parsed.data.useLitterCare ? litter.isChipped : parsed.data.isChipped,
        isInsured: parsed.data.useLitterCare ? litter.isInsured : parsed.data.isInsured,
        trainingMedical: parsed.data.useLitterCare ? litter.trainingMedical : parsed.data.trainingMedical,
        trainingCharaktertest: parsed.data.useLitterCare ? litter.trainingCharaktertest : parsed.data.trainingCharaktertest,
        trainingAndereTiere: parsed.data.useLitterCare ? litter.trainingAndereTiere : parsed.data.trainingAndereTiere,
        trainingHaushaltsgeraeusche: parsed.data.useLitterCare ? litter.trainingHaushaltsgeraeusche : parsed.data.trainingHaushaltsgeraeusche,
        trainingKinder: parsed.data.useLitterCare ? litter.trainingKinder : parsed.data.trainingKinder,
        trainingAutofahren: parsed.data.useLitterCare ? litter.trainingAutofahren : parsed.data.trainingAutofahren,
        trainingBelebteOrte: parsed.data.useLitterCare ? litter.trainingBelebteOrte : parsed.data.trainingBelebteOrte,
        trainingNotes: parsed.data.useLitterCare ? litter.trainingNotes : (parsed.data.trainingNotes ?? null),
      },
    })

    if (!litter.bornDate) {
      await tx.litter.update({ where: { id: litter.id }, data: { bornDate: birthDate } })
    }

    return { dog, listing }
  })

  return NextResponse.json({
    dogId: result.dog.id,
    listingId: result.listing.id,
    bornDate: birthDate.toISOString(),
  }, { status: 201 })
}
