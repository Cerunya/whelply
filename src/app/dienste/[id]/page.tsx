import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import nextDynamic from 'next/dynamic'
import { Metadata } from 'next'

const LocationMap = nextDynamic(() => import('@/components/LocationMap'), { ssr: false })

export const dynamic = 'force-dynamic'

const CATEGORY_LABELS: Record<string, string> = {
  vet: 'Tierarzt / Tierklinik',
  groomer: 'Hundefriseur / Groomer',
  pension: 'Tierpension / Hundesitter',
  trainer: 'Hundetrainer / Hundeschule',
  other: 'Sonstige Dienstleistung',
}

const PAYMENT_ICONS: Record<string, { label: string; icon: string }> = {
  bargeld: { label: 'Bargeld', icon: '💵' },
  ec: { label: 'EC-Karte', icon: '💳' },
  kreditkarte: { label: 'Kreditkarte', icon: '💳' },
  paypal: { label: 'PayPal', icon: '🅿️' },
}

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
type DayHours = { open: boolean; from1: string; to1: string; from2: string; to2: string }

function parseHours(json: string | null): Record<string, DayHours> | null {
  if (!json) return null
  try { return JSON.parse(json) } catch { return null }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const p = await prisma.serviceProvider.findUnique({ where: { id: params.id }, select: { name: true, category: true, city: true } })
  if (!p) return { title: 'Nicht gefunden' }
  return {
    title: `${p.name} — ${CATEGORY_LABELS[p.category]}${p.city ? ` in ${p.city}` : ''} | Whelply`,
    description: `${p.name} — ${CATEGORY_LABELS[p.category]}${p.city ? ` in ${p.city}` : ''}. Dienstleister für deinen Hund auf Whelply.`,
  }
}

export default async function DienstDetailPage({ params }: { params: { id: string } }) {
  const provider = await prisma.serviceProvider.findUnique({
    where: { id: params.id },
    include: { media: { select: { url: true }, orderBy: { sortOrder: 'asc' } } },
  })

  if (!provider) notFound()

  const hours = parseHours((provider as any).openingHours)
  const payments = ((provider as any).paymentMethods as string)?.split(',').map((s: string) => s.trim()).filter(Boolean) ?? []
  const logoUrl = (provider as any).logoUrl as string | null
  const heroImage = provider.media[0]?.url

  return (
    <div style={{ backgroundColor: '#1e3a2f', minHeight: '100vh' }}>
      <Navbar />
      <main className="min-h-screen relative">
        {/* Hero-Hintergrund */}
        {heroImage ? (
          <div className="fixed inset-x-0 top-0 z-0" style={{ height: '100vh', pointerEvents: 'none' }}>
            <img src={heroImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(30,58,47,0.3) 0%, rgba(30,58,47,0.6) 50vh, #1e3a2f 85vh)' }} />
          </div>
        ) : (
          <div className="fixed inset-x-0 top-0 z-0" style={{ height: '50vh', pointerEvents: 'none', background: 'linear-gradient(to bottom, #2d5016, #1e3a2f)' }} />
        )}

        <div className="max-w-4xl mx-auto px-4 py-10 relative z-10">
          {/* Hauptkarte */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-xl p-6 md:p-8 mt-16">
            {/* Header mit Logo */}
            <div className="flex items-start gap-5 mb-6">
              {logoUrl && (
                <img src={logoUrl} alt={provider.name} className="w-20 h-20 rounded-2xl object-contain border border-cream-deep flex-shrink-0" />
              )}
              <div>
                <span className="text-xs font-semibold text-forest uppercase tracking-wider bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                  {CATEGORY_LABELS[provider.category]}
                </span>
                {provider.isPremium && <span className="text-xs text-honey font-semibold ml-2">★ Premium</span>}
                <h1 className="font-serif text-3xl font-bold text-stone-900 mt-2">{provider.name}</h1>
                {provider.city && (
                  <p className="text-stone-500 mt-1">{[provider.city, provider.state].filter(Boolean).join(', ')}</p>
                )}
              </div>
            </div>

            {/* Bilder-Galerie (restliche, ohne erstes Hero-Bild) */}
            {provider.media.length > 1 && (
              <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                {provider.media.slice(1).map((img, i) => (
                  <div key={i} className="rounded-xl overflow-hidden bg-cream aspect-square">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Linke Spalte */}
              <div className="md:col-span-2 space-y-6">
                {provider.description && (
                  <div>
                    <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Über uns</h2>
                    <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">{provider.description}</p>
                  </div>
                )}

                {/* Öffnungszeiten */}
                {hours && (
                  <div>
                    <h2 className="font-serif text-lg font-bold text-stone-900 mb-4">Öffnungszeiten</h2>
                    <div className="bg-cream/50 rounded-xl p-4 space-y-1.5">
                      {DAYS.map((day) => {
                        const d = hours[day]
                        return (
                          <div key={day} className="flex items-center text-sm">
                            <span className={`w-28 font-medium ${d?.open ? 'text-stone-800' : 'text-stone-400'}`}>{day}</span>
                            {d?.open ? (
                              <span className="text-stone-600">
                                {d.from1} – {d.to1}
                                {d.from2 && d.to2 && d.from2 !== d.to2 && (
                                  <span> · {d.from2} – {d.to2}</span>
                                )}
                                {' '}Uhr
                              </span>
                            ) : (
                              <span className="text-red-400 text-xs font-medium">Geschlossen</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Zahlungsarten */}
                {payments.length > 0 && (
                  <div>
                    <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Zahlungsarten</h2>
                    <div className="flex flex-wrap gap-3">
                      {payments.map((id) => {
                        const p = PAYMENT_ICONS[id]
                        if (!p) return null
                        return (
                          <div key={id} className="flex items-center gap-2 bg-cream border border-cream-deep rounded-xl px-4 py-2.5">
                            <span className="text-xl">{p.icon}</span>
                            <span className="text-sm font-medium text-stone-700">{p.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Rechte Spalte — Kontakt */}
              <div className="space-y-4">
                <div className="bg-forest rounded-2xl p-6 text-white">
                  <h3 className="font-serif text-lg font-bold mb-4">Kontakt</h3>
                  <div className="space-y-4 text-sm">
                    {provider.street && (
                      <div>
                        <p className="text-white/60 text-xs mb-0.5">Adresse</p>
                        <p>{provider.street}</p>
                        <p>{provider.zip} {provider.city}</p>
                      </div>
                    )}
                    {provider.phone && (
                      <div>
                        <p className="text-white/60 text-xs mb-0.5">Telefon</p>
                        <a href={`tel:${provider.phone}`} className="hover:text-honey transition-colors">{provider.phone}</a>
                      </div>
                    )}
                    {provider.website && (
                      <a href={provider.website} target="_blank" rel="noopener noreferrer"
                        className="block bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-center mt-3">
                        Website besuchen →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Karte — volle Breite unten */}
            {provider.lat && provider.lng && (
              <div className="mt-8">
                <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Standort</h2>
                <div className="rounded-xl overflow-hidden border border-cream-deep">
                  <LocationMap lat={provider.lat} lng={provider.lng} label={provider.name} className="h-72" />
                </div>
                {provider.street && (
                  <p className="text-sm text-stone-500 mt-2">{provider.street}, {provider.zip} {provider.city}</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <a href="/dienste" className="text-sm text-white/70 hover:text-white transition-colors">← Alle Dienstleister</a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
