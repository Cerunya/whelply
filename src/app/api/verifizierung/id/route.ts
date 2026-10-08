import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { s3, MINIO_BUCKET } from '@/lib/s3'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

// GET — Status der manuellen ID-Prüfung des eingeloggten Züchters
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
    select: { idDocKey: true, idDocRequestedAt: true, idDocRejectReason: true, diditStatus: true },
  })
  if (!breeder) return NextResponse.json({ error: 'Kein Züchterprofil' }, { status: 404 })

  return NextResponse.json({
    pending: !!breeder.idDocKey,
    requestedAt: breeder.idDocRequestedAt?.toISOString() ?? null,
    rejectReason: breeder.idDocRejectReason ?? null,
    approved: breeder.diditStatus === 'approved',
  })
}

// POST — Ausweisdokument(e) zur manuellen Prüfung einreichen
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, diditStatus: true, idDocKey: true, idDocBackKey: true, idDocSelfieKey: true },
  })
  if (!breeder) return NextResponse.json({ error: 'Kein Züchterprofil' }, { status: 404 })

  if (breeder.diditStatus === 'approved') {
    return NextResponse.json({ error: 'Deine Identität ist bereits bestätigt.' }, { status: 400 })
  }

  const formData = await req.formData()
  const front = formData.get('front') as File | null
  const back = formData.get('back') as File | null
  const selfie = formData.get('selfie') as File | null
  const consent = formData.get('consent')

  if (!front || front.size === 0) {
    return NextResponse.json({ error: 'Bitte lade die Vorderseite deines Ausweises hoch.' }, { status: 400 })
  }
  if (!selfie || selfie.size === 0) {
    return NextResponse.json({ error: 'Bitte lade ein Selfie hoch, auf dem du deinen Ausweis in der Hand hältst.' }, { status: 400 })
  }
  if (consent !== 'true') {
    return NextResponse.json({ error: 'Bitte bestätige die Einwilligung.' }, { status: 400 })
  }

  for (const [label, file] of [['Vorderseite', front], ['Rückseite', back], ['Selfie', selfie]] as const) {
    if (!file || file.size === 0) continue
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `${label}: Nur JPG, PNG, WebP oder PDF erlaubt.` }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `${label}: Datei zu groß (max. 10 MB).` }, { status: 400 })
    }
  }

  // Alte Dokumente entfernen (erneute Einreichung ersetzt die vorherige)
  for (const oldKey of [breeder.idDocKey, breeder.idDocBackKey, breeder.idDocSelfieKey]) {
    if (!oldKey) continue
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: MINIO_BUCKET, Key: oldKey }))
    } catch {
      // Löschfehler nicht fatal — Datei wird bei nächster Entscheidung überschrieben
    }
  }

  const ts = Date.now()
  async function upload(file: File, suffix: string): Promise<string> {
    const ext = file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1]
    const key = `verification-id/${breeder!.id}/${ts}-${suffix}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    await s3.send(new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }))
    return key
  }

  const frontKey = await upload(front, 'front')
  const backKey = back && back.size > 0 ? await upload(back, 'back') : null
  const selfieKey = await upload(selfie, 'selfie')

  await prisma.breederProfile.update({
    where: { id: breeder.id },
    data: {
      idDocKey: frontKey,
      idDocBackKey: backKey,
      idDocSelfieKey: selfieKey,
      idDocRequestedAt: new Date(),
      idDocRejectReason: null,
    },
  })

  return NextResponse.json({ ok: true })
}
