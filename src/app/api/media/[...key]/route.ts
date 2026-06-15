import { NextRequest, NextResponse } from 'next/server'
import { s3, MINIO_BUCKET } from '@/lib/s3'
import { GetObjectCommand } from '@aws-sdk/client-s3'

// /api/media/listings/abc123/photo.jpg/view
// Liefert das Bild direkt aus (Server holt es intern von Garage und reicht es durch)
export async function GET(
  req: NextRequest,
  { params }: { params: { key: string[] } }
) {
  const segments = params.key
  if (segments[segments.length - 1] !== 'view') {
    return NextResponse.json({ error: 'Ungültiger Pfad' }, { status: 400 })
  }
  const storageKey = segments.slice(0, -1).join('/')

  try {
    const result = await s3.send(new GetObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: storageKey,
    }))

    if (!result.Body) return NextResponse.json({ error: 'Bild nicht gefunden' }, { status: 404 })

    // Stream statt vollständig puffern — schickt Bytes weiter, sobald sie von Garage ankommen
    const stream = result.Body.transformToWebStream()

    const headers: Record<string, string> = {
      'Content-Type': result.ContentType ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    }
    if (result.ContentLength) headers['Content-Length'] = String(result.ContentLength)

    return new NextResponse(stream, { headers })
  } catch {
    return NextResponse.json({ error: 'Bild nicht gefunden' }, { status: 404 })
  }
}
