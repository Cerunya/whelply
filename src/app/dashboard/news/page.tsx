import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import DashboardHeader from '@/components/DashboardHeader'
import MobileNav from '@/components/MobileNav'

export default async function NewsListPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
  })
  if (!breeder) redirect('/login')

  const posts = await prisma.newsPost.findMany({
    where: { breederId: breeder.id },
    orderBy: { createdAt: 'desc' },
    include: { media: { take: 1, select: { url: true } } },
  })

  return (
    <div className="min-h-screen bg-cream font-sans">
      <DashboardHeader title="Aktuelles" />

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">Aktuelles</h1>
          <p className="text-stone-400 text-sm">
            Neuigkeiten aus deinem Zwinger — erscheinen auf deiner öffentlichen Züchterseite unter "Aktuelles".
          </p>
        </div>

        <div className="flex justify-end mb-4">
          <Link
            href="/dashboard/news/neu"
            className="bg-forest text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-forest-light transition-colors"
          >
            + Neuer Beitrag
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-cream-deep">
            <p className="text-stone-500 mb-4">Noch keine Beiträge.</p>
            <Link
              href="/dashboard/news/neu"
              className="bg-forest text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-forest-light transition-colors"
            >
              + Ersten Beitrag erstellen
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/dashboard/news/${post.id}`}
                className="bg-white rounded-2xl border border-cream-deep p-5 flex items-center gap-4 hover:border-forest/30 hover:shadow-sm transition-all"
              >
                {post.media[0]?.url && (
                  <img src={post.media[0].url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-stone-800 truncate">{post.title}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {post.createdAt.toLocaleDateString('de-DE')}
                  </p>
                </div>
                <span className="text-stone-300">→</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
