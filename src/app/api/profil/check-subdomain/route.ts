import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { validateSubdomain } from '@/lib/subdomain'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const sub = (req.nextUrl.searchParams.get('subdomain') ?? '').toLowerCase().trim()

  const error = validateSubdomain(sub)
  if (error) {
    return NextResponse.json({ available: false, error })
  }

  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id } })

  const existing = await prisma.breederProfile.findUnique({ where: { subdomain: sub } })
  if (existing && existing.id !== breeder?.id) {
    return NextResponse.json({ available: false, error: 'Diese Subdomain ist bereits vergeben.' })
  }

  return NextResponse.json({ available: true })
}
