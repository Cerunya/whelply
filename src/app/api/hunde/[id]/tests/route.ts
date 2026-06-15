import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100),
  result: z.string().min(1).max(100),
  testDate: z.string().nullable().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })
  if (!breeder) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const dog = await prisma.dog.findUnique({ where: { id: params.id } })
  if (!dog || dog.breederId !== breeder.id) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const count = await prisma.dogHealthTest.count({ where: { dogId: params.id } })

  const test = await prisma.dogHealthTest.create({
    data: {
      dogId: params.id,
      name: parsed.data.name,
      result: parsed.data.result,
      testDate: parsed.data.testDate ? new Date(parsed.data.testDate) : null,
      sortOrder: count,
    },
  })

  return NextResponse.json({
    id: test.id,
    name: test.name,
    result: test.result,
    testDate: test.testDate ? test.testDate.toISOString().slice(0, 10) : null,
  }, { status: 201 })
}
