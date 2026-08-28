import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Alle Kategorien auflisten
export async function GET() {
  const categories = await prisma.articleCategory.findMany({
    orderBy: { sortOrder: 'asc' },
  })
  return NextResponse.json(categories)
}

// POST: Neue Kategorie erstellen
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (user?.role !== 'admin') return NextResponse.json({ error: 'Nur Admins' }, { status: 403 })

  const { name, slug, description } = await req.json()
  if (!name || !slug) return NextResponse.json({ error: 'Name und Slug erforderlich' }, { status: 400 })

  const existing = await prisma.articleCategory.findUnique({ where: { slug } })
  if (existing) return NextResponse.json({ error: 'Slug existiert bereits' }, { status: 409 })

  const maxOrder = await prisma.articleCategory.aggregate({ _max: { sortOrder: true } })
  const category = await prisma.articleCategory.create({
    data: { name, slug, description: description || null, sortOrder: (maxOrder._max.sortOrder ?? 0) + 1 },
  })

  return NextResponse.json(category, { status: 201 })
}

// DELETE: Kategorie löschen
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (user?.role !== 'admin') return NextResponse.json({ error: 'Nur Admins' }, { status: 403 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  await prisma.articleCategory.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
