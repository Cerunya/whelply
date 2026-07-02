import { notFound } from 'next/navigation'
import Link from 'next/link'
import BreederNavbar from '@/components/BreederNavbar'
import BreederFooter from '@/components/BreederFooter'
import BreederPageHeader from '@/components/BreederPageHeader'
import BreederPageContent from '@/components/BreederPageContent'
import { getBreederBySlug, getBreederTabs } from '@/lib/breeder'
import BreederContactSidebar from '@/components/BreederContactSidebar'
import { renderRichText } from '@/lib/richtext'
import ReviewSection from '@/components/ReviewSection'
import BookmarkButton from '@/components/BookmarkButton'
import { auth } from '@/lib/auth'

// Immer dynamisch rendern, damit Aenderungen (Theme, Status, neue Inserate etc.)
// sofort sichtbar sind, ohne dass der Full Route Cache veraltete Daten zeigt.
export const dynamic = 'force-dynamic'

export default async function ZuechterProfilPage({
  params,
}: {
  params: { slug: string }
}) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()
  if (breeder.isPublished === false) notFound()

  const session = await auth()
  const isLoggedIn = !!session?.user?.id
  const isBookmarked = session?.user?.id
    ? !!(await import('@/lib/prisma').then(m => m.prisma.bookmark.findFirst({ where: { userId: session.user.id, breederId: breeder.id } })))
    : false

  const tabs = await getBreederTabs(breeder.id)

  return (
    <>
      <BreederNavbar />
      <main className="min-h-screen relative">
        <BreederPageHeader breeder={breeder} slug={params.slug} tabs={tabs} active="profil" />

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
          {/* Bio */}
          {breeder.bio && (
            <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6">
              <h2 className="font-serif text-xl font-bold text-stone-900 mb-3">Über uns</h2>
              <div className="text-stone-600 text-sm leading-relaxed">
                {renderRichText(breeder.bio)}
              </div>
              {breeder.website && (
                <a
                  href={breeder.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 text-sm text-forest font-semibold hover:underline"
                >
                  Webseite besuchen →
                </a>
              )}
            </div>
          )}

          {!breeder.bio && (
            <div className="text-center py-12 bg-white rounded-2xl border border-cream-deep mb-6">
              <p className="text-stone-400 text-sm">
                {breeder.displayName || breeder.kennelName} hat noch keine Beschreibung hinterlegt.
              </p>
            </div>
          )}

          {/* Übergabe-Infos */}
          {(breeder.handoverLocation || breeder.visitPossible || breeder.damVisitPossible) && (
            <div className="bg-white rounded-2xl border border-cream-deep p-6 mb-6">
              <h2 className="font-serif text-xl font-bold text-stone-900 mb-3">Übergabe & Besuch</h2>
              <div className="space-y-2">
                {breeder.handoverLocation && (
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <svg className="w-4 h-4 text-forest flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span>Übergabe: {breeder.handoverLocation}</span>
                  </div>
                )}
                {breeder.visitPossible && (
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Besuch des Wurfes möglich</span>
                  </div>
                )}
                {breeder.damVisitPossible && (
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Besuch des Muttertiers möglich</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bewertungen */}
          <div className="mb-6">
            <ReviewSection breederId={breeder.id} isLoggedIn={isLoggedIn} />
          </div>

          {/* Merken-Button */}
          <div className="flex justify-end mb-2">
            <BookmarkButton breederId={breeder.id} initialBookmarked={isBookmarked} isLoggedIn={isLoggedIn} />
          </div>

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
