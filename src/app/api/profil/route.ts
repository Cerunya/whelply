import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateSubdomain } from '@/lib/subdomain'
import { z } from 'zod'

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

const schema = z.object({
  displayName: z.string().max(80).optional(),
  bio: z.string().max(2000).optional(),
  website: z.string().url().or(z.literal('')).optional(),
  socialInstagram: z.string().url().or(z.literal('')).nullable().optional(),
  socialFacebook: z.string().url().or(z.literal('')).nullable().optional(),
  socialTiktok: z.string().url().or(z.literal('')).nullable().optional(),
  socialYoutube: z.string().url().or(z.literal('')).nullable().optional(),
  verband: z.string().max(50).optional(),
  mitgliedsnummer: z.string().max(50).optional(),
  phone: z.string().max(30).optional(),
  street: z.string().max(120).optional(),
  zip: z.string().max(5).optional(),
  city: z.string().max(80).optional(),
  state: z.string().max(50).optional(),
  showPhone: z.boolean().optional(),
  showAddress: z.boolean().optional(),
  subdomain: z.string().max(30).optional(),
  themeColor: z.string().regex(HEX_COLOR).or(z.literal('')).optional(),
  themeAccentColor: z.string().regex(HEX_COLOR).or(z.literal('')).optional(),
  themeBgColor: z.string().regex(HEX_COLOR).or(z.literal('')).nullable().optional(),
  themeNavColor: z.string().regex(HEX_COLOR).or(z.literal('')).nullable().optional(),
  themeFont: z.string().max(80).nullable().optional(),
  themeAlign: z.enum(['left', 'center', 'right']).nullable().optional(),
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

  // Subdomain validieren + Eindeutigkeit prüfen, falls geändert
  if (parsed.data.subdomain !== undefined && parsed.data.subdomain !== '') {
    const sub = parsed.data.subdomain.toLowerCase()
    const error = validateSubdomain(sub)
    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }
    if (sub !== breeder.subdomain) {
      const existing = await prisma.breederProfile.findUnique({ where: { subdomain: sub } })
      if (existing) {
        return NextResponse.json({ error: 'Diese Subdomain ist bereits vergeben.' }, { status: 409 })
      }
    }
    parsed.data.subdomain = sub
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
