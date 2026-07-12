import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(products)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (user?.role !== 'admin' && user?.role !== 'breeder') {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const body = await req.json()
  const { asin, name, imageUrl, category, description, affiliateTag } = body

  if (!asin || !name) {
    return NextResponse.json({ error: 'ASIN und Name sind Pflicht' }, { status: 400 })
  }

  const product = await prisma.product.create({
    data: {
      asin: asin.trim(),
      name: name.trim(),
      imageUrl: imageUrl || null,
      category: category || 'zubehoer',
      description: description || null,
      affiliateTag: affiliateTag || 'whelply-21',
    },
  })

  return NextResponse.json(product, { status: 201 })
}
