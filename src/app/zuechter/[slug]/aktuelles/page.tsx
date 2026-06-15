import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AktuellesPage({
  params,
}: {
  params: { slug: string }
}) {
  const breeders = await prisma.breederProfile.findMany({
    select: { id: true, kennelName: true, displayName: true, themeColor: true },
  })
  const match = breeders.find((b) => slugify(b.kennelName) === params.slug)
  if (!match) notFound()

  const posts = await prisma.newsPost.findMany({
    where: { breederId: match.id },
    orderBy: { createdAt: 'desc' },
    include: { media: { take: 1, select: { url: true } } },
  })

  const displayName = match.displayName || match.kennelName

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <section
          className="bg-forest px-4 py-10"
          style={match.themeColor ? { backgroundColor: match.themeColor } : undefined}
        >
          <div className="max-w-3xl mx-auto">
            <p className="text-xs text-white/60 mb-2">
              <Link href={`/zuechter/${params.slug}`} className="hover:underline">{displayName}</Link>
              {' / Aktuelles'}
            </p>
            <h1 className="font-serif text-3xl font-bold text-white">Aktuelles</h1>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 py-12">
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

          <div className="text-center mt-10">
            <Link href={`/zuechter/${params.slug}`} className="text-sm text-forest font-semibold hover:underline">
              ← Zurück zur Züchterseite
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
