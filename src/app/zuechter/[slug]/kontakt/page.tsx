import { notFound } from 'next/navigation'
import { getBreederBySlug, getBreederTabs } from '@/lib/breeder'
import BreederNavbar from '@/components/BreederNavbar'
import BreederPageHeader from '@/components/BreederPageHeader'
import BreederPageContent from '@/components/BreederPageContent'
import BreederContactSidebar from '@/components/BreederContactSidebar'
import BreederFooter from '@/components/BreederFooter'
import KontaktForm from '@/components/KontaktForm'
import { auth } from '@/lib/auth'
import { generateBreederMetadata } from '@/lib/breeder-metadata'

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return generateBreederMetadata(params.slug, '/kontakt', 'Kontakt')
}

export const dynamic = 'force-dynamic'

// Social-Werte robust in URLs wandeln: Züchter hinterlegen mal nur den
// Nutzernamen, mal die komplette URL — beides soll funktionieren.
function socialHref(network: 'instagram' | 'facebook' | 'tiktok' | 'youtube', raw: string): string {
  const v = raw.trim()
  if (/^https?:\/\//i.test(v)) return v
  const handle = v.replace(/^@/, '')
  const bases = {
    instagram: 'https://instagram.com/',
    facebook: 'https://facebook.com/',
    tiktok: 'https://tiktok.com/@',
    youtube: 'https://youtube.com/@',
  }
  return `${bases[network]}${handle}`
}

export default async function KontaktPage({ params }: { params: { slug: string } }) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()
  if (breeder.isPublished === false) notFound()

  const tabs = await getBreederTabs(breeder.id)
  const session = await auth()
  const isLoggedIn = !!session?.user?.id
  const isOwnProfile = session?.user?.id === breeder.userId

  const hasContactData = Boolean(
    (breeder.showAddress && (breeder.street || breeder.city)) ||
    (breeder.showPhone && breeder.phone) ||
    breeder.website ||
    breeder.socialInstagram || breeder.socialFacebook || breeder.socialTiktok || breeder.socialYoutube
  )

  return (
    <>
      <BreederNavbar />
      <BreederPageHeader breeder={breeder} slug={params.slug} tabs={tabs} active="kontakt" />
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

          {/* Kontaktdaten: Adresse, Telefon, Website, Socials — zentral hier statt in der Sidebar */}
          {hasContactData && (
            <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6">
              <h3 className="font-semibold text-stone-800 mb-4">Kontaktdaten</h3>
              <div className="space-y-4 text-sm">
                {breeder.showAddress && (breeder.street || breeder.city) && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">Adresse</p>
                    <div className="text-stone-600 space-y-0.5">
                      {breeder.showFullName && breeder.fullName && <p className="font-medium">{breeder.fullName}</p>}
                      <p className="font-medium">{breeder.displayName || breeder.kennelName}</p>
                      {breeder.street && <p>{breeder.street}</p>}
                      {(breeder.zip || breeder.city) && (
                        <p>{[breeder.zip, breeder.city].filter(Boolean).join(' ')}</p>
                      )}
                      {breeder.state && breeder.state !== breeder.city && <p>{breeder.state}</p>}
                    </div>
                  </div>
                )}
                {breeder.showPhone && breeder.phone && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">Telefon</p>
                    <a href={`tel:${breeder.phone}`} className="text-stone-600 hover:text-forest transition-colors">{breeder.phone}</a>
                  </div>
                )}
                {breeder.website && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">Website</p>
                    <a href={breeder.website.startsWith('http') ? breeder.website : `https://${breeder.website}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-forest hover:underline break-all">
                      {breeder.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {(breeder.socialInstagram || breeder.socialFacebook || breeder.socialTiktok || breeder.socialYoutube) && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Social Media</p>
                    <div className="flex items-center gap-2.5">
                      {breeder.socialInstagram && (
                        <a href={socialHref('instagram', breeder.socialInstagram)} target="_blank" rel="noopener noreferrer" title="Instagram"
                          className="w-9 h-9 rounded-full border border-cream-deep bg-cream flex items-center justify-center text-stone-500 hover:text-forest hover:border-forest/40 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        </a>
                      )}
                      {breeder.socialFacebook && (
                        <a href={socialHref('facebook', breeder.socialFacebook)} target="_blank" rel="noopener noreferrer" title="Facebook"
                          className="w-9 h-9 rounded-full border border-cream-deep bg-cream flex items-center justify-center text-stone-500 hover:text-forest hover:border-forest/40 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </a>
                      )}
                      {breeder.socialTiktok && (
                        <a href={socialHref('tiktok', breeder.socialTiktok)} target="_blank" rel="noopener noreferrer" title="TikTok"
                          className="w-9 h-9 rounded-full border border-cream-deep bg-cream flex items-center justify-center text-stone-500 hover:text-forest hover:border-forest/40 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.05a8.16 8.16 0 004.77 1.52V7.11a4.85 4.85 0 01-1-.42z"/></svg>
                        </a>
                      )}
                      {breeder.socialYoutube && (
                        <a href={socialHref('youtube', breeder.socialYoutube)} target="_blank" rel="noopener noreferrer" title="YouTube"
                          className="w-9 h-9 rounded-full border border-cream-deep bg-cream flex items-center justify-center text-stone-500 hover:text-forest hover:border-forest/40 transition-colors">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </BreederPageContent>
      </main>
      <BreederFooter
        kennelName={breeder.kennelName}
        slug={params.slug}
        themeColor={breeder.themeColor}
        themeAccentColor={breeder.themeAccentColor}
        website={breeder.website}
        socialInstagram={breeder.socialInstagram}
        socialFacebook={breeder.socialFacebook}
        socialTiktok={breeder.socialTiktok}
        socialYoutube={breeder.socialYoutube}
      />
    </>
  )
}
