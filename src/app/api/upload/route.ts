import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { s3, MINIO_BUCKET } from '@/lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'

// Server-seitiger Upload-Proxy:
// Browser → /api/upload (whelply.de, gültiges Zertifikat)
// Server  → Garage (internes Docker-Netzwerk, kein TLS nötig)
//
// Akzeptiert entweder listingId ODER litterId als Ziel.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const listingId = formData.get('listingId') as string | null
  const litterId = formData.get('litterId') as string | null

  if (!file || (!listingId && !litterId)) {
    return NextResponse.json({ error: 'Datei oder Ziel-ID fehlt' }, { status: 400 })
  }

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return NextResponse.json({ error: 'Nur JPG, PNG oder WebP erlaubt' }, { status: 400 })
  }

  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: 'Datei zu groß (max. 8 MB)' }, { status: 400 })
  }

  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })
  if (!breeder) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  let ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const buffer = Buffer.from(await file.arrayBuffer())

  if (listingId) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing || listing.breederId !== breeder.id) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    }

    const storageKey = `listings/${listingId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    await s3.send(new PutObjectCommand({ Bucket: MINIO_BUCKET, Key: storageKey, Body: buffer, ContentType: file.type }))

    const existingCount = await prisma.media.count({ where: { listingId } })
    if (existingCount === 0) {
      await prisma.media.updateMany({ where: { listingId }, data: { isPrimary: false } })
    }

    const media = await prisma.media.create({
      data: {
        storageKey,
        url: `/api/media/${storageKey}/view`,
        listingId,
        isPrimary: existingCount === 0,
        sortOrder: existingCount,
      },
    })

    return NextResponse.json({ id: media.id, url: media.url })
  }

  // litterId-Zweig (Wurf-Titelbild)
  const litter = await prisma.litter.findUnique({ where: { id: litterId! } })
  if (!litter || litter.breederId !== breeder.id) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  }

  const storageKey = `litters/${litterId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  await s3.send(new PutObjectCommand({ Bucket: MINIO_BUCKET, Key: storageKey, Body: buffer, ContentType: file.type }))

  // Wurf hat nur ein Titelbild — alte Bilder ersetzen
  const oldMedia = await prisma.media.findMany({ where: { litterId: litterId! } })
  for (const old of oldMedia) {
    await prisma.media.delete({ where: { id: old.id } })
  }

  const media = await prisma.media.create({
    data: {
      storageKey,
      url: `/api/media/${storageKey}/view`,
      litterId: litterId!,
      isPrimary: true,
      sortOrder: 0,
    },
  })

  return NextResponse.json({ id: media.id, url: media.url })
}
