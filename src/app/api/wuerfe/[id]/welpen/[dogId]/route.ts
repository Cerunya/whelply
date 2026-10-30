import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; dogId: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })
  if (!breeder) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const listing = await prisma.listing.findFirst({
    where: {
      litterId: params.id,
      dogId: params.dogId,
      breederId: breeder.id,
      type: 'puppy',
    },
    select: { id: true },
  })
  if (!listing) return NextResponse.json({ error: 'Welpe nicht gefunden' }, { status: 404 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Ungültiges Geburtsdatum.' }, { status: 400 })

  const birthDate = new Date(parsed.data.birthDate)
  await prisma.dog.update({ where: { id: params.dogId }, data: { birthDate } })

  return NextResponse.json({ ok: true, birthDate: birthDate.toISOString() })
}
