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

type TabId = 'profil' | 'zuchthunde' | 'wuerfe' | 'hunde' | 'aktuelles' | 'galerie' | 'kontakt'

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
    { id: 'zuchthunde', label: 'Unsere Hunde', href: `/zuechter/${slug}/zuchthunde`, show: tabs.zuchthunde },
    { id: 'aktuelles', label: 'Aktuelles', href: `/zuechter/${slug}/aktuelles`, show: tabs.aktuelles },
    { id: 'galerie', label: 'Galerie', href: `/zuechter/${slug}/galerie`, show: tabs.galerie },
    { id: 'kontakt', label: 'Kontakt', href: `/zuechter/${slug}/kontakt`, show: true },
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
      {backgroundImage && (
        <style>{`body { background-color: ${breeder.themeBgOverlay ?? '#1e293b'} !important; }`}</style>
      )}
      {backgroundImage ? (
        <>
          <div
            className={`${breeder.themeBgFixed !== false ? 'fixed' : 'absolute'} inset-x-0 top-0 -z-20`}
            style={{ height: '100vh', backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
          {/* Gradient: oben transparent, unten Übergang zur Seitenfarbe */}
          <div
            className={`${breeder.themeBgFixed !== false ? 'fixed' : 'absolute'} inset-x-0 top-0 -z-10`}
            style={{ height: '100vh', background: `linear-gradient(to bottom, transparent 0px, transparent 85vh, ${breeder.themeBgOverlay ?? '#1e293b'}90 95vh, ${breeder.themeBgOverlay ?? '#1e293b'} 100vh)` }}
          />
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
              className="text-base md:text-xl font-bold tracking-wide drop-shadow-sm"
              style={{ color: accentColor || '#e0a72e' }}
            >
              {uniqueBreeds.join(' · ')}
            </p>
          )}
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
