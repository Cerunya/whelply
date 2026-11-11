import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardHeader from '@/components/DashboardHeader'
import RatgeberHighlights from '@/components/RatgeberHighlights'

export const dynamic = 'force-dynamic'

export default async function AdminHighlightsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.role !== 'admin') redirect('/')

  const [articles, setting] = await Promise.all([
    prisma.article.findMany({ where: { isPublished: true }, select: { id: true, title: true }, orderBy: { publishedAt: 'desc' } }),
    prisma.platformSetting.findUnique({ where: { key: 'ratgeber_pinned_articles' } }),
  ])

  let initialIds: string[] = []
  try {
    const parsed = setting ? JSON.parse(setting.value) : []
    if (Array.isArray(parsed)) initialIds = parsed.filter((id): id is string => typeof id === 'string').slice(0, 5)
  } catch {}

  return (
    <>
      <DashboardHeader title="Ratgeber-Highlights" backHref="/admin/artikel" backLabel="Artikel" />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="mb-6 text-sm leading-relaxed text-stone-500">Wähle bis zu fünf veröffentlichte Artikel für den oberen Bereich der Ratgeber-Seite. Leere Positionen werden automatisch mit den neuesten Beiträgen aufgefüllt.</p>
        <RatgeberHighlights articles={articles} initialIds={initialIds} />
      </div>
    </>
  )
}
