import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH — Züchter schaltet die E-Mail-Benachrichtigung bei neuen Nachrichten an/aus
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const optIn = body.optIn === true

  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })
  if (!breeder) return NextResponse.json({ error: 'Kein Züchter-Profil' }, { status: 403 })

  await prisma.breederProfile.update({ where: { id: breeder.id }, data: { messageEmailOptIn: optIn } })

  return NextResponse.json({ ok: true, optIn })
}
