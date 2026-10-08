import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { s3, MINIO_BUCKET } from '@/lib/s3'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

// PATCH — Admin entscheidet über eine manuelle ID-Prüfung
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })
  }

  const breeder = await prisma.breederProfile.findUnique({
    where: { id: params.id },
    select: { id: true, idDocKey: true, idDocBackKey: true },
  })
  if (!breeder) return NextResponse.json({ error: 'Züchter nicht gefunden' }, { status: 404 })
  if (!breeder.idDocKey) {
    return NextResponse.json({ error: 'Keine ausstehende ID-Prüfung für diesen Züchter.' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const action = body.action as 'approve' | 'reject' | undefined
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 })
  }

  // Dokumente sofort aus dem Storage löschen (DSGVO) — unabhängig von der Entscheidung
  for (const key of [breeder.idDocKey, breeder.idDocBackKey]) {
    if (!key) continue
    try {
      await s3.send(new DeleteObjectCommand({ Bucket: MINIO_BUCKET, Key: key }))
    } catch {
      // Löschfehler nicht fatal für die Entscheidung
    }
  }

  if (action === 'approve') {
    // diditStatus = 'approved' ist das universelle "ID geprüft"-Signal —
    // alle bestehenden Badge-Anzeigen greifen damit ohne weitere Änderung.
    // diditCheckedAt wird bewusst NICHT gesetzt (es füttert den Didit-Monatszähler).
    await prisma.breederProfile.update({
      where: { id: breeder.id },
      data: {
        diditStatus: 'approved',
        idDocKey: null,
        idDocBackKey: null,
        idDocRejectReason: null,
      },
    })
  } else {
    await prisma.breederProfile.update({
      where: { id: breeder.id },
      data: {
        idDocKey: null,
        idDocBackKey: null,
        idDocRejectReason: typeof body.reason === 'string' && body.reason.trim()
          ? body.reason.trim()
          : 'Ausweisdokument konnte nicht bestätigt werden.',
      },
    })
  }

  return NextResponse.json({ ok: true })
}
