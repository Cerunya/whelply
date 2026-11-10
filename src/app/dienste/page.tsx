import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Suspense } from 'react'
import DiensteSuche from '@/components/DiensteSuche'
import nextDynamic from 'next/dynamic'

const DiensteMapView = nextDynamic(() => import('@/components/DiensteMapView'), {
  ssr: false,
  loading: () => <div className="h-[590px] animate-pulse rounded-3xl bg-stone-100" />,
})

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Dienstleister rund um den Hund | Whelply',
  description: 'Tierärzte, Hundefriseure, Tierpensionen und Hundetrainer in deiner Nähe finden – mit übersichtlichen Profilen und direkten Kontaktmöglichkeiten.',
}

const CATEGORY_LABELS: Record<string, string> = {
  vet: 'Tierärzte',
  groomer: 'Hundefriseure & Groomer',
  pension: 'Tierpensionen',
  trainer: 'Hundetrainer',
  other: 'Sonstige Dienstleister',
}

export default async function DienstePage({
  searchParams,
}: {
  searchParams: { kategorie?: string; ort?: string; region?: string; radius?: string }
}) {
  let radiusFilter: any = {}
  const radiusKm = Number(searchParams.radius) || 0
  if (searchParams.ort && radiusKm > 0) {
    const { geocodeAddress } = await import('@/lib/geocode')
    const coords = await geocodeAddress({ zip: searchParams.ort, city: searchParams.ort })
    if (coords) {
      const delta = radiusKm / 111
      radiusFilter = {
        lat: { gte: coords.lat - delta, lte: coords.lat + delta },
        lng: { gte: coords.lng - delta, lte: coords.lng + delta },
      }
    }
  }

  const providers = await prisma.serviceProvider.findMany({
    where: {
      ...(searchParams.kategorie ? { category: searchParams.kategorie as any } : {}),
      ...(searchParams.region ? { state: searchParams.region } : {}),
      ...(searchParams.ort && !radiusKm ? { OR: [{ zip: { startsWith: searchParams.ort } }, { city: { contains: searchParams.ort, mode: 'insensitive' as const } }] } : {}),
      ...radiusFilter,
    },
    orderBy: [{ isPremium: 'desc' }, { createdAt: 'desc' }],
  })

  const showMap = Boolean(searchParams.ort && providers.length > 0)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <section className="relative overflow-hidden bg-forest px-4 pb-28 pt-12">
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <svg className="absolute inset-0 h-full w-full text-white opacity-[0.035]" aria-hidden="true">
              <defs>
                <pattern id="dienste-paw-pattern" width="190" height="190" patternUnits="userSpaceOnUse">
                  <g fill="currentColor" transform="translate(22 24) rotate(-18 30 30)">
                    <ellipse cx="30" cy="40" rx="13" ry="15" /><ellipse cx="10" cy="25" rx="6" ry="8" /><ellipse cx="23" cy="14" rx="6" ry="8" /><ellipse cx="37" cy="14" rx="6" ry="8" /><ellipse cx="50" cy="25" rx="6" ry="8" />
                  </g>
                  <g fill="currentColor" transform="translate(112 108) rotate(16 30 30)">
                    <ellipse cx="30" cy="40" rx="13" ry="15" /><ellipse cx="10" cy="25" rx="6" ry="8" /><ellipse cx="23" cy="14" rx="6" ry="8" /><ellipse cx="37" cy="14" rx="6" ry="8" /><ellipse cx="50" cy="25" rx="6" ry="8" />
                  </g>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#dienste-paw-pattern)" />
            </svg>
          </div>
          <div className="pointer-events-none absolute -right-16 -top-28 h-[330px] w-[330px] rounded-full bg-honey-light/[0.08]" aria-hidden="true" />
          <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 px-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-honey-light">Gute Adressen für deinen Hund</p>
              <h1 className="max-w-3xl font-serif text-3xl font-bold text-white sm:text-4xl">Dienstleister, denen du vertrauen kannst.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 sm:text-base">Tierärzte, Hundefriseure, Pensionen und Trainer – finde genau die Unterstützung, die du und dein Hund braucht.</p>
            </div>
            <div className="max-w-xs rounded-2xl border border-white/15 bg-white/[0.07] p-5">
              <div className="flex items-center gap-2.5 text-honey-light">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                <p className="text-sm font-bold text-white">Dienste in deiner Nähe</p>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-white/70">Mit übersichtlichen Profilen, Kontaktdaten und allen wichtigen Informationen.</p>
            </div>
          </div>
        </section>

        <div className="relative z-20 mx-auto -mt-16 max-w-6xl px-4">
          <div className="rounded-2xl border border-cream-deep bg-white p-5 shadow-[7px_7px_0_rgba(18,38,25,0.08)]">
            <Suspense fallback={<div className="h-32 w-full animate-pulse rounded-lg bg-stone-100" />}>
              <DiensteSuche />
            </Suspense>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 pb-20 pt-10">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-honey">Dienstleister-Verzeichnis</p>
              <h2 className="mt-1 font-serif text-2xl font-bold text-stone-900">{showMap ? 'Dienstleister in deiner Umgebung' : 'Gute Adressen auf einen Blick'}</h2>
            </div>
            {showMap && <span className="hidden text-sm text-stone-400 sm:inline">Ort: {searchParams.ort}</span>}
          </div>

          {providers.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 py-20 text-center">
              <svg className="mx-auto mb-4 h-12 w-12 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m20 20-4-4" /></svg>
              <h2 className="mb-2 font-serif text-lg font-bold text-stone-700">Keine Dienstleister gefunden</h2>
              <p className="mx-auto max-w-md text-sm text-stone-400">Versuche einen anderen Ort oder entferne einen Filter.</p>
              <Link href="/dienste" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-forest px-5 text-sm font-semibold text-white">Alle Dienstleister anzeigen</Link>
            </div>
          ) : showMap ? (
            <DiensteMapView providers={providers} />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider) => (
                <Link
                  key={provider.id}
                  href={`/dienste/${provider.id}`}
                  className={`group flex min-h-[310px] flex-col rounded-3xl border bg-white p-5 shadow-[6px_6px_0_#EDE4CE] transition-all duration-200 hover:-translate-y-1 hover:border-forest hover:shadow-[8px_8px_0_#EDE4CE] ${provider.isPremium ? 'border-honey/60' : 'border-cream-deep'}`}
                >
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-cream-deep bg-white">
                      {provider.logoUrl ? <img src={provider.logoUrl} alt={`Logo von ${provider.name}`} className="h-full w-full object-contain p-1" /> : <span className="font-serif text-xl font-bold text-forest">{provider.name.charAt(0)}</span>}
                    </span>
                    {provider.isPremium ? <span className="rounded-full border border-[#EBD29D] bg-[#F8EBCF] px-2.5 py-1 text-[10px] font-bold text-[#8A5B12]">★ Empfohlen</span> : <span className="text-honey">→</span>}
                  </div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-forest">{CATEGORY_LABELS[provider.category]}</p>
                  <h3 className="font-serif text-xl font-bold leading-snug text-stone-900 transition-colors group-hover:text-forest">{provider.name}</h3>
                  {provider.description && <p className="mb-4 mt-2 line-clamp-3 text-sm leading-relaxed text-stone-500">{provider.description}</p>}
                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-cream-deep pt-4 text-xs text-stone-400">
                    <span className="flex items-center gap-1.5">
                      <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>
                      {[provider.city, provider.state].filter(Boolean).join(', ') || 'Deutschland'}
                    </span>
                    <span className="text-base text-honey">→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <section className="mt-16 flex flex-col gap-6 rounded-3xl bg-[#EAF3EC] p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-honey">Für Dienstleister</p>
              <h2 className="font-serif text-2xl font-bold text-forest sm:text-3xl">Dein Angebot fehlt noch?</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-500">Präsentiere deinen Betrieb mit Logo und eigenem Profil und werde von Hundehaltern in deiner Region gefunden.</p>
            </div>
            <Link href="/register" className="inline-flex min-h-12 flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5">Dienstleistung eintragen <span>→</span></Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
