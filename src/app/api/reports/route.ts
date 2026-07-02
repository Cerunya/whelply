import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  listingId: z.string(),
  reason: z.enum(['spam', 'falsche_infos', 'betrug', 'unangemessen', 'sonstiges']),
  comment: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  await prisma.report.create({
    data: { userId: session.user.id, ...parsed.data },
  })

  return NextResponse.json({ message: 'Meldung eingereicht' })
}
