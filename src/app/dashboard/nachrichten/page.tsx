import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardHeader from '@/components/DashboardHeader'

export const dynamic = 'force-dynamic'

export default async function NachrichtenPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) redirect('/login')

  let conversations: any[] = []

  if (user.role === 'breeder') {
    const breeder = await prisma.breederProfile.findUnique({ where: { userId: user.id } })
    if (breeder) {
      conversations = await prisma.conversation.findMany({
        where: { breederId: breeder.id },
        include: {
          user: { select: { email: true, displayName: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
      })
    }
  } else {
    conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      include: {
        breeder: { select: { kennelName: true, displayName: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    })
  }

  const isBreeder = user.role === 'breeder'

  return (
    <div className="min-h-screen bg-cream">
      <DashboardHeader title="Nachrichten" />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">Nachrichten</h1>
        {conversations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-cream-deep p-12 text-center">
            <p className="text-stone-400">Noch keine Nachrichten.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => {
              const lastMsg = conv.messages[0]
              const name = isBreeder
                ? (conv.user.displayName || conv.user.email)
                : conv.breeder.kennelName
              const unread = lastMsg && lastMsg.senderRole !== (isBreeder ? 'breeder' : 'user') && !lastMsg.readAt
              return (
                <Link key={conv.id} href={`/dashboard/nachrichten/${conv.id}`}
                  className="flex items-center gap-4 bg-white rounded-xl border border-cream-deep p-4 hover:border-forest/30 transition-colors">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm ${
                    unread ? 'bg-forest' : 'bg-stone-300'
                  }`}>
                    {name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-stone-900 truncate ${unread ? 'font-bold' : ''}`}>{name}</p>
                      {unread && <span className="w-2 h-2 rounded-full bg-forest flex-shrink-0" />}
                    </div>
                    {lastMsg && (
                      <p className="text-xs text-stone-400 truncate mt-0.5">{lastMsg.content}</p>
                    )}
                  </div>
                  <p className="text-xs text-stone-300 flex-shrink-0">
                    {lastMsg ? new Date(lastMsg.createdAt).toLocaleDateString('de-DE') : ''}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
