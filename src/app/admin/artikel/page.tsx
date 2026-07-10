import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardHeader from '@/components/DashboardHeader'

export const dynamic = 'force-dynamic'

const CATEGORY_LABEL: Record<string, string> = { ratgeber: 'Ratgeber', rassen: 'Rassen', news: 'News' }

export default async function AdminArtikelPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.role !== 'admin') redirect('/')

  const articles = await prisma.article.findMany({
    include: { breed: { select: { nameDe: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <>
      <DashboardHeader title="Artikel verwalten" backHref="/admin" backLabel="Admin"
        action={<Link href="/admin/artikel/neu" className="bg-forest text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-forest-light transition-colors">+ Neuer Artikel</Link>}
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {articles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-cream-deep">
            <p className="text-stone-400 text-sm">Noch keine Artikel erstellt.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {articles.map((a) => (
              <Link key={a.id} href={`/admin/artikel/${a.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-cream-deep px-5 py-4 hover:border-forest/30 transition-colors">
                <div>
                  <p className="font-semibold text-stone-900">{a.title}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {CATEGORY_LABEL[a.category] ?? a.category}
                    {a.breed && ` · ${a.breed.nameDe}`}
                    {a.publishedAt && ` · ${new Date(a.publishedAt).toLocaleDateString('de-DE')}`}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${a.isPublished ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                  {a.isPublished ? 'Online' : 'Entwurf'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
