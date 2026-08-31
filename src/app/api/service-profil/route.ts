import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { s3, MINIO_BUCKET } from '@/lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import sharp from 'sharp'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const provider = await prisma.serviceProvider.findUnique({ where: { userId: session.user.id } })
  if (!provider) return NextResponse.json({ error: 'Kein Dienstleister-Profil' }, { status: 404 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const purpose = (formData.get('purpose') as string) || 'gallery'

  if (!file) return NextResponse.json({ error: 'Datei fehlt' }, { status: 400 })

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Nur Bilder erlaubt' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Max. 10 MB' }, { status: 400 })
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer())
  const maxWidth = purpose === 'logo' ? 400 : 1200

  let buffer: Buffer
  try {
    buffer = await sharp(rawBuffer)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()
  } catch {
    buffer = rawBuffer
  }

  const storageKey = `service/${provider.id}/${purpose}/${Date.now()}.webp`
  await s3.send(new PutObjectCommand({
    Bucket: MINIO_BUCKET,
    Key: storageKey,
    Body: buffer,
    ContentType: 'image/webp',
  }))

  const url = `/api/media/${storageKey}/view`

  // Logo: altes überschreiben
  if (purpose === 'logo') {
    await prisma.serviceProvider.update({
      where: { id: provider.id },
      data: { logoUrl: url },
    })
    return NextResponse.json({ url })
  }

  // Galerie: Media-Eintrag erstellen
  const media = await prisma.media.create({
    data: {
      storageKey,
      url,
      purpose: 'gallery',
      serviceId: provider.id,
      isPrimary: false,
      sortOrder: 0,
    },
  })

  return NextResponse.json({ id: media.id, url: media.url })
}
