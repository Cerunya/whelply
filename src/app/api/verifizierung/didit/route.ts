import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createDiditSession, getDiditSession } from '@/lib/didit'

const MONTHLY_LIMIT = 500

/** Zählt Didit-Checks im aktuellen Monat */
async function getMonthlyCount(): Promise<number> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return prisma.breederProfile.count({
    where: {
      diditCheckedAt: { gte: startOfMonth },
    },
  })
}

// GET: Monatliches Limit prüfen
export async function GET() {
  const count = await getMonthlyCount()
  return NextResponse.json({ count, limit: MONTHLY_LIMIT, available: count < MONTHLY_LIMIT })
}

// POST: Didit-Session erstellen
export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })
  if (!breeder) return NextResponse.json({ error: 'Kein Züchterprofil' }, { status: 404 })

  // Bereits per Didit verifiziert?
  if (breeder.diditStatus === 'approved') {
    return NextResponse.json({ error: 'ID bereits verifiziert' }, { status: 400 })
  }

  // Monatslimit prüfen
  const count = await getMonthlyCount()
  if (count >= MONTHLY_LIMIT) {
    return NextResponse.json({ error: 'ID-Prüfung diesen Monat nicht verfügbar. Bitte lade stattdessen ein Dokument hoch.' }, { status: 429 })
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://whelply.de'
    const callbackUrl = `${appUrl}/dashboard/profil`

    const diditSession = await createDiditSession(breeder.id, callbackUrl)

    // Session-ID speichern + Zeitstempel für Counter
    await prisma.breederProfile.update({
      where: { id: breeder.id },
      data: {
        diditSessionId: diditSession.session_id,
        diditStatus: 'pending',
        diditCheckedAt: new Date(),
      },
    })

    return NextResponse.json({ url: diditSession.url })
  } catch (e: any) {
    console.error('Didit error:', e.message)
    return NextResponse.json({ error: 'ID-Prüfung konnte nicht gestartet werden.' }, { status: 500 })
  }
}

// PATCH: Status bei Didit direkt abfragen (Fallback wenn Webhook nicht ankommt)
export async function PATCH() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })
  if (!breeder) return NextResponse.json({ error: 'Kein Züchterprofil' }, { status: 404 })

  if (!breeder.diditSessionId) {
    return NextResponse.json({ error: 'Keine laufende ID-Prüfung' }, { status: 400 })
  }

  if (breeder.diditStatus === 'approved') {
    return NextResponse.json({ status: 'approved' })
  }

  try {
    const decision = await getDiditSession(breeder.diditSessionId)
    if (!decision) {
      return NextResponse.json({ status: 'pending' })
    }

    const rawStatus = (decision.status || decision.verification_status || '').toLowerCase()

    if (rawStatus === 'approved' || rawStatus === 'success' || rawStatus === 'verified') {
      await prisma.breederProfile.update({
        where: { id: breeder.id },
        data: { diditStatus: 'approved' },
      })
      return NextResponse.json({ status: 'approved' })
    } else if (rawStatus === 'declined' || rawStatus === 'rejected') {
      await prisma.breederProfile.update({
        where: { id: breeder.id },
        data: { diditStatus: 'declined' },
      })
      return NextResponse.json({ status: 'declined' })
    }

    return NextResponse.json({ status: 'pending' })
  } catch (e: any) {
    console.error('Didit status check error:', e.message)
    return NextResponse.json({ error: 'Status konnte nicht abgefragt werden.' }, { status: 500 })
  }
}
