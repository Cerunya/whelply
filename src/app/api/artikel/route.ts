import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  excerpt: z.string().nullable().optional(),
  content: z.string().min(1),
  category: z.enum(['ratgeber', 'rassen', 'news']).default('ratgeber'),
  coverImageUrl: z.string().nullable().optional(),
  metaTitle: z.string().nullable().optional(),
  metaDescription: z.string().nullable().optional(),
  breedId: z.string().nullable().optional(),
  authorName: z.string().nullable().optional(),
  isPublished: z.boolean().default(false),
})

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get('category')
  const onlyPublished = req.nextUrl.searchParams.get('published') === 'true'

  const where: any = {}
  if (category) where.category = category
  if (onlyPublished) where.isPublished = true

  const articles = await prisma.article.findMany({
    where,
    include: { breed: { select: { nameDe: true, slug: true } } },
    orderBy: { publishedAt: 'desc' },
  })

  return NextResponse.json(articles)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  // Admin-Check
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.role !== 'admin') return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const article = await prisma.article.create({
    data: {
      ...parsed.data,
      publishedAt: parsed.data.isPublished ? new Date() : null,
    },
  })

  return NextResponse.json(article, { status: 201 })
}
