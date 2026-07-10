import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Ratgeber für Hundezüchter & Welpenbesitzer | Whelply',
  description: 'Tipps und Ratgeber rund um Hundezucht, Welpenkauf und Hundehaltung. Rassen-Portraits, Gesundheit, Ernährung und mehr.',
}

const CATEGORY_LABEL: Record<string, string> = { ratgeber: 'Ratgeber', rassen: 'Rassen-Portrait', news: 'News' }

export default async function RatgeberPage() {
  const articles = await prisma.article.findMany({
    where: { isPublished: true },
    include: { breed: { select: { nameDe: true, slug: true } } },
    orderBy: { publishedAt: 'desc' },
  })

  const ratgeber = articles.filter((a) => a.category === 'ratgeber')
  const rassen = articles.filter((a) => a.category === 'rassen')
  const news = articles.filter((a) => a.category === 'news')

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-forest uppercase tracking-widest mb-2">Wissen & Tipps</p>
            <h1 className="font-serif text-4xl font-bold text-stone-900">Ratgeber</h1>
            <p className="text-stone-500 mt-3 max-w-xl mx-auto">Alles rund um Hundezucht, Welpenkauf und das Leben mit Hund — von Experten für Hundeliebhaber.</p>
          </div>

          {rassen.length > 0 && (
            <section className="mb-14">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">Rassen-Portraits</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {rassen.map((a) => <ArticleCard key={a.id} article={a} href={`/rassen/${a.slug}`} />)}
              </div>
            </section>
          )}

          {ratgeber.length > 0 && (
            <section className="mb-14">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">Ratgeber & Tipps</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {ratgeber.map((a) => <ArticleCard key={a.id} article={a} href={`/ratgeber/${a.slug}`} />)}
              </div>
            </section>
          )}

          {news.length > 0 && (
            <section className="mb-14">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">Neuigkeiten</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {news.map((a) => <ArticleCard key={a.id} article={a} href={`/ratgeber/${a.slug}`} />)}
              </div>
            </section>
          )}

          {articles.length === 0 && (
            <div className="text-center py-20">
              <p className="text-stone-400">Noch keine Artikel veröffentlicht. Schau bald wieder vorbei!</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

function ArticleCard({ article, href }: { article: any; href: string }) {
  return (
    <Link href={href} className="bg-white rounded-2xl border border-cream-deep overflow-hidden hover:shadow-md hover:border-forest/20 transition-all group">
      {article.coverImageUrl && (
        <div className="aspect-[16/9] overflow-hidden bg-cream-dark">
          <img src={article.coverImageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      )}
      <div className="p-5">
        <p className="text-[10px] font-bold text-forest uppercase tracking-wide mb-1">
          {CATEGORY_LABEL[article.category] ?? article.category}
          {article.breed && ` · ${article.breed.nameDe}`}
        </p>
        <h3 className="font-serif text-lg font-bold text-stone-900 mb-2 group-hover:text-forest transition-colors">{article.title}</h3>
        {article.excerpt && <p className="text-sm text-stone-500 line-clamp-2">{article.excerpt}</p>}
        {article.publishedAt && <p className="text-xs text-stone-400 mt-3">{new Date(article.publishedAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
      </div>
    </Link>
  )
}
