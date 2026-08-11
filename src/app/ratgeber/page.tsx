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

const CATEGORIES = [
  { key: '', label: 'Alle' },
  { key: 'ratgeber', label: 'Ratgeber & Tipps' },
  { key: 'rassen', label: 'Rassen-Portraits' },
  { key: 'news', label: 'Neuigkeiten' },
]

const CATEGORY_LABEL: Record<string, string> = { ratgeber: 'Ratgeber', rassen: 'Rassen-Portrait', news: 'News' }

export default async function RatgeberPage({
  searchParams,
}: {
  searchParams: { kategorie?: string }
}) {
  const activeCategory = searchParams.kategorie || ''

  const articles = await prisma.article.findMany({
    where: {
      isPublished: true,
      ...(activeCategory ? { category: activeCategory } : {}),
    },
    include: { breed: { select: { nameDe: true, slug: true } } },
    orderBy: { publishedAt: 'desc' },
  })

  // Zähler pro Kategorie (für Badges)
  const counts = await prisma.article.groupBy({
    by: ['category'],
    where: { isPublished: true },
    _count: true,
  })
  const countMap: Record<string, number> = {}
  counts.forEach((c) => { countMap[c.category] = c._count })
  const totalCount = Object.values(countMap).reduce((a, b) => a + b, 0)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold text-forest uppercase tracking-widest mb-2">Wissen & Tipps</p>
            <h1 className="font-serif text-4xl font-bold text-stone-900">Ratgeber</h1>
            <p className="text-stone-500 mt-3 max-w-xl mx-auto">Alles rund um Hundezucht, Welpenkauf und das Leben mit Hund — von Experten für Hundeliebhaber.</p>
          </div>

          {/* Kategorie-Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {CATEGORIES.map((cat) => {
              const isActive = cat.key === activeCategory
              const count = cat.key ? (countMap[cat.key] || 0) : totalCount
              return (
                <Link
                  key={cat.key}
                  href={cat.key ? `/ratgeber?kategorie=${cat.key}` : '/ratgeber'}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-forest text-white'
                      : 'bg-white border border-cream-deep text-stone-600 hover:border-forest/30'
                  }`}
                >
                  {cat.label}
                  <span className={`ml-1.5 text-xs ${isActive ? 'text-white/70' : 'text-stone-400'}`}>
                    {count}
                  </span>
                </Link>
              )
            })}
          </div>

          {/* Artikel-Grid */}
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {articles.map((a) => (
                <ArticleCard key={a.id} article={a} href={a.category === 'rassen' ? `/rassen/${a.slug}` : `/ratgeber/${a.slug}`} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-stone-400">Keine Artikel in dieser Kategorie.</p>
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
