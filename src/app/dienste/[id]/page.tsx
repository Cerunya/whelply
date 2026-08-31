import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import nextDynamic from 'next/dynamic'
import { Metadata } from 'next'
import ServiceGallery from '@/components/ServiceGallery'
import OpenStatus from '@/components/OpenStatus'

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
  const provider = await prisma.serviceProvider.findUnique({
    where: { id: params.id },
    include: { media: { select: { url: true, purpose: true }, take: 5 } },
  })
  if (!provider) return { title: 'Nicht gefunden' }
  const p = provider as any
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://whelply.de'
  const pageUrl = `${baseUrl}/dienste/${params.id}`
  const logoForOg = (provider as any)?.logoUrl ? `${baseUrl}${(provider as any).logoUrl}` : null
  const firstImage = provider.media.find((m) => m.purpose !== 'bg')?.url
  const ogImage = logoForOg || (firstImage ? `${baseUrl}${firstImage}` : `${baseUrl}/og-default.png`)
  const ogTitle = `${p.name} — ${CATEGORY_LABELS[p.category]}`
  const ogDesc = p.description
    ? (p.description as string).slice(0, 160)
    : `${CATEGORY_LABELS[p.category]}${p.city ? ` in ${p.city}` : ''} — Dienstleister auf Whelply`

  return {
    title: `${p.name} — ${CATEGORY_LABELS[p.category]}${p.city ? ` in ${p.city}` : ''} | Whelply`,
    description: ogDesc,
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      url: pageUrl,
      siteName: 'Whelply',
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDesc,
      images: ogImage ? [ogImage] : [],
    },
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
  const contactColor = p.pageContactColor ?? '#2d5016'
  const holidayHours = p.holidayHours as string | null
  const pricingInfo = p.pricingInfo as string | null

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

            {/* Galerie-Bilder mit Lightbox */}
            {galleryImages.length > 0 && (
              <div className="mb-8">
                <ServiceGallery images={galleryImages.map((img) => img.url)} name={provider.name} />
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
                      {holidayHours && (
                        <div className="flex items-center text-sm mt-2">
                          <span className="w-28 font-medium" style={{ color: headingColor }}>Feiertage</span>
                          <span>{holidayHours}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Preise */}
                {pricingInfo && (
                  <div>
                    <h2 className="font-serif text-lg font-bold mb-3" style={{ color: headingColor }}>Preise</h2>
                    <div className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line" style={{ backgroundColor: textColor + '08' }}>
                      {pricingInfo}
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

              {/* Rechte Spalte — Status + Kontakt */}
              <div className="space-y-4">
                {/* Offen/Geschlossen */}
                {hours && (
                  <OpenStatus hours={hours} contactColor={contactColor} />
                )}

                <div className="rounded-2xl p-6 text-white" style={{ backgroundColor: contactColor }}>
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
            {/* Social Sharing */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <span className="text-sm" style={{ color: textColor + '80' }}>Teilen:</span>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://whelply.de/dienste/${provider.id}`)}`}
                target="_blank" rel="noopener noreferrer" title="Auf Facebook teilen"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold transition-opacity hover:opacity-80" style={{ backgroundColor: '#1877f2' }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
              </a>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${provider.name} — ${CATEGORY_LABELS[provider.category]} auf Whelply`)}&url=${encodeURIComponent(`https://whelply.de/dienste/${provider.id}`)}`}
                target="_blank" rel="noopener noreferrer" title="Auf X/Twitter teilen"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80" style={{ backgroundColor: '#000000' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href={`https://wa.me/?text=${encodeURIComponent(`${provider.name} auf Whelply: https://whelply.de/dienste/${provider.id}`)}`}
                target="_blank" rel="noopener noreferrer" title="Über WhatsApp teilen"
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-opacity hover:opacity-80" style={{ backgroundColor: '#25d366' }}>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
              </a>
            </div>
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
