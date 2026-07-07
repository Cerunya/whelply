import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Löscht Dog-Einträge verkaufter Welpen nach 3 Monaten.
// Aufruf: GET /api/cron/cleanup?secret=CRON_SECRET
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)

  // Finde Dog-Einträge deren einziges Listing ein verkaufter Welpe ist, älter als 3 Monate
  const soldPuppyDogs = await prisma.dog.findMany({
    where: {
      listings: {
        every: { type: 'puppy', status: 'sold' },
        some: { type: 'puppy', status: 'sold', updatedAt: { lt: threeMonthsAgo } },
      },
    },
    select: { id: true },
  })

  let deleted = 0
  for (const dog of soldPuppyDogs) {
    try {
      // Cascade löscht auch Media und Listings
      await prisma.dog.delete({ where: { id: dog.id } })
      deleted++
    } catch (e) {
      console.error(`[cleanup] Fehler beim Löschen von Dog ${dog.id}:`, e)
    }
  }

  console.log(`[cleanup] ${deleted} verkaufte Welpen-Einträge gelöscht (älter als 3 Monate).`)
  return NextResponse.json({ ok: true, deleted })
}
