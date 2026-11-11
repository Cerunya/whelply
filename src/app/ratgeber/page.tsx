import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import RatgeberSuche from '@/components/RatgeberSuche'
import { Metadata } from 'next'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Ratgeber für Hundezüchter & Welpenbesitzer | Whelply',
  description: 'Tipps und Ratgeber rund um Hundezucht, Welpenkauf und Hundehaltung. Rassen-Portraits, Gesundheit, Ernährung und mehr.',
}

function articleHref(article: any) {
  return article.category === 'rassen' ? `/rassen/${article.slug}` : `/ratgeber/${article.slug}`
}

function categoryLabel(article: any, labels: Record<string, string>) {
  return `${labels[article.category] ?? article.category}${article.breed ? ` · ${article.breed.nameDe}` : ''}`
}

function ArticleMeta({ article }: { article: any }) {
  const readingMinutes = Math.max(1, Math.ceil(article.content.trim().split(/\s+/).length / 200))
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px] leading-relaxed text-stone-400">
      {article.publishedAt && <span>{new Date(article.publishedAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
      {article.publishedAt && <span>·</span>}
      <span className="flex items-center gap-1">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><circle cx="12" cy="12" r="9"/><path strokeLinecap="round" d="M12 7v5l3 2"/></svg>
        {readingMinutes} Min. Lesezeit
      </span>
    </div>
  )
}

function ArticleCard({ article, labels }: { article: any; labels: Record<string, string> }) {
  return (
    <Link href={articleHref(article)} className="group flex flex-col overflow-hidden rounded-[22px] border border-cream-deep bg-white shadow-[5px_5px_0_#EDE4CE] transition-all duration-200 hover:-translate-y-1 hover:shadow-[7px_7px_0_#EDE4CE]">
      <div className="relative aspect-[16/10] overflow-hidden bg-cream-dark">
        {article.coverImageUrl && <img src={article.coverImageUrl} alt={article.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />}
        <span className="absolute bottom-3.5 left-3.5 rounded-lg bg-cream/95 px-2.5 py-1.5 text-[10px] font-bold text-forest">{categoryLabel(article, labels)}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-serif text-xl font-bold leading-snug text-stone-900 transition-colors group-hover:text-forest">{article.title}</h3>
        {article.excerpt && <p className="mb-4 mt-2.5 line-clamp-2 text-sm leading-relaxed text-stone-500">{article.excerpt}</p>}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-cream-deep pt-3.5"><ArticleMeta article={article}/><span className="text-honey">→</span></div>
      </div>
    </Link>
  )
}

function HighlightCard({ article, labels }: { article: any; labels: Record<string, string> }) {
  return (
    <Link href={articleHref(article)} className="group relative flex min-w-0 overflow-hidden rounded-[19px] border border-cream-deep bg-white shadow-[4px_4px_0_#EDE4CE] transition-all duration-200 hover:-translate-y-0.5 hover:border-forest sm:grid sm:grid-cols-[105px_1fr] sm:items-center lg:flex lg:flex-col lg:items-stretch">
      {article.coverImageUrl && <img src={article.coverImageUrl} alt="" className="h-full min-h-[120px] w-[105px] flex-shrink-0 object-cover sm:w-[105px] lg:h-28 lg:min-h-0 lg:w-full" />}
      <div className="min-w-0 flex-1 p-3.5">
        <p className="text-[9px] font-bold uppercase tracking-wider text-honey">{categoryLabel(article, labels)}</p>
        <h3 className="mb-2 mr-4 mt-1.5 line-clamp-2 font-serif text-base font-bold leading-snug text-stone-900 transition-colors group-hover:text-forest">{article.title}</h3>
        <ArticleMeta article={article}/>
      </div>
      <span className="absolute bottom-3.5 right-3.5 hidden text-honey lg:block">→</span>
    </Link>
  )
}

export default async function RatgeberPage({ searchParams }: { searchParams: { kategorie?: string; suche?: string } }) {
  const activeCategory = searchParams.kategorie || ''
  const query = searchParams.suche?.trim() || ''
  const hasFilters = Boolean(activeCategory || query)

  let categories: { slug: string; name: string }[] = []
  try {
    categories = await prisma.articleCategory.findMany({ select: { slug: true, name: true }, orderBy: { sortOrder: 'asc' } })
  } catch {
    categories = [{ slug: 'ratgeber', name: 'Ratgeber & Tipps' }, { slug: 'rassen', name: 'Rassen-Portraits' }, { slug: 'news', name: 'Neuigkeiten' }]
  }
  const labels: Record<string, string> = {}
  categories.forEach((category) => { labels[category.slug] = category.name })

  const articles = await prisma.article.findMany({
    where: {
      isPublished: true,
      ...(activeCategory ? { category: activeCategory } : {}),
      ...(query ? { OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        { excerpt: { contains: query, mode: 'insensitive' as const } },
        { content: { contains: query, mode: 'insensitive' as const } },
        { breed: { nameDe: { contains: query, mode: 'insensitive' as const } } },
      ] } : {}),
    },
    include: { breed: { select: { nameDe: true, slug: true } } },
    orderBy: { publishedAt: 'desc' },
  })

  let highlights: any[] = []
  let remainingArticles = articles
  if (!hasFilters) {
    const setting = await prisma.platformSetting.findUnique({ where: { key: 'ratgeber_pinned_articles' } })
    let pinnedIds: string[] = []
    try {
      const parsed = setting ? JSON.parse(setting.value) : []
      if (Array.isArray(parsed)) pinnedIds = parsed.filter((id): id is string => typeof id === 'string').slice(0, 5)
    } catch {}
    const byId = new Map(articles.map((article) => [article.id, article]))
    highlights = pinnedIds.map((id) => byId.get(id)).filter(Boolean) as any[]
    const used = new Set(highlights.map((article) => article.id))
    for (const article of articles) {
      if (highlights.length >= 5) break
      if (!used.has(article.id)) { highlights.push(article); used.add(article.id) }
    }
    remainingArticles = articles.filter((article) => !used.has(article.id))
  }

  const featured = highlights[0]
  const secondaryHighlights = highlights.slice(1, 5)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <section className="relative overflow-hidden bg-forest px-4 pb-28 pt-12">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <svg className="absolute inset-0 h-full w-full text-white opacity-[0.035]" aria-hidden="true"><defs><pattern id="ratgeber-paw-pattern" width="190" height="190" patternUnits="userSpaceOnUse"><g fill="currentColor" transform="translate(22 24) rotate(-18 30 30)"><ellipse cx="30" cy="40" rx="13" ry="15"/><ellipse cx="10" cy="25" rx="6" ry="8"/><ellipse cx="23" cy="14" rx="6" ry="8"/><ellipse cx="37" cy="14" rx="6" ry="8"/><ellipse cx="50" cy="25" rx="6" ry="8"/></g><g fill="currentColor" transform="translate(112 108) rotate(16 30 30)"><ellipse cx="30" cy="40" rx="13" ry="15"/><ellipse cx="10" cy="25" rx="6" ry="8"/><ellipse cx="23" cy="14" rx="6" ry="8"/><ellipse cx="37" cy="14" rx="6" ry="8"/><ellipse cx="50" cy="25" rx="6" ry="8"/></g></pattern></defs><rect width="100%" height="100%" fill="url(#ratgeber-paw-pattern)"/></svg>
          </div>
          <div className="pointer-events-none absolute -right-16 -top-28 h-[330px] w-[330px] rounded-full bg-honey-light/[0.08]" aria-hidden="true" />
          <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-4 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-honey-light">Wissen, das weiterhilft</p><h1 className="max-w-3xl font-serif text-3xl font-bold text-white sm:text-4xl">Gut informiert. Für ein gutes Hundeleben.</h1><p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">Verlässliches Wissen rund um Welpen, Gesundheit und Zucht – verständlich erklärt und liebevoll zusammengestellt.</p></div>
            <div className="max-w-xs rounded-2xl border border-white/15 bg-white/[0.07] p-5"><div className="flex items-center gap-2.5 text-honey-light"><svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.5C10 5 7.5 4.5 4 5v13c3.5-.5 6 0 8 1.5 2-1.5 4.5-2 8-1.5V5c-3.5-.5-6 0-8 1.5Zm0 0v13"/></svg><p className="text-sm font-bold text-white">Ratgeber für jeden Schritt</p></div><p className="mt-2 text-xs leading-relaxed text-white/70">Vom ersten Kennenlernen bis zum gemeinsamen Alltag.</p></div>
          </div>
        </section>

        <div className="relative z-20 mx-auto -mt-16 max-w-6xl px-4">
          <div className="rounded-2xl border border-cream-deep bg-white p-5 shadow-[7px_7px_0_rgba(18,38,25,0.08)]"><Suspense fallback={<div className="h-[46px] animate-pulse rounded-xl bg-stone-100"/>}><RatgeberSuche categories={categories}/></Suspense></div>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-20 pt-10">
          {!articles.length ? (
            <div className="rounded-2xl border border-stone-200 bg-white py-20 text-center"><svg className="mx-auto mb-4 h-10 w-10 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path strokeLinecap="round" d="m20 20-4-4"/></svg><h2 className="font-serif text-xl font-bold text-stone-700">Keine passenden Beiträge gefunden</h2><p className="mt-2 text-sm text-stone-400">Versuche einen anderen Suchbegriff oder stöbere in allen Themen.</p><Link href="/ratgeber" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-forest px-5 text-sm font-semibold text-white">Alle Beiträge anzeigen</Link></div>
          ) : hasFilters ? (
            <><div className="mb-5 flex items-center justify-between gap-4"><h2 className="font-serif text-2xl font-bold text-forest">Passende Beiträge</h2><span className="text-xs text-stone-400">{articles.length} {articles.length === 1 ? 'Artikel' : 'Artikel'}</span></div><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{articles.map((article) => <ArticleCard key={article.id} article={article} labels={labels}/>)}</div></>
          ) : (
            <>
              {featured && <section className="grid gap-5 lg:grid-cols-[1.15fr_1fr]" aria-label="Hervorgehobene Artikel">
                <Link href={articleHref(featured)} className="group grid min-w-0 overflow-hidden rounded-3xl border border-cream-deep bg-white shadow-[6px_6px_0_#EDE4CE] transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0_#EDE4CE] md:grid-cols-2 lg:grid-cols-1">
                  <div className="min-h-[205px] overflow-hidden bg-cream-dark md:min-h-[300px] lg:h-[205px] lg:min-h-0">{featured.coverImageUrl && <img src={featured.coverImageUrl} alt={featured.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]"/>}</div>
                  <div className="flex flex-col items-start p-6"><p className="text-[10px] font-bold uppercase tracking-wider text-honey">✦ {categoryLabel(featured, labels)}</p><h2 className="my-2.5 font-serif text-2xl font-bold leading-tight text-forest">{featured.title}</h2>{featured.excerpt && <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-stone-500">{featured.excerpt}</p>}<ArticleMeta article={featured}/><span className="mt-auto inline-flex min-h-10 items-center gap-2 pt-2.5 text-xs font-bold text-forest">Artikel lesen <span className="text-honey">→</span></span></div>
                </Link>
                <div className="grid gap-3.5 sm:grid-cols-2">{secondaryHighlights.map((article) => <HighlightCard key={article.id} article={article} labels={labels}/>)}</div>
              </section>}
              {remainingArticles.length > 0 && <><div className="mb-5 mt-11 flex items-center justify-between gap-4"><h2 className="font-serif text-2xl font-bold text-forest">Weitere Beiträge</h2><span className="text-xs text-stone-400">{remainingArticles.length} Artikel</span></div><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{remainingArticles.map((article) => <ArticleCard key={article.id} article={article} labels={labels}/>)}</div></>}
            </>
          )}

          <section className="mt-16 flex flex-col gap-6 rounded-3xl bg-[#EAF3EC] p-6 sm:p-8 md:flex-row md:items-center md:justify-between"><div><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-honey">Noch mehr entdecken</p><h2 className="font-serif text-2xl font-bold text-forest sm:text-3xl">Finde die Rasse, die zu dir passt.</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">Vom Wesen bis zur Pflege: Unser Rasselexikon hilft dir bei der Orientierung.</p></div><Link href="/rassen" className="inline-flex min-h-12 flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5">Zum Rasselexikon <span>→</span></Link></section>
        </div>
      </main>
      <Footer />
    </>
  )
}
