import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { s3, MINIO_BUCKET } from '@/lib/s3'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (user?.role !== 'admin') return NextResponse.json({ error: 'Nur Admins' }, { status: 403 })

  const body = await req.json()
  const action = body.action as 'approve' | 'reject'

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 })
  }

  const breeder = await prisma.breederProfile.findUnique({ where: { id } })
  if (!breeder) return NextResponse.json({ error: 'Züchter nicht gefunden' }, { status: 404 })

  // Dokument aus MinIO löschen (DSGVO — sofort nach Entscheidung)
  if (breeder.verificationDocKey) {
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: MINIO_BUCKET, Key: breeder.verificationDocKey }))
    } catch {}
  }

  if (action === 'approve') {
    await prisma.breederProfile.update({
      where: { id },
      data: {
        verificationLevel: 'doc_verified',
        verifiedAt: new Date(),
        verificationDocKey: null,
        verificationRejectReason: null,
      },
    })
  } else {
    await prisma.breederProfile.update({
      where: { id },
      data: {
        verificationLevel: 'none',
        verificationDocKey: null,
        verificationRejectReason: body.reason || 'Dokument konnte nicht bestätigt werden.',
      },
    })
  }

  return NextResponse.json({ ok: true })
}
