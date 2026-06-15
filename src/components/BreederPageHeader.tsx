import Link from 'next/link'
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
  media: { url: string; purpose: string | null }[]
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
  const location = [breeder.city, breeder.state].filter(Boolean).join(', ')
  const headerImage = breeder.media.find((m) => m.purpose === 'header')?.url
  const backgroundImage = breeder.media.find((m) => m.purpose === 'background')?.url
  const themeColor = breeder.themeColor || undefined
  const accentColor = breeder.themeAccentColor || undefined

  const navItems = [
    { id: 'profil', label: 'Profil', href: `/zuechter/${slug}`, show: true },
    { id: 'zuchthunde', label: 'Zuchthunde', href: `/zuechter/${slug}/zuchthunde`, show: tabs.zuchthunde },
    { id: 'wuerfe', label: 'Würfe & Planung', href: `/zuechter/${slug}/wuerfe`, show: tabs.wuerfe },
    { id: 'hunde', label: 'Erwachsene Hunde', href: `/zuechter/${slug}/hunde`, show: tabs.erwachseneHunde },
    { id: 'aktuelles', label: 'Aktuelles', href: `/zuechter/${slug}/aktuelles`, show: tabs.aktuelles },
    { id: 'galerie', label: 'Galerie', href: `/zuechter/${slug}/galerie`, show: tabs.galerie },
  ].filter((item) => item.show)

  return (
    <>
      {backgroundImage ? (
        <>
          <div
            className="fixed inset-0 -z-20"
            style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
          />
          <div className="fixed inset-0 -z-10 bg-cream/85" />
        </>
      ) : (
        <div className="fixed inset-0 -z-10 bg-cream" />
      )}

      {/* Hero */}
      <section
        className={`relative px-4 py-14 ${headerImage ? '' : 'bg-forest'}`}
        style={themeColor && !headerImage ? { backgroundColor: themeColor } : undefined}
      >
        {headerImage && (
          <>
            <img src={headerImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/45" />
          </>
        )}
        <div className="max-w-5xl mx-auto relative">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-2 text-honey"
            style={accentColor ? { color: accentColor } : undefined}
          >
            {breeder.verband ? `${breeder.verband}-Züchter` : 'Züchter'}
          </p>
          <h1 className="font-serif text-4xl font-bold text-white mb-2">
            {displayName}
          </h1>
          {location && (
            <p className="text-white/70 text-sm flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {location}
            </p>
          )}
          {breeder.verificationLevel !== 'none' && (
            <p className="text-sm mt-2 font-medium text-honey" style={accentColor ? { color: accentColor } : undefined}>
              ✓ Verifizierter Züchter
            </p>
          )}
        </div>
      </section>

      {/* Unterseiten-Navigation */}
      <nav className="bg-white border-b border-cream-deep sticky top-16 z-40">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                active === item.id
                  ? 'border-forest text-forest'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  )
}
