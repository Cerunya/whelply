import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { geocodeAddress } from '@/lib/geocode'

// POST: Alle Züchter ohne Koordinaten geocoden (Admin-only, einmalig)
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (user?.role !== 'admin') return NextResponse.json({ error: 'Nur Admins' }, { status: 403 })

  const breeders = await prisma.breederProfile.findMany({
    where: {
      latitude: null,
      OR: [{ zip: { not: null } }, { city: { not: null } }],
    },
    select: { id: true, zip: true, city: true, state: true, street: true, kennelName: true },
  })

  let updated = 0
  let failed = 0

  for (const b of breeders) {
    const coords = await geocodeAddress(b)
    if (coords) {
      await prisma.breederProfile.update({
        where: { id: b.id },
        data: { latitude: coords.lat, longitude: coords.lng },
      })
      updated++
    } else {
      failed++
    }
    // Nominatim: max 1 Request/Sekunde
    await new Promise((r) => setTimeout(r, 1100))
  }

  return NextResponse.json({ total: breeders.length, updated, failed })
}
