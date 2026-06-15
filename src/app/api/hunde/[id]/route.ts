import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(80),
  breedId: z.number().int().positive(),
  sex: z.enum(['male', 'female']),
  birthDate: z.string().nullable().optional(),
  color: z.string().max(60).nullable().optional(),
  pedigreeNumber: z.string().max(60).nullable().optional(),
  titles: z.string().max(200).nullable().optional(),
  isStud: z.boolean().default(false),
  description: z.string().max(3000).nullable().optional(),
})

async function getOwnedDog(userId: string, dogId: string) {
  const breeder = await prisma.breederProfile.findUnique({ where: { userId } })
  if (!breeder) return null
  const dog = await prisma.dog.findUnique({ where: { id: dogId } })
  if (!dog || dog.breederId !== breeder.id) return null
  return dog
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const dog = await getOwnedDog(session.user.id, params.id)
  if (!dog) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  // Chip-Nummer-Konflikt vermeiden (nur prüfen falls geändert)
  // (Dog hat aktuell kein chipNumber-Feld im Formular, daher hier nicht relevant)

  await prisma.dog.update({
    where: { id: params.id },
    data: {
      name: parsed.data.name,
      breedId: parsed.data.breedId,
      sex: parsed.data.sex,
      birthDate: parsed.data.birthDate ? new Date(parsed.data.birthDate) : null,
      color: parsed.data.color ?? null,
      pedigreeNumber: parsed.data.pedigreeNumber ?? null,
      titles: parsed.data.titles ?? null,
      isStud: parsed.data.sex === 'male' ? parsed.data.isStud : false,
      description: parsed.data.description ?? null,
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const dog = await getOwnedDog(session.user.id, params.id)
  if (!dog) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  // Verhindern, dass ein Hund gelöscht wird, der als Mutter/Vater eines Wurfs verlinkt ist
  const linkedLitters = await prisma.litter.count({
    where: { OR: [{ damId: dog.id }, { sireId: dog.id }] },
  })
  if (linkedLitters > 0) {
    return NextResponse.json(
      { error: 'Dieser Hund ist als Mutter oder Vater eines Wurfs verlinkt und kann nicht gelöscht werden.' },
      { status: 400 }
    )
  }

  await prisma.dog.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
