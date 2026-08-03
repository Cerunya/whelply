import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { s3, MINIO_BUCKET } from '@/lib/s3'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

// GET: Alle Mediathek-Dateien auflisten
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (user?.role !== 'admin') return NextResponse.json({ error: 'Nur Admins' }, { status: 403 })

  const media = await prisma.media.findMany({
    where: { purpose: 'article_media' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, url: true, storageKey: true, altText: true, createdAt: true },
  })

  return NextResponse.json(media)
}

// POST: Datei hochladen (Bild oder PDF)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (user?.role !== 'admin') return NextResponse.json({ error: 'Nur Admins' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const altText = formData.get('altText') as string | null

  if (!file) return NextResponse.json({ error: 'Datei fehlt' }, { status: 400 })

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Nur JPG, PNG, WebP, GIF oder PDF erlaubt' }, { status: 400 })
  }

  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: 'Datei zu groß (max. 25 MB)' }, { status: 400 })
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer())
  let buffer: Buffer
  let ext: string
  let contentType: string

  // Bilder komprimieren, PDFs durchlassen
  if (file.type.startsWith('image/') && file.type !== 'image/gif') {
    try {
      buffer = await sharp(rawBuffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer()
      ext = 'webp'
      contentType = 'image/webp'
    } catch {
      buffer = rawBuffer
      ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
      contentType = file.type
    }
  } else {
    buffer = rawBuffer
    ext = file.name.split('.').pop()?.toLowerCase() ?? 'bin'
    contentType = file.type
  }

  const storageKey = `article-media/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  await s3.send(new PutObjectCommand({
    Bucket: MINIO_BUCKET,
    Key: storageKey,
    Body: buffer,
    ContentType: contentType,
  }))

  const media = await prisma.media.create({
    data: {
      storageKey,
      url: `/api/media/${storageKey}/view`,
      altText: altText || null,
      purpose: 'article_media',
      isPrimary: false,
      sortOrder: 0,
    },
  })

  return NextResponse.json({ id: media.id, url: media.url })
}

// DELETE: Datei löschen
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (user?.role !== 'admin') return NextResponse.json({ error: 'Nur Admins' }, { status: 403 })

  const mediaId = req.nextUrl.searchParams.get('id')
  if (!mediaId) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const media = await prisma.media.findUnique({ where: { id: mediaId } })
  if (!media || media.purpose !== 'article_media') {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  }

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: MINIO_BUCKET, Key: media.storageKey }))
  } catch {}

  await prisma.media.delete({ where: { id: mediaId } })

  return NextResponse.json({ ok: true })
}
