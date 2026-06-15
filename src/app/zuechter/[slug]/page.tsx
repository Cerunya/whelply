import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BreederPageHeader from '@/components/BreederPageHeader'
import { getBreederBySlug, getBreederTabs } from '@/lib/breeder'
import { renderRichText } from '@/lib/richtext'

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

  const tabs = await getBreederTabs(breeder.id)
  const hasContact = (breeder.showPhone && breeder.phone) || (breeder.showAddress && breeder.street)

  return (
    <>
      <Navbar />
      <main className="min-h-screen relative">
        <BreederPageHeader breeder={breeder} slug={params.slug} tabs={tabs} active="profil" />

        <div className="max-w-5xl mx-auto px-4 py-12">
          {/* Bio */}
          {breeder.bio && (
            <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6">
              <h2 className="font-serif text-xl font-bold text-stone-900 mb-3">Über uns</h2>
              <p className="text-stone-600 text-sm leading-relaxed">
                {renderRichText(breeder.bio)}
              </p>
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

          {/* Kontakt — Telefon/Adresse nur wenn vom Züchter freigegeben */}
          {hasContact ? (
            <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-6">
              <h2 className="font-serif text-xl font-bold text-stone-900 mb-3">Kontakt</h2>
              <div className="space-y-2 text-sm text-stone-600">
                {breeder.showPhone && breeder.phone && (
                  <p className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${breeder.phone}`} className="hover:text-forest">{breeder.phone}</a>
                  </p>
                )}
                {breeder.showAddress && breeder.street && (
                  <p className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {breeder.street}{breeder.zip && `, ${breeder.zip}`}{breeder.city && ` ${breeder.city}`}
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {!breeder.bio && !hasContact && (
            <div className="text-center py-12 bg-white rounded-2xl border border-cream-deep mb-6">
              <p className="text-stone-400 text-sm">
                {breeder.displayName || breeder.kennelName} hat noch keine Beschreibung hinterlegt.
              </p>
            </div>
          )}

          <div className="text-center">
            <Link href="/zuechter" className="text-sm text-forest font-semibold hover:underline">
              ← Alle Züchter durchsuchen
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
