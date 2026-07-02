import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    include: {
      listing: { include: { breed: { select: { nameDe: true } }, media: { where: { isPrimary: true }, take: 1, select: { url: true } }, breeder: { select: { kennelName: true } } } },
      litter: { include: { breed: { select: { nameDe: true } }, media: { take: 1, select: { url: true } }, breeder: { select: { kennelName: true } } } },
      breeder: { include: { media: { where: { purpose: 'background' }, take: 1, select: { url: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(bookmarks)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const { listingId, litterId, breederId } = await req.json()

  // Toggle: wenn bereits vorhanden → löschen
  const existing = await prisma.bookmark.findFirst({
    where: { userId: session.user.id, listingId: listingId ?? null, litterId: litterId ?? null, breederId: breederId ?? null },
  })

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } })
    return NextResponse.json({ bookmarked: false })
  }

  await prisma.bookmark.create({
    data: { userId: session.user.id, listingId: listingId ?? null, litterId: litterId ?? null, breederId: breederId ?? null },
  })

  return NextResponse.json({ bookmarked: true })
}
