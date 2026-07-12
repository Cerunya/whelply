import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (user?.role !== 'admin' && user?.role !== 'breeder') {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  const body = await req.json()
  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.asin !== undefined && { asin: body.asin }),
      ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl || null }),
      ...(body.category !== undefined && { category: body.category }),
      ...(body.description !== undefined && { description: body.description || null }),
      ...(body.affiliateTag !== undefined && { affiliateTag: body.affiliateTag }),
      ...(body.priceCents !== undefined && { priceCents: body.priceCents, priceUpdatedAt: new Date() }),
      ...(body.isAvailable !== undefined && { isAvailable: body.isAvailable }),
    },
  })
  return NextResponse.json(product)
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Nur Admins' }, { status: 403 })
  }

  await prisma.product.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
