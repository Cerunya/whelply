import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BreederNavbar from '@/components/BreederNavbar'
import BreederFooter from '@/components/BreederFooter'
import BreederPageHeader from '@/components/BreederPageHeader'
import BreederPageContent from '@/components/BreederPageContent'
import { getBreederBySlug, getBreederTabs } from '@/lib/breeder'
import BreederContactSidebar from '@/components/BreederContactSidebar'

export const dynamic = 'force-dynamic'

export default async function AktuellesPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { jahr?: string }
}) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()
  if (breeder.isPublished === false) notFound()

  const tabs = await getBreederTabs(breeder.id)

  const allPosts = await prisma.newsPost.findMany({
    where: { breederId: breeder.id },
    orderBy: { createdAt: 'desc' },
    include: { media: { take: 1, select: { url: true } } },
  })

  // Alle Jahre aus den Posts ermitteln
  const years = Array.from(new Set(allPosts.map((p) => p.createdAt.getFullYear()))).sort((a, b) => b - a)
  const selectedYear = searchParams.jahr ? parseInt(searchParams.jahr) : years[0] ?? null
  const posts = selectedYear
    ? allPosts.filter((p) => p.createdAt.getFullYear() === selectedYear)
    : allPosts

  return (
    <>
      <BreederNavbar />
      <main className="min-h-screen relative">
        <BreederPageHeader breeder={breeder} slug={params.slug} tabs={tabs} active="aktuelles" />

        <BreederPageContent bgColor={breeder.themeBgColor} sidebar={
          <BreederContactSidebar
            kennelName={breeder.kennelName}
            displayName={breeder.displayName}
            slug={params.slug}
            city={breeder.city}
            state={breeder.state}
            street={breeder.street}
            zip={breeder.zip}
            showAddress={breeder.showAddress}
            phone={breeder.phone}
            showPhone={breeder.showPhone}
            website={breeder.website}
            socialInstagram={breeder.socialInstagram}
            socialFacebook={breeder.socialFacebook}
            socialTiktok={breeder.socialTiktok}
            socialYoutube={breeder.socialYoutube}
            themeColor={breeder.themeColor}
            themeAccentColor={breeder.themeAccentColor}
            verband={breeder.verband}
            verificationLevel={breeder.verificationLevel}
            fullName={breeder.fullName}
            showFullName={breeder.showFullName}
          />
        }>
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <h2 className="font-serif text-2xl font-bold text-stone-900">Aktuelles</h2>
            {years.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {years.map((year) => (
                  <Link
                    key={year}
                    href={`/zuechter/${params.slug}/aktuelles?jahr=${year}`}
                    className={`px-4 py-1.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                      selectedYear === year
                        ? 'border-forest bg-forest text-white'
                        : 'border-cream-deep text-stone-500 hover:border-stone-300'
                    }`}
                  >
                    {year}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-cream-deep">
              <p className="text-stone-400">Keine Beiträge für {selectedYear}.</p>
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
      <BreederFooter
        kennelName={breeder.kennelName}
        slug={params.slug}
        themeColor={breeder.themeColor}
        themeAccentColor={breeder.themeAccentColor}
        socialInstagram={breeder.socialInstagram}
        socialFacebook={breeder.socialFacebook}
        socialTiktok={breeder.socialTiktok}
        socialYoutube={breeder.socialYoutube}
        website={breeder.website}
      />
    </>
  )
}
