import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { s3, MINIO_BUCKET } from '@/lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { z } from 'zod'

const schema = z.object({
  listingId: z.string(),
  fileName: z.string(),
  contentType: z.string().regex(/^image\/(jpeg|png|webp)$/),
})

// Schritt 1: Presigned Upload-URL anfordern
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { listingId, fileName, contentType } = parsed.data

  // Prüfen ob das Inserat dem eingeloggten Züchter gehört
  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })
  if (!breeder) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const listing = await prisma.listing.findUnique({ where: { id: listingId } })
  if (!listing || listing.breederId !== breeder.id) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  }

  // Eindeutiger Storage-Key
  const ext = fileName.split('.').pop()?.toLowerCase() ?? 'jpg'
  const storageKey = `listings/${listingId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const command = new PutObjectCommand({
    Bucket: MINIO_BUCKET,
    Key: storageKey,
    ContentType: contentType,
  })

  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 }) // 5 Minuten gültig

  return NextResponse.json({ uploadUrl, storageKey })
}
