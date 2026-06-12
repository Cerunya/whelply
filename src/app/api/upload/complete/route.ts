import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  listingId: z.string(),
  storageKey: z.string(),
  isPrimary: z.boolean().default(false),
})

// Schritt 2: Nach erfolgreichem Upload zu MinIO — Media-Eintrag in DB anlegen
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  const { listingId, storageKey, isPrimary } = parsed.data

  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })
  if (!breeder) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const listing = await prisma.listing.findUnique({ where: { id: listingId } })
  if (!listing || listing.breederId !== breeder.id) {
    return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  }

  // Falls als primäres Bild markiert: alle anderen Bilder dieses Inserats zurücksetzen
  if (isPrimary) {
    await prisma.media.updateMany({
      where: { listingId },
      data: { isPrimary: false },
    })
  }

  const existingCount = await prisma.media.count({ where: { listingId } })

  const media = await prisma.media.create({
    data: {
      storageKey,
      url: `/api/media/${storageKey}/view`, // wird über unsere eigene Route ausgeliefert (presigned)
      listingId,
      isPrimary: isPrimary || existingCount === 0, // erstes Bild automatisch primär
      sortOrder: existingCount,
    },
  })

  return NextResponse.json({ id: media.id, url: media.url })
}
