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

  const media = await prisma.media.findUnique({
    where: { id: params.id },
    include: { listing: { include: { breeder: true } } },
  })

  if (!media || !media.listing) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  }

  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })
  if (!breeder || media.listing.breederId !== breeder.id) {
    return NextResponse.json({ error: 'Nicht erlaubt' }, { status: 403 })
  }

  const wasPrimary = media.isPrimary
  const listingId = media.listingId!

  // Aus MinIO löschen
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: MINIO_BUCKET, Key: media.storageKey }))
  } catch {
    // Ignorieren falls Datei bereits weg
  }

  await prisma.media.delete({ where: { id: params.id } })

  // Falls das Titelbild gelöscht wurde, das nächste verbleibende Bild zum neuen Titelbild machen
  if (wasPrimary) {
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
