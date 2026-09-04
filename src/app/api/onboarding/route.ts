import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// PATCH — Onboarding-Checkliste dauerhaft ausblenden (pro User, alle Rollen)
export async function PATCH() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingDismissedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}

// DELETE — Checkliste wieder einblenden (z.B. für spätere neue Schritte)
export async function DELETE() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingDismissedAt: null },
  })

  return NextResponse.json({ ok: true })
}
