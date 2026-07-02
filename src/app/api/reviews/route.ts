import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  breederId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  content: z.string().max(2000).optional(),
})

export async function GET(req: NextRequest) {
  const breederId = new URL(req.url).searchParams.get('breederId')
  if (!breederId) return NextResponse.json([])

  const reviews = await prisma.review.findMany({
    where: { breederId },
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const avg = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null

  return NextResponse.json({ reviews, avg, count: reviews.length })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const review = await prisma.review.upsert({
    where: { userId_breederId: { userId: session.user.id, breederId: parsed.data.breederId } },
    create: { userId: session.user.id, ...parsed.data },
    update: { rating: parsed.data.rating, title: parsed.data.title, content: parsed.data.content },
  })

  return NextResponse.json(review)
}
