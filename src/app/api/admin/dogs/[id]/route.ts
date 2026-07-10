import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return null
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.role !== 'admin') return null
  return user
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Nicht erlaubt' }, { status: 403 })

  // Erst zugehörige Listings löschen, dann den Hund
  await prisma.listing.deleteMany({ where: { dogId: params.id } })
  await prisma.media.deleteMany({ where: { dogId: params.id } })
  await prisma.dog.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
