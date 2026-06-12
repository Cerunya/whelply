import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  displayName: z.string().max(80).optional(),
  bio: z.string().max(2000).optional(),
  website: z.string().url().or(z.literal('')).optional(),
  verband: z.string().max(50).optional(),
  mitgliedsnummer: z.string().max(50).optional(),
  phone: z.string().max(30).optional(),
  street: z.string().max(120).optional(),
  zip: z.string().max(5).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(50).optional(),
  showPhone: z.boolean().optional(),
  showAddress: z.boolean().optional(),
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })
  if (!breeder) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  // Leere Strings als null speichern (Booleans unverändert lassen)
  const data = Object.fromEntries(
    Object.entries(parsed.data).map(([key, value]) => [
      key,
      typeof value === 'string' && value === '' ? null : value,
    ])
  )

  await prisma.breederProfile.update({
    where: { userId: session.user.id },
    data,
  })

  return NextResponse.json({ ok: true })
}
