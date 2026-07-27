import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { s3, MINIO_BUCKET } from '@/lib/s3'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// POST: Verifizierungsdokument hochladen
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })
  if (!breeder) return NextResponse.json({ error: 'Kein Züchterprofil' }, { status: 404 })

  if (breeder.verificationLevel === 'doc_verified') {
    return NextResponse.json({ error: 'Bereits verifiziert' }, { status: 400 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const consent = formData.get('consent') as string | null

  if (!file) return NextResponse.json({ error: 'Datei fehlt' }, { status: 400 })
  if (consent !== 'true') return NextResponse.json({ error: 'Einwilligung erforderlich' }, { status: 400 })

  if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
    return NextResponse.json({ error: 'Nur JPG, PNG, WebP oder PDF erlaubt' }, { status: 400 })
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Datei zu groß (max. 10 MB)' }, { status: 400 })
  }

  // Altes Dokument löschen falls vorhanden
  if (breeder.verificationDocKey) {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: MINIO_BUCKET, Key: breeder.verificationDocKey }))
    } catch {}
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const buffer = Buffer.from(await file.arrayBuffer())
  const storageKey = `verification/${breeder.id}/${Date.now()}.${ext}`

  await s3.send(new PutObjectCommand({
    Bucket: MINIO_BUCKET,
    Key: storageKey,
    Body: buffer,
    ContentType: file.type,
  }))

  await prisma.breederProfile.update({
    where: { id: breeder.id },
    data: {
      verificationDocKey: storageKey,
      verificationRequestedAt: new Date(),
      verificationLevel: 'kennel_verified', // Markiert als "wartet auf Prüfung"
      verificationRejectReason: null,
    },
  })

  return NextResponse.json({ ok: true })
}

// GET: Verifizierungsstatus abrufen
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      verificationLevel: true,
      verificationRequestedAt: true,
      verifiedAt: true,
      verificationRejectReason: true,
    },
  })

  if (!breeder) return NextResponse.json({ error: 'Kein Züchterprofil' }, { status: 404 })

  return NextResponse.json({
    level: breeder.verificationLevel,
    requestedAt: breeder.verificationRequestedAt,
    verifiedAt: breeder.verifiedAt,
    rejectReason: breeder.verificationRejectReason,
  })
}
