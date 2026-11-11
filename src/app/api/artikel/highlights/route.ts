import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

const schema = z.object({ ids: z.array(z.string()).max(5) })

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.role !== 'admin') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'Ungültige Auswahl' }, { status: 400 })
  const ids = Array.from(new Set(parsed.data.ids))
  if (ids.length !== parsed.data.ids.length) return NextResponse.json({ error: 'Ein Artikel kann nur einmal ausgewählt werden.' }, { status: 400 })

  const publishedCount = await prisma.article.count({ where: { id: { in: ids }, isPublished: true } })
  if (publishedCount !== ids.length) return NextResponse.json({ error: 'Nur veröffentlichte Artikel können hervorgehoben werden.' }, { status: 400 })

  await prisma.platformSetting.upsert({
    where: { key: 'ratgeber_pinned_articles' },
    create: { key: 'ratgeber_pinned_articles', value: JSON.stringify(ids) },
    update: { value: JSON.stringify(ids) },
  })
  return NextResponse.json({ ok: true })
}
