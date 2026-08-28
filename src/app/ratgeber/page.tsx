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

export default async function RatgeberPage({
  searchParams,
}: {
  searchParams: { kategorie?: string }
}) {
  const activeCategory = searchParams.kategorie || ''

  // Kategorien dynamisch aus DB laden (Fallback auf hardcoded)
  let categories: { slug: string; name: string }[] = []
  try {
    categories = await prisma.articleCategory.findMany({
      select: { slug: true, name: true },
      orderBy: { sortOrder: 'asc' },
    })
  } catch {
    categories = [
      { slug: 'ratgeber', name: 'Ratgeber & Tipps' },
      { slug: 'rassen', name: 'Rassen-Portraits' },
      { slug: 'news', name: 'Neuigkeiten' },
    ]
  }

  const categoryLabelMap: Record<string, string> = {}
  categories.forEach((c) => { categoryLabelMap[c.slug] = c.name })

  const articles = await prisma.article.findMany({
    where: {
      isPublished: true,
      ...(activeCategory ? { category: activeCategory } : {}),
    },
    include: { breed: { select: { nameDe: true, slug: true } } },
    orderBy: { publishedAt: 'desc' },
  })

  // Zähler pro Kategorie
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
            <Link
              href="/ratgeber"
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !activeCategory ? 'bg-forest text-white' : 'bg-white border border-cream-deep text-stone-600 hover:border-forest/30'
              }`}
            >
              Alle <span className={`ml-1.5 text-xs ${!activeCategory ? 'text-white/70' : 'text-stone-400'}`}>{totalCount}</span>
            </Link>
            {categories.map((cat) => {
              const isActive = cat.slug === activeCategory
              const count = countMap[cat.slug] || 0
              return (
                <Link
                  key={cat.slug}
                  href={`/ratgeber?kategorie=${cat.slug}`}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isActive ? 'bg-forest text-white' : 'bg-white border border-cream-deep text-stone-600 hover:border-forest/30'
                  }`}
                >
                  {cat.name} <span className={`ml-1.5 text-xs ${isActive ? 'text-white/70' : 'text-stone-400'}`}>{count}</span>
                </Link>
              )
            })}
          </div>

          {/* Artikel-Grid */}
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {articles.map((a) => (
                <Link key={a.id} href={a.category === 'rassen' ? `/rassen/${a.slug}` : `/ratgeber/${a.slug}`}
                  className="bg-white rounded-2xl border border-cream-deep overflow-hidden hover:shadow-md hover:border-forest/20 transition-all group">
                  {a.coverImageUrl && (
                    <div className="aspect-[16/9] overflow-hidden bg-cream-dark">
                      <img src={a.coverImageUrl} alt={a.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="p-5">
                    <p className="text-[10px] font-bold text-forest uppercase tracking-wide mb-1">
                      {categoryLabelMap[a.category] ?? a.category}
                      {a.breed && ` · ${a.breed.nameDe}`}
                    </p>
                    <h3 className="font-serif text-lg font-bold text-stone-900 mb-2 group-hover:text-forest transition-colors">{a.title}</h3>
                    {a.excerpt && <p className="text-sm text-stone-500 line-clamp-2">{a.excerpt}</p>}
                    {a.publishedAt && <p className="text-xs text-stone-400 mt-3">{new Date(a.publishedAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                  </div>
                </Link>
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
