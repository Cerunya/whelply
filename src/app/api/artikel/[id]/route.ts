import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    include: { breed: { select: { nameDe: true, slug: true } } },
  })
  if (!article) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(article)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.role !== 'admin') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const body = await req.json()
  const existing = await prisma.article.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  // Wenn gerade veröffentlicht wird, publishedAt setzen
  if (body.isPublished && !existing.isPublished) {
    body.publishedAt = new Date()
  }

  const article = await prisma.article.update({ where: { id: params.id }, data: body })
  return NextResponse.json(article)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.role !== 'admin') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  await prisma.article.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
