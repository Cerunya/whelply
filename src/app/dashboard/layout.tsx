import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardShell from '@/components/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) return children

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      kennelName: true,
      city: true,
      subscription: { select: { plan: true } },
      user: { select: { role: true } },
    },
  })
  if (!breeder || breeder.user.role === 'service') return children

  const unreadCount = await prisma.message.count({
    where: {
      readAt: null,
      OR: [
        { senderRole: 'user', conversation: { breederId: breeder.id } },
        { senderRole: 'breeder', conversation: { userId: session.user.id } },
      ],
    },
  })

  return <DashboardShell
    kennelName={breeder.kennelName}
    city={breeder.city}
    plan={breeder.subscription?.plan ?? 'free'}
    unreadCount={unreadCount}
    isAdmin={breeder.user.role === 'admin'}
  >{children}</DashboardShell>
}
