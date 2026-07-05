import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { s3, MINIO_BUCKET } from '@/lib/s3'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })

  const media = await prisma.media.findUnique({
    where: { id: params.id },
    include: {
      listing: { include: { breeder: true } },
      dog: true,
    },
  })

  if (!media) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  // Ownership check: listing media or dog media
  if (media.listing && (!breeder || media.listing.breederId !== breeder.id)) {
    return NextResponse.json({ error: 'Nicht erlaubt' }, { status: 403 })
  }
  if (media.dog && (!breeder || media.dog.breederId !== breeder.id)) {
    return NextResponse.json({ error: 'Nicht erlaubt' }, { status: 403 })
  }

  const wasPrimary = media.isPrimary
  const listingId = media.listingId

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: MINIO_BUCKET, Key: media.storageKey }))
  } catch { /* ignorieren */ }

  await prisma.media.delete({ where: { id: params.id } })

  if (wasPrimary && listingId) {
    const next = await prisma.media.findFirst({
      where: { listingId },
      orderBy: { sortOrder: 'asc' },
    })
    if (next) {
      await prisma.media.update({ where: { id: next.id }, data: { isPrimary: true } })
    }
  }

  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const { purpose } = await req.json()

  // Verify ownership
  const media = await prisma.media.findUnique({ where: { id: params.id } })
  if (!media) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  await prisma.media.update({
    where: { id: params.id },
    data: { purpose: purpose ?? null },
  })

  return NextResponse.json({ ok: true })
}
