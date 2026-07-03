import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import DashboardHeader from '@/components/DashboardHeader'
import ConversationView from '@/components/ConversationView'

export const dynamic = 'force-dynamic'

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const conversation = await prisma.conversation.findUnique({
    where: { id: params.id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      user: { select: { id: true, email: true, displayName: true } },
      breeder: { select: { id: true, kennelName: true, userId: true } },
    },
  })

  if (!conversation) notFound()

  const isUser = conversation.userId === session.user.id
  const isBreeder = conversation.breeder.userId === session.user.id
  if (!isUser && !isBreeder) notFound()

  // Als gelesen markieren
  await prisma.message.updateMany({
    where: {
      conversationId: params.id,
      senderRole: isBreeder ? 'user' : 'breeder',
      readAt: null,
    },
    data: { readAt: new Date() },
  })

  const myRole = isBreeder ? 'breeder' : 'user'
  const otherName = isBreeder
    ? (conversation.user.displayName || conversation.user.email)
    : conversation.breeder.kennelName

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <DashboardHeader title={otherName} backHref="/dashboard/nachrichten" backLabel="Nachrichten" />
      <ConversationView
        conversationId={params.id}
        initialMessages={conversation.messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
          readAt: m.readAt?.toISOString() ?? null,
        }))}
        myRole={myRole}
        otherName={otherName}
      />
    </div>
  )
}
