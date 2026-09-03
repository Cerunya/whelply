import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET/PATCH /api/admin/einstellungen — Plattform-Einstellungen (nur Admins)
// Gespeichert in platform_settings (Key-Value). Bekannte Keys:
//   boost_price_cents   — Preis der 24h-Topanzeige in Cent (50–50000)
//   boost_cooldown_days — Frequenz-Deckel in Tagen (1–30)

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id) return null
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  return user?.role === 'admin' ? user : null
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Nur Admins' }, { status: 403 })

  const rows = await prisma.platformSetting.findMany({
    where: { key: { in: ['boost_price_cents', 'boost_cooldown_days'] } },
  })
  const map: Record<string, string> = {}
  for (const r of rows) map[r.key] = r.value
  return NextResponse.json(map)
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Nur Admins' }, { status: 403 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 })

  const updates: { key: string; value: string }[] = []

  if (body.boostPriceCents !== undefined) {
    const v = Math.round(Number(body.boostPriceCents))
    // Stripe-Mindestbetrag für Kartenzahlungen: 0,50 €
    if (!Number.isFinite(v) || v < 50 || v > 50000) {
      return NextResponse.json(
        { error: 'Der Preis muss zwischen 0,50 € und 500,00 € liegen (Stripe-Mindestbetrag: 0,50 €).' },
        { status: 400 }
      )
    }
    updates.push({ key: 'boost_price_cents', value: String(v) })
  }

  if (body.boostCooldownDays !== undefined) {
    const v = Math.round(Number(body.boostCooldownDays))
    if (!Number.isFinite(v) || v < 1 || v > 30) {
      return NextResponse.json(
        { error: 'Der Frequenz-Deckel muss zwischen 1 und 30 Tagen liegen.' },
        { status: 400 }
      )
    }
    updates.push({ key: 'boost_cooldown_days', value: String(v) })
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: 'Keine Werte übergeben.' }, { status: 400 })
  }

  for (const u of updates) {
    await prisma.platformSetting.upsert({
      where: { key: u.key },
      update: { value: u.value },
      create: { key: u.key, value: u.value },
    })
  }

  return NextResponse.json({ ok: true })
}
