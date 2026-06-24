import BreederTabNav from './BreederTabNav'
import type { BreederTabFlags } from '@/lib/breeder'

type BreederHeaderData = {
  displayName: string | null
  kennelName: string
  city: string | null
  state: string | null
  verband: string | null
  verificationLevel: string
  themeColor: string | null
  themeAccentColor: string | null
  themeBgColor: string | null
  themeNavColor: string | null
  themeFont: string | null
  themeAlign: string | null
  media: { url: string; purpose: string | null }[]
  dogs?: { breed: { nameDe: string } }[]
}

type TabId = 'profil' | 'zuchthunde' | 'wuerfe' | 'hunde' | 'aktuelles' | 'galerie'

export default function BreederPageHeader({
  breeder,
  slug,
  tabs,
  active,
}: {
  breeder: BreederHeaderData
  slug: string
  tabs: BreederTabFlags
  active: TabId
}) {
  const displayName = breeder.displayName || breeder.kennelName
  const headerImage = breeder.media.find((m) => m.purpose === 'header')?.url
  const backgroundImage = breeder.media.find((m) => m.purpose === 'background')?.url
  const themeColor = breeder.themeColor || null
  const accentColor = breeder.themeAccentColor || null
  const navColor = breeder.themeNavColor || themeColor
  const font = breeder.themeFont || null
  const align = (breeder.themeAlign as 'left' | 'center' | 'right' | null) || 'left'

  const alignClass = align === 'center' ? 'text-center items-center' : align === 'right' ? 'text-right items-end' : 'text-left items-start'

  // Unique breeds across all dogs of this breeder (if provided)
  const breedNames = (breeder.dogs ?? []).map((d: { breed: { nameDe: string } }) => d.breed.nameDe)
  const uniqueBreeds = Array.from(new Set(breedNames))

  const navItems = [
    { id: 'profil', label: 'Profil', href: `/zuechter/${slug}`, show: true },
    { id: 'wuerfe', label: 'Würfe & Planung', href: `/zuechter/${slug}/wuerfe`, show: tabs.wuerfe },
    { id: 'hunde', label: 'Hunde zu vergeben', href: `/zuechter/${slug}/hunde`, show: tabs.erwachseneHunde },
    { id: 'zuchthunde', label: 'Zuchthunde', href: `/zuechter/${slug}/zuchthunde`, show: tabs.zuchthunde },
    { id: 'aktuelles', label: 'Aktuelles', href: `/zuechter/${slug}/aktuelles`, show: tabs.aktuelles },
    { id: 'galerie', label: 'Galerie', href: `/zuechter/${slug}/galerie`, show: tabs.galerie },
  ].filter((item) => item.show)

  return (
    <>
      {/* Google Font laden, falls gesetzt */}
      {font && (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(font)}:wght@400;700&display=swap`}
        />
      )}

      {/* Seitenhintergrund */}
      {backgroundImage ? (
        <>
          <div
            className="fixed inset-0 -z-20"
            style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
          />
          <div className="fixed inset-0 -z-10 bg-cream/45" />
        </>
      ) : (
        <div
          className="fixed inset-0 -z-10"
          style={{ backgroundColor: breeder.themeBgColor || '#FAF8F4' }}
        />
      )}

      {/* Hero — kein separates Headerbild, der Inhalt liegt auf dem Seitenhintergrund */}
      <section className="relative px-4 py-20 md:py-28">
        <div className={`max-w-5xl mx-auto relative flex flex-col gap-2 ${alignClass}`}>
          {/* Züchternamen — groß, mit wählbarer Schrift, Textschatten für Lesbarkeit */}
          <h1
            className="text-5xl md:text-6xl font-bold leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]"
            style={{
              color: themeColor ? '#ffffff' : '#1c1c1c',
              fontFamily: font ? `'${font}', serif` : 'Georgia, serif',
            }}
          >
            {displayName}
          </h1>

          {/* Rasse(n) */}
          {uniqueBreeds.length > 0 && (
            <p
              className="text-base md:text-lg font-light tracking-wide drop-shadow-sm"
              style={{ color: accentColor || '#e0a72e' }}
            >
              {uniqueBreeds.join(' · ')}
            </p>
          )}

          {/* Verband/Verifiziert — dezent */}
          <div className="flex items-center gap-3 flex-wrap mt-1">
            {breeder.verband && (
              <span
                className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded backdrop-blur-sm"
                style={{ color: accentColor || '#D4A853', backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                {breeder.verband}
              </span>
            )}
            {breeder.verificationLevel !== 'none' && (
              <span className="text-xs flex items-center gap-1 text-white/80 drop-shadow-sm">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Verifiziert
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Tab-Navigation — schmaler Balken, wird bei Sticky auf volle Breite */}
      <BreederTabNav
        navItems={navItems}
        active={active}
        themeColor={themeColor}
        navColor={navColor}
        accentColor={accentColor}
      />
    </>
  )
}
