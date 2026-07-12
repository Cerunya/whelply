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

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <article className="max-w-3xl mx-auto px-4 py-12">
          <p className="text-sm text-stone-400 mb-6">
            <Link href="/" className="hover:text-stone-700">Startseite</Link>
            {' › '}
            <Link href="/ratgeber" className="hover:text-stone-700">Ratgeber</Link>
            {' › '}
            <span className="text-stone-600">{article.title}</span>
          </p>

          {article.coverImageUrl && (
            <div className="rounded-2xl overflow-hidden mb-8 aspect-[2/1]">
              <img src={article.coverImageUrl} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="bg-white rounded-2xl border border-cream-deep p-8 md:p-12">
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

            <div dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content, productsMap) }} />

            {article.breed && (
              <div className="mt-10 pt-8 border-t border-cream-deep">
                <p className="text-sm text-stone-500 mb-3">Züchter für {article.breed.nameDe} finden:</p>
                <Link href={`/zuechter?breed=${article.breed.slug}`}
                  className="inline-flex items-center gap-2 bg-forest text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-forest-light transition-colors">
                  {article.breed.nameDe}-Züchter auf Whelply →
                </Link>
              </div>
            )}
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
