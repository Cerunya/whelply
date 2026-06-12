import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  status: z.enum(['planned', 'pregnant', 'born', 'available', 'sold_out']),
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
  if ((parsed.data.status === 'available' || parsed.data.status === 'sold_out') && litter._count.listings === 0) {
    return NextResponse.json(
      { error: 'Du musst zuerst mindestens einen Welpen hinzufügen.' },
      { status: 400 }
    )
  }

  await prisma.litter.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  })

  return NextResponse.json({ ok: true })
}
