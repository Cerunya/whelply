import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import DashboardHeader from '@/components/DashboardHeader'
import MediathekClient from '@/components/MediathekClient'

export const dynamic = 'force-dynamic'

export default async function MediathekPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.role !== 'admin') redirect('/')

  const media = await prisma.media.findMany({
    where: { purpose: 'article_media' },
    orderBy: { createdAt: 'desc' },
    select: { id: true, url: true, storageKey: true, altText: true, createdAt: true },
  })

  return (
    <>
      <DashboardHeader title="Mediathek" backHref="/admin" backLabel="Admin" />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <p className="text-sm text-stone-500 mb-6">
          Bilder und PDFs für Ratgeber-Artikel. Klicke auf eine Datei, um die URL zu kopieren.
        </p>
        <MediathekClient initialMedia={media.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))} />
      </div>
    </>
  )
}
