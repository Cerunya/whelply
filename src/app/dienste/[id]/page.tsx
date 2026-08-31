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
    include: { media: { select: { url: true, purpose: true }, orderBy: { sortOrder: 'asc' } } },
  })

  if (!provider) notFound()

  const p = provider as any
  const hours = parseHours(p.openingHours)
  const payments = (p.paymentMethods as string)?.split(',').map((s: string) => s.trim()).filter(Boolean) ?? []
  const logoUrl = p.logoUrl as string | null

  // Custom Farben (wie Deckrüden)
  const bgColor = p.pageBgColor ?? '#1e3a2f'
  const cardColor = p.pageCardColor ?? '#ffffff'
  const textColor = p.pageTextColor ?? '#44403c'
  const headingColor = p.pageHeadingColor ?? '#1c1917'
  const bgFixed = p.pageBgFixed !== false

  const bgImage = provider.media.find((m) => m.purpose === 'bg')?.url
  const galleryImages = provider.media.filter((m) => m.purpose !== 'bg')

  return (
    <div style={{ backgroundColor: bgColor, minHeight: '100vh' }}>
      <Navbar />
      <main className="min-h-screen relative">
        {/* Hintergrundbild */}
        {bgImage && (
          <div className={`${bgFixed ? 'fixed' : 'absolute'} inset-x-0 top-0 z-0`} style={{ height: '100vh', pointerEvents: 'none' }}>
            <img src={bgImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, transparent 0px, transparent 85vh, ${bgColor}90 95vh, ${bgColor} 100vh)` }} />
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 py-10 relative z-10">
          {/* Hauptkarte */}
          <div className="rounded-2xl overflow-hidden shadow-xl mt-16" style={{ backgroundColor: cardColor, color: textColor, padding: '2rem' }}>
            {/* Header mit Logo */}
            <div className="flex items-start gap-5 mb-6">
              {logoUrl && (
                <img src={logoUrl} alt={provider.name} className="w-20 h-20 rounded-2xl object-contain border flex-shrink-0" style={{ borderColor: textColor + '20' }} />
              )}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full" style={{ backgroundColor: headingColor + '10', color: headingColor }}>
                  {CATEGORY_LABELS[provider.category]}
                </span>
                {provider.isPremium && <span className="text-xs text-honey font-semibold ml-2">★ Premium</span>}
                <h1 className="font-serif text-3xl font-bold mt-2" style={{ color: headingColor }}>{provider.name}</h1>
                {provider.city && (
                  <p className="mt-1" style={{ color: textColor + 'aa' }}>{[provider.city, provider.state].filter(Boolean).join(', ')}</p>
                )}
              </div>
            </div>

            {/* Galerie-Bilder */}
            {galleryImages.length > 0 && (
              <div className="mb-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                {galleryImages.map((img, i) => (
                  <div key={i} className="rounded-xl overflow-hidden aspect-square">
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
                    <h2 className="font-serif text-lg font-bold mb-3" style={{ color: headingColor }}>Über uns</h2>
                    <p className="text-sm leading-relaxed whitespace-pre-line">{provider.description}</p>
                  </div>
                )}

                {/* Öffnungszeiten */}
                {hours && (
                  <div>
                    <h2 className="font-serif text-lg font-bold mb-4" style={{ color: headingColor }}>Öffnungszeiten</h2>
                    <div className="rounded-xl p-4 space-y-1.5" style={{ backgroundColor: textColor + '08' }}>
                      {DAYS.map((day) => {
                        const d = hours[day]
                        return (
                          <div key={day} className="flex items-center text-sm">
                            <span className="w-28 font-medium" style={{ color: d?.open ? headingColor : textColor + '60' }}>{day}</span>
                            {d?.open ? (
                              <span>
                                {d.from1} – {d.to1}
                                {d.from2 && d.to2 && d.from2 !== d.to2 && <span style={{ color: textColor + '60' }}> · </span>}
                                {d.from2 && d.to2 && d.from2 !== d.to2 && <>{d.from2} – {d.to2}</>}
                                {' '}Uhr
                              </span>
                            ) : (
                              <span style={{ color: '#ef4444' }} className="text-xs font-medium">Geschlossen</span>
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
                    <h2 className="font-serif text-lg font-bold mb-3" style={{ color: headingColor }}>Zahlungsarten</h2>
                    <div className="flex flex-wrap gap-3">
                      {payments.map((id) => {
                        const pm = PAYMENT_ICONS[id]
                        if (!pm) return null
                        return (
                          <div key={id} className="flex items-center gap-2 rounded-xl px-4 py-2.5 border" style={{ borderColor: textColor + '20', backgroundColor: textColor + '05' }}>
                            <span className="text-xl">{pm.icon}</span>
                            <span className="text-sm font-medium">{pm.label}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Rechte Spalte — Kontakt */}
              <div>
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

            {/* Karte — volle Breite */}
            {provider.lat && provider.lng && (
              <div className="mt-8">
                <h2 className="font-serif text-lg font-bold mb-3" style={{ color: headingColor }}>Standort</h2>
                <div className="rounded-xl overflow-hidden border" style={{ borderColor: textColor + '20' }}>
                  <LocationMap lat={provider.lat} lng={provider.lng} label={provider.name} className="h-72" />
                </div>
                {provider.street && (
                  <p className="text-sm mt-2" style={{ color: textColor + 'aa' }}>{provider.street}, {provider.zip} {provider.city}</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <a href="/dienste" className="text-sm hover:underline" style={{ color: cardColor + 'aa' }}>← Alle Dienstleister</a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
