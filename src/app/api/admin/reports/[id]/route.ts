import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  const admin = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Nicht erlaubt' }, { status: 403 })
  await prisma.report.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
