import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  breedId: z.number().int().positive(),
  expectedDate: z.string().nullable().optional(),
  bornDate: z.string().nullable().optional(),
  puppyCount: z.number().int().min(1).max(20).nullable().optional(),
  sireExternal: z.string().max(200).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  status: z.enum(['planned', 'pregnant', 'born', 'available', 'sold_out']).default('planned'),
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

  const litter = await prisma.litter.create({
    data: {
      breederId: breeder.id,
      breedId: parsed.data.breedId,
      expectedDate: parsed.data.expectedDate ? new Date(parsed.data.expectedDate) : null,
      bornDate: parsed.data.bornDate ? new Date(parsed.data.bornDate) : null,
      puppyCount: parsed.data.puppyCount ?? null,
      sireExternal: parsed.data.sireExternal ?? null,
      notes: parsed.data.notes ?? null,
      status: parsed.data.status,
    },
  })

  return NextResponse.json({ id: litter.id }, { status: 201 })
}
