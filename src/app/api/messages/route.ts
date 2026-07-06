import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const sendSchema = z.object({
  breederId: z.string(),
  content: z.string().min(1).max(2000),
})

// GET — alle Conversations des eingeloggten Nutzers (oder Züchters)
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'Nutzer nicht gefunden' }, { status: 404 })

  if (user.role === 'breeder') {
    const breeder = await prisma.breederProfile.findUnique({ where: { userId: user.id } })
    if (!breeder) return NextResponse.json([])

    const conversations = await prisma.conversation.findMany({
      where: { breederId: breeder.id },
      include: {
        user: { select: { email: true, displayName: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(conversations)
  } else {
    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      include: {
        breeder: { select: { kennelName: true, displayName: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json(conversations)
  }
}

// POST — neue Nachricht senden (erstellt Conversation wenn nötig)
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const body = await req.json()
  const parsed = sendSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

  const { breederId, content } = parsed.data

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'Nutzer nicht gefunden' }, { status: 404 })

  // Züchter können keine Nachricht an sich selbst schicken
  const breeder = await prisma.breederProfile.findUnique({ where: { id: breederId } })
  if (!breeder) return NextResponse.json({ error: 'Züchter nicht gefunden' }, { status: 404 })
  if (breeder.userId === session.user.id) return NextResponse.json({ error: 'Du kannst dir nicht selbst schreiben' }, { status: 400 })

  // Conversation erstellen oder finden
  // Wer eine Nachricht schickt, ist immer der 'user' in der Conversation
  // (egal ob das Konto ein Züchter ist — als Kontaktierender agiert man als Nutzer)
  const conversation = await prisma.conversation.upsert({
    where: { userId_breederId: { userId: session.user.id, breederId } },
    create: { userId: session.user.id, breederId, messages: { create: { senderRole: 'user', content } } },
    update: { updatedAt: new Date(), messages: { create: { senderRole: 'user', content } } },
  })

  return NextResponse.json({ conversationId: conversation.id })
}
