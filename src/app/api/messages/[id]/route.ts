import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// GET — alle Nachrichten einer Conversation
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      user: { select: { id: true, email: true, displayName: true } },
      breeder: { select: { id: true, kennelName: true, userId: true } },
    },
  })

  if (!conversation) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  // Zugriff nur für Teilnehmer
  const isUser = conversation.userId === session.user.id
  const isBreeder = conversation.breeder.userId === session.user.id
  if (!isUser && !isBreeder) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  // Ungelesene Nachrichten als gelesen markieren
  const role = isBreeder ? 'user' : 'breeder'
  await prisma.message.updateMany({
    where: { conversationId: params.id, senderRole: role, readAt: null },
    data: { readAt: new Date() },
  })

  return NextResponse.json(conversation)
}

// POST — Antwort senden
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'Nachricht darf nicht leer sein' }, { status: 400 })

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: { breeder: { select: { userId: true } } },
  })
  if (!conversation) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const isUser = conversation.userId === session.user.id
  const isBreeder = conversation.breeder.userId === session.user.id
  if (!isUser && !isBreeder) return NextResponse.json({ error: 'Kein Zugriff' }, { status: 403 })

  const senderRole = isBreeder ? 'breeder' : 'user'
  const message = await prisma.message.create({
    data: { conversationId: params.id, senderRole, content },
  })

  await prisma.conversation.update({ where: { id: params.id }, data: { updatedAt: new Date() } })

  return NextResponse.json(message)
}
