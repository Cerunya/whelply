import { NextRequest, NextResponse } from 'next/server'
import { s3, MINIO_BUCKET } from '@/lib/s3'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// /api/media/listings/abc123/photo.jpg/view
// → leitet weiter auf eine kurzlebige signierte MinIO-URL
export async function GET(
  req: NextRequest,
  { params }: { params: { key: string[] } }
) {
  // letztes Segment ist "view" — wird entfernt, der Rest ist der storageKey
  const segments = params.key
  if (segments[segments.length - 1] !== 'view') {
    return NextResponse.json({ error: 'Ungültiger Pfad' }, { status: 400 })
  }
  const storageKey = segments.slice(0, -1).join('/')

  const command = new GetObjectCommand({
    Bucket: MINIO_BUCKET,
    Key: storageKey,
  })

  try {
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 }) // 1 Stunde gültig
    return NextResponse.redirect(url)
  } catch {
    return NextResponse.json({ error: 'Bild nicht gefunden' }, { status: 404 })
  }
}
