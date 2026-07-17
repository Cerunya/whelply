import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await prisma.article.findUnique({ where: { slug: params.slug } })
  if (!article) return {}
  return {
    title: article.metaTitle || `${article.title} | Whelply Ratgeber`,
    description: article.metaDescription || article.excerpt || undefined,
    openGraph: {
      title: article.metaTitle || article.title,
      description: article.metaDescription || article.excerpt || undefined,
      images: article.coverImageUrl ? [article.coverImageUrl] : undefined,
    },
  }
}

import { renderMarkdown, extractAsins } from '@/lib/render-markdown'

export default async function RatgeberDetailPage({ params }: { params: { slug: string } }) {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug },
    include: { breed: { select: { nameDe: true, slug: true } } },
  })
  if (!article || !article.isPublished) notFound()

  // Produkte für :::produkt[ASIN] Shortcodes laden
  const asins = extractAsins(article.content)
  const productsMap = new Map()
  if (asins.length > 0) {
    const products = await prisma.product.findMany({ where: { asin: { in: asins } } })
    products.forEach((p) => productsMap.set(p.asin, p))
  }

  // ── Sidebar-Daten ──

  // Neuester Artikel (nicht der aktuelle)
  const latestArticle = await prisma.article.findFirst({
    where: { isPublished: true, slug: { not: article.slug } },
    orderBy: { publishedAt: 'desc' },
    select: { slug: true, title: true, coverImageUrl: true, publishedAt: true, category: true },
  })

  // Verwandte Artikel (gleiche Kategorie oder Rasse, max 3)
  const relatedArticles = await prisma.article.findMany({
    where: {
      isPublished: true,
      slug: { not: article.slug },
      ...(latestArticle ? { slug: { notIn: [article.slug, latestArticle.slug] } } : {}),
      OR: [
        ...(article.breedId ? [{ breedId: article.breedId }] : []),
        { category: article.category },
      ],
    },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    select: { slug: true, title: true, coverImageUrl: true, publishedAt: true },
  })

  // Zufälliges Affiliate-Produkt
  const productCount = await prisma.product.count({ where: { isAvailable: true } })
  const randomProduct = productCount > 0
    ? await prisma.product.findFirst({
        where: { isAvailable: true },
        skip: Math.floor(Math.random() * productCount),
      })
    : null

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-6xl mx-auto px-4 py-12">

          {article.coverImageUrl && (
            <div className="rounded-2xl overflow-hidden mb-8 aspect-[2/1]">
              <img src={article.coverImageUrl} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
            {/* ── Artikel-Inhalt ── */}
            <article className="bg-white rounded-2xl border border-cream-deep p-8 md:p-12">
              <p className="text-xs font-bold text-forest uppercase tracking-wide mb-3">
                {article.category === 'rassen' ? 'Rassen-Portrait' : article.category === 'news' ? 'News' : 'Ratgeber'}
                {article.breed && ` · ${article.breed.nameDe}`}
              </p>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 mb-4">{article.title}</h1>
              {article.excerpt && <p className="text-lg text-stone-500 mb-6 leading-relaxed">{article.excerpt}</p>}
              <div className="flex items-center gap-3 text-sm text-stone-400 mb-8 pb-8 border-b border-cream-deep">
                {article.authorName && <span>Von {article.authorName}</span>}
                {article.publishedAt && <span>· {new Date(article.publishedAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
              </div>

              <div className="flex flex-col gap-6 [&>hr]:my-4 [&>img]:rounded-xl [&>img]:w-full"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content, productsMap) }} />

              {article.breed && (
                <div className="mt-10 pt-8 border-t border-cream-deep">
                  <p className="text-sm text-stone-500 mb-3">Züchter für {article.breed.nameDe} finden:</p>
                  <Link href={`/zuechter?breed=${article.breed.slug}`}
                    className="inline-flex items-center gap-2 bg-forest text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-forest-light transition-colors">
                    {article.breed.nameDe}-Züchter auf Whelply →
                  </Link>
                </div>
              )}
            </article>

            {/* ── Sidebar ── */}
            <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
              {/* Neuester Artikel */}
              {latestArticle && (
                <div>
                  <h3 className="font-serif text-sm font-bold text-stone-900 uppercase tracking-wide mb-3">Neuester Artikel</h3>
                  <Link href={`/ratgeber/${latestArticle.slug}`} className="block group">
                    <div className="bg-white rounded-2xl border border-cream-deep overflow-hidden hover:shadow-md hover:border-forest/30 transition-all">
                      {latestArticle.coverImageUrl && (
                        <div className="aspect-[16/9] overflow-hidden">
                          <img src={latestArticle.coverImageUrl} alt={latestArticle.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        </div>
                      )}
                      <div className="p-4">
                        <p className="font-serif font-bold text-stone-900 text-sm leading-snug mb-1 group-hover:text-forest transition-colors">
                          {latestArticle.title}
                        </p>
                        {latestArticle.publishedAt && (
                          <p className="text-xs text-stone-400">
                            {new Date(latestArticle.publishedAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Zufälliges Affiliate-Produkt */}
              {randomProduct && (
                <div>
                  <h3 className="font-serif text-sm font-bold text-stone-900 uppercase tracking-wide mb-3">Empfehlung</h3>
                  <a href={`https://www.amazon.de/dp/${randomProduct.asin}?tag=${randomProduct.affiliateTag}`}
                    target="_blank" rel="noopener nofollow sponsored"
                    className="block rounded-2xl border border-cream-deep overflow-hidden hover:shadow-md hover:border-forest/30 transition-all group">
                    {randomProduct.imageUrl && (
                      <div className="aspect-square overflow-hidden bg-white p-4">
                        <img src={randomProduct.imageUrl} alt={randomProduct.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                      </div>
                    )}
                    <div className="p-4 bg-green-50">
                      <p className="font-semibold text-stone-900 text-sm leading-snug mb-2 group-hover:text-forest transition-colors">
                        {randomProduct.name}
                      </p>
                      {randomProduct.description && (
                        <p className="text-xs text-stone-500 line-clamp-2 mb-3">{randomProduct.description}</p>
                      )}
                      <span className="inline-block bg-honey text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                        Bei Amazon ansehen →
                      </span>
                    </div>
                  </a>
                </div>
              )}

              {/* Verwandte Artikel */}
              {relatedArticles.length > 0 && (
                <div>
                  <h3 className="font-serif text-sm font-bold text-stone-900 uppercase tracking-wide mb-3">Das könnte dich auch interessieren</h3>
                  <div className="space-y-3">
                    {relatedArticles.map((r) => (
                      <Link key={r.slug} href={`/ratgeber/${r.slug}`}
                        className="flex gap-3 items-center bg-white rounded-xl border border-cream-deep p-3 hover:shadow-sm hover:border-forest/30 transition-all group">
                        {r.coverImageUrl ? (
                          <img src={r.coverImageUrl} alt={r.title}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0 group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-cream flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-stone-900 leading-snug line-clamp-2 group-hover:text-forest transition-colors">
                            {r.title}
                          </p>
                          {r.publishedAt && (
                            <p className="text-xs text-stone-400 mt-0.5">
                              {new Date(r.publishedAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })}
                            </p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
