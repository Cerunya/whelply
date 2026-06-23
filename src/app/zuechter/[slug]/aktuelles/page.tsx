import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BreederPageHeader from '@/components/BreederPageHeader'
import BreederPageContent from '@/components/BreederPageContent'
import { getBreederBySlug, getBreederTabs } from '@/lib/breeder'

export const dynamic = 'force-dynamic'

export default async function AktuellesPage({
  params,
}: {
  params: { slug: string }
}) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()

  const tabs = await getBreederTabs(breeder.id)

  const posts = await prisma.newsPost.findMany({
    where: { breederId: breeder.id },
    orderBy: { createdAt: 'desc' },
    include: { media: { take: 1, select: { url: true } } },
  })

  return (
    <>
      <Navbar />
      <main className="min-h-screen relative">
        <BreederPageHeader breeder={breeder} slug={params.slug} tabs={tabs} active="aktuelles" />

        <BreederPageContent>
          <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">Aktuelles</h2>

          {posts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-cream-deep">
              <p className="text-stone-400">Noch keine Beiträge.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {posts.map((post) => (
                <article key={post.id} className="bg-white rounded-2xl border border-cream-deep overflow-hidden">
                  {post.media[0]?.url && (
                    <img src={post.media[0].url} alt="" className="w-full max-h-96 object-cover" />
                  )}
                  <div className="p-6">
                    <p className="text-xs text-stone-400 mb-2">
                      {post.createdAt.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                    <h2 className="font-serif text-xl font-bold text-stone-900 mb-3">{post.title}</h2>
                    <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">{post.content}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </BreederPageContent>
      </main>
      <Footer />
    </>
  )
}
