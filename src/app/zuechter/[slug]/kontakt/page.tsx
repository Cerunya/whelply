import { notFound } from 'next/navigation'
import { getBreederBySlug, getBreederTabs } from '@/lib/breeder'
import BreederNavbar from '@/components/BreederNavbar'
import BreederPageHeader from '@/components/BreederPageHeader'
import BreederPageContent from '@/components/BreederPageContent'
import BreederContactSidebar from '@/components/BreederContactSidebar'
import BreederFooter from '@/components/BreederFooter'
import KontaktForm from '@/components/KontaktForm'
import { auth } from '@/lib/auth'
import { slugify } from '@/lib/slugify'

export const dynamic = 'force-dynamic'

export default async function KontaktPage({ params }: { params: { slug: string } }) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()
  if (breeder.isPublished === false) notFound()

  const tabs = await getBreederTabs(breeder.id)
  const session = await auth()
  const isLoggedIn = !!session?.user?.id
  const isOwnProfile = session?.user?.id === breeder.userId

  const headerImage = breeder.media.find((m) => m.purpose === 'header')?.url ?? null
  const bgImage = breeder.media.find((m) => m.purpose === 'background')?.url ?? null

  return (
    <>
      <BreederNavbar
        kennelName={breeder.kennelName}
        slug={params.slug}
        themeNavColor={breeder.themeNavColor}
        themeFont={breeder.themeFont}
      />
      <BreederPageHeader
        kennelName={breeder.kennelName}
        displayName={breeder.displayName}
        slug={params.slug}
        headerImageUrl={headerImage}
        backgroundImageUrl={bgImage}
        tabs={tabs}
        activeTab="kontakt"
        themeColor={breeder.themeBgColor}
        themeAccentColor={breeder.themeAccentColor}
        themeAlign={breeder.themeAlign}
      />
      <main>
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
            breederId={breeder.id}
            isLoggedIn={isLoggedIn}
            isOwnProfile={isOwnProfile}
          />
        }>
          <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6">
            <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">
              Kontakt aufnehmen
            </h2>
            <p className="text-stone-400 text-sm mb-6">
              Schreib {breeder.displayName || breeder.kennelName} direkt eine Nachricht.
            </p>
            <KontaktForm
              breederId={breeder.id}
              kennelName={breeder.kennelName}
              isLoggedIn={isLoggedIn}
            />
          </div>

          {/* Adresse & Karte */}
          {breeder.showAddress && (breeder.street || breeder.city) && (
            <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6">
              <h3 className="font-semibold text-stone-800 mb-3">Adresse</h3>
              <div className="text-stone-600 text-sm space-y-1">
                {breeder.showFullName && breeder.fullName && <p className="font-medium">{breeder.fullName}</p>}
                <p className="font-medium">{breeder.displayName || breeder.kennelName}</p>
                {breeder.street && <p>{breeder.street}</p>}
                {(breeder.zip || breeder.city) && (
                  <p>{[breeder.zip, breeder.city].filter(Boolean).join(' ')}</p>
                )}
                {breeder.state && <p>{breeder.state}</p>}
              </div>
            </div>
          )}
        </BreederPageContent>
      </main>
      <BreederFooter kennelName={breeder.kennelName} slug={params.slug} themeNavColor={breeder.themeNavColor} />
    </>
  )
}
