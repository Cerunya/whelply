import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { s3, MINIO_BUCKET } from '@/lib/s3'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

// Server-seitiger Upload-Proxy:
// Browser → /api/upload (whelply.de, gültiges Zertifikat)
// Server  → Garage (internes Docker-Netzwerk, kein TLS nötig)
//
// Akzeptiert listingId, litterId, dogId ODER purpose (für Breeder-Theme: header/background) als Ziel.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const listingId = formData.get('listingId') as string | null
  const litterId = formData.get('litterId') as string | null
  const dogId = formData.get('dogId') as string | null
  const newsPostId = formData.get('newsPostId') as string | null
  const purpose = formData.get('purpose') as string | null // 'header' | 'background' | 'gallery'

  if (!file || (!listingId && !litterId && !dogId && !purpose && !newsPostId)) {
    return NextResponse.json({ error: 'Datei oder Ziel-ID fehlt' }, { status: 400 })
  }

  if (purpose && !['header', 'background', 'gallery', 'bio', 'card', 'product'].includes(purpose)) {
    return NextResponse.json({ error: 'Ungültiger purpose-Wert' }, { status: 400 })
  }

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return NextResponse.json({ error: 'Nur JPG, PNG oder WebP erlaubt' }, { status: 400 })
  }

  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: 'Datei zu groß (max. 25 MB)' }, { status: 400 })
  }

  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })
  if (!breeder) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  let ext = 'webp'
  const rawBuffer = Buffer.from(await file.arrayBuffer())

  // ── Bildkompression mit Sharp ──
  // Breite je nach Verwendungszweck begrenzen, immer WebP für beste Kompression
  const maxWidth = (purpose === 'header' || purpose === 'background') ? 1920
    : (purpose === 'card' || purpose === 'product') ? 800
    : 1200

  let buffer: Buffer
  try {
    buffer = await sharp(rawBuffer)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()
  } catch {
    // Fallback: Original verwenden wenn Sharp fehlschlägt
    buffer = rawBuffer
    ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  }

  const contentType = ext === 'webp' ? 'image/webp' : file.type

  if (listingId) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } })
    if (!listing || listing.breederId !== breeder.id) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    }

    const storageKey = `listings/${listingId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    await s3.send(new PutObjectCommand({ Bucket: MINIO_BUCKET, Key: storageKey, Body: buffer, ContentType: contentType }))

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

  if (litterId) {
    // litterId-Zweig (Wurf-Titelbild)
    const litter = await prisma.litter.findUnique({ where: { id: litterId } })
    if (!litter || litter.breederId !== breeder.id) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    }

    const storageKey = `litters/${litterId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    await s3.send(new PutObjectCommand({ Bucket: MINIO_BUCKET, Key: storageKey, Body: buffer, ContentType: contentType }))

    // Wurf hat nur ein Titelbild — alte Bilder ersetzen
    const oldMedia = await prisma.media.findMany({ where: { litterId } })
    for (const old of oldMedia) {
      await prisma.media.delete({ where: { id: old.id } })
    }

    const media = await prisma.media.create({
      data: {
        storageKey,
        url: `/api/media/${storageKey}/view`,
        litterId,
        isPrimary: true,
        sortOrder: 0,
      },
    })

    return NextResponse.json({ id: media.id, url: media.url })
  }

  if (purpose) {
    // purpose-Zweig (Theme: Header-/Hintergrundbild oder Galerie-Bilder des Züchterprofils)
    const storageKey = `breeders/${breeder.id}/${purpose}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    await s3.send(new PutObjectCommand({ Bucket: MINIO_BUCKET, Key: storageKey, Body: buffer, ContentType: contentType }))

    if (purpose === 'bio') {
      // Bio-Bild: nur hochladen, keine DB-Eintragung nötig
      const url = `/api/media/${storageKey}/view`
      return NextResponse.json({ url })
    }

    if (purpose === 'gallery') {
      // Galerie: mehrere Bilder erlaubt, ans Ende anhängen
      const count = await prisma.media.count({ where: { breederId: breeder.id, purpose: 'gallery' } })
      const media = await prisma.media.create({
        data: {
          storageKey,
          url: `/api/media/${storageKey}/view`,
          breederId: breeder.id,
          purpose: 'gallery',
          isPrimary: false,
          sortOrder: count,
        },
      })
      return NextResponse.json({ id: media.id, url: media.url })
    }

    // header/background: pro purpose nur ein Bild — altes ersetzen
    const oldMedia = await prisma.media.findMany({ where: { breederId: breeder.id, purpose } })
    for (const old of oldMedia) {
      await prisma.media.delete({ where: { id: old.id } })
    }

    const media = await prisma.media.create({
      data: {
        storageKey,
        url: `/api/media/${storageKey}/view`,
        breederId: breeder.id,
        purpose,
        isPrimary: false,
        sortOrder: 0,
      },
    })

    return NextResponse.json({ id: media.id, url: media.url })
  }

  if (newsPostId) {
    // newsPostId-Zweig (Bild zu einem Aktuelles-Beitrag — nur eines pro Beitrag)
    const post = await prisma.newsPost.findUnique({ where: { id: newsPostId } })
    if (!post || post.breederId !== breeder.id) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    }

    const storageKey = `news/${newsPostId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    await s3.send(new PutObjectCommand({ Bucket: MINIO_BUCKET, Key: storageKey, Body: buffer, ContentType: contentType }))

    const oldMedia = await prisma.media.findMany({ where: { newsPostId } })
    for (const old of oldMedia) {
      await prisma.media.delete({ where: { id: old.id } })
    }

    const media = await prisma.media.create({
      data: {
        storageKey,
        url: `/api/media/${storageKey}/view`,
        newsPostId,
        isPrimary: true,
        sortOrder: 0,
      },
    })

    return NextResponse.json({ id: media.id, url: media.url })
  }

  // dogId-Zweig (Zuchthund-Bilder)
  const dogPurpose = formData.get('dogPurpose') as string | null // 'dog_bg' für Hintergrundbild
  const dog = await prisma.dog.findUnique({ where: { id: dogId! } })
  if (!dog || dog.breederId !== breeder.id) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  }

  const storageKey = `dogs/${dogId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  await s3.send(new PutObjectCommand({ Bucket: MINIO_BUCKET, Key: storageKey, Body: buffer, ContentType: contentType }))

  if (dogPurpose === 'dog_bg') {
    // Hintergrundbild — altes ersetzen
    const oldBg = await prisma.media.findFirst({ where: { dogId: dogId!, purpose: 'dog_bg' } })
    if (oldBg) {
      try { await s3.send(new DeleteObjectCommand({ Bucket: MINIO_BUCKET, Key: oldBg.storageKey })) } catch {}
      await prisma.media.delete({ where: { id: oldBg.id } })
    }
    const media = await prisma.media.create({
      data: { storageKey, url: `/api/media/${storageKey}/view`, dogId: dogId!, isPrimary: false, sortOrder: 0, purpose: 'dog_bg' },
    })
    return NextResponse.json({ id: media.id, url: media.url })
  }

  // Multi-Bild: bestehende Bilder behalten, sortOrder anhängen
  // OR-Query nötig weil PostgreSQL bei `!= 'dog_bg'` NULL-Werte ausschließt
  const existingCount = await prisma.media.count({
    where: {
      dogId: dogId!,
      OR: [{ purpose: null }, { purpose: { not: 'dog_bg' } }],
    },
  })

  const media = await prisma.media.create({
    data: {
      storageKey,
      url: `/api/media/${storageKey}/view`,
      dogId: dogId!,
      isPrimary: existingCount === 0,
      sortOrder: existingCount,
    },
  })

  return NextResponse.json({ id: media.id, url: media.url })
}

// Entfernt Theme-Bilder (Header/Hintergrund, purpose) oder ein einzelnes Galerie-Bild (mediaId)
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })
  if (!breeder) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const mediaId = req.nextUrl.searchParams.get('mediaId')
  if (mediaId) {
    const media = await prisma.media.findUnique({ where: { id: mediaId } })
    if (!media || media.breederId !== breeder.id) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
    }
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: MINIO_BUCKET, Key: media.storageKey }))
    } catch {
      // ignorieren falls Datei bereits weg
    }
    await prisma.media.delete({ where: { id: mediaId } })
    return NextResponse.json({ ok: true })
  }

  const purpose = req.nextUrl.searchParams.get('purpose')
  if (!purpose || !['header', 'background'].includes(purpose)) {
    return NextResponse.json({ error: 'Ungültiger purpose-Wert' }, { status: 400 })
  }

  await prisma.media.deleteMany({ where: { breederId: breeder.id, purpose } })

  return NextResponse.json({ ok: true })
}
