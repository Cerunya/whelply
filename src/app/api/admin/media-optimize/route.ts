import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { s3, MINIO_BUCKET } from '@/lib/s3'
import { HeadObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'

// Nur Dateien über dieser Größe lohnen eine Rekomprimierung
const MIN_SIZE_BYTES = 250 * 1024
// Karten brauchen ~800px, Detail-Galerien ~1200px — 1600px ist großzügig
const MAX_WIDTH = 1600

// POST { offset?, limit? } — komprimiert eine Charge von Bildern in Garage IN PLACE
// (gleicher storageKey → URLs bleiben gültig, keine DB-Migration nötig).
// Wird von /admin/einstellungen (BildOptimierung.tsx) in einer Schleife aufgerufen,
// bis done === true. Jederzeit wiederholbar und idempotent.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Nur für Admins' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const offset = Math.max(0, Number(body.offset) || 0)
  const limit = Math.min(30, Math.max(1, Number(body.limit) || 15))

  const total = await prisma.media.count()
  const batch = await prisma.media.findMany({
    orderBy: { createdAt: 'asc' },
    skip: offset,
    take: limit,
    select: { id: true, storageKey: true },
  })

  let optimized = 0
  let skipped = 0
  let failed = 0
  let savedBytes = 0

  for (const item of batch) {
    try {
      // Erst nur die Größe prüfen — kleine Dateien gar nicht erst laden
      const head = await s3.send(new HeadObjectCommand({
        Bucket: MINIO_BUCKET,
        Key: item.storageKey,
      }))
      const size = head.ContentLength ?? 0
      const contentType = head.ContentType ?? 'image/jpeg'
      if (size < MIN_SIZE_BYTES || !contentType.startsWith('image/')) {
        skipped++
        continue
      }

      const obj = await s3.send(new GetObjectCommand({
        Bucket: MINIO_BUCKET,
        Key: item.storageKey,
      }))
      if (!obj.Body) {
        failed++
        continue
      }
      const original = Buffer.from(await obj.Body.transformToByteArray())

      // rotate() wendet EXIF-Orientierung an, dann auf max. 1600px verkleinern
      let img = sharp(original).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true })
      // Format bleibt erhalten, damit Content-Type und Dateiendung konsistent bleiben
      const ext = item.storageKey.split('.').pop()?.toLowerCase()
      if (ext === 'png') img = img.png({ compressionLevel: 9 })
      else if (ext === 'webp') img = img.webp({ quality: 78 })
      else img = img.jpeg({ quality: 78, mozjpeg: true })

      const compressed = await img.toBuffer()

      // Nur zurückschreiben, wenn es sich wirklich lohnt
      if (compressed.length >= original.length) {
        skipped++
        continue
      }

      await s3.send(new PutObjectCommand({
        Bucket: MINIO_BUCKET,
        Key: item.storageKey,
        Body: compressed,
        ContentType: contentType,
      }))

      const meta = await sharp(compressed).metadata()
      await prisma.media.update({
        where: { id: item.id },
        data: { width: meta.width ?? null, height: meta.height ?? null },
      })

      optimized++
      savedBytes += original.length - compressed.length
    } catch (e) {
      console.error('[media-optimize] Fehler bei', item.storageKey, e)
      failed++
    }
  }

  const nextOffset = offset + batch.length
  return NextResponse.json({
    ok: true,
    total,
    processed: batch.length,
    optimized,
    skipped,
    failed,
    savedBytes,
    nextOffset,
    done: nextOffset >= total,
  })
}
