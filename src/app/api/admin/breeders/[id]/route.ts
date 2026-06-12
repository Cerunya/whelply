import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return null
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.role !== 'admin') return null
  return user
}

const patchSchema = z.object({
  verificationLevel: z.enum(['none', 'verband', 'fci']),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Nicht erlaubt' }, { status: 403 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
  }

  await prisma.breederProfile.update({
    where: { id: params.id },
    data: { verificationLevel: parsed.data.verificationLevel },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Nicht erlaubt' }, { status: 403 })

  const breeder = await prisma.breederProfile.findUnique({ where: { id: params.id } })
  if (!breeder) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  // Löscht durch Cascade auch listings, litters, dogs, media (siehe Prisma-Schema onDelete: Cascade)
  // sowie den zugehörigen User-Account
  await prisma.user.delete({ where: { id: breeder.userId } })

  return NextResponse.json({ ok: true })
}
