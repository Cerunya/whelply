import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; testId: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })
  if (!breeder) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const test = await prisma.dogHealthTest.findUnique({
    where: { id: params.testId },
    include: { dog: true },
  })
  if (!test || test.dogId !== params.id || test.dog.breederId !== breeder.id) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  }

  await prisma.dogHealthTest.delete({ where: { id: params.testId } })

  return NextResponse.json({ ok: true })
}
