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

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']

type DayHours = { open: boolean; from: string; to: string }

function parseHours(json: string | null): Record<string, DayHours> | null {
  if (!json) return null
  try { return JSON.parse(json) } catch { return null }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const p = await prisma.serviceProvider.findUnique({ where: { id: params.id }, select: { name: true, category: true, city: true } })
  if (!p) return { title: 'Nicht gefunden' }
  return {
    title: `${p.name} — ${CATEGORY_LABELS[p.category]}${p.city ? ` in ${p.city}` : ''} | Whelply`,
    description: `${p.name} — ${CATEGORY_LABELS[p.category]}${p.city ? ` in ${p.city}` : ''}. Finde Dienstleister für deinen Hund auf Whelply.`,
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

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Header mit Logo */}
          <div className="flex items-start gap-5 mb-8">
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

          {/* Bilder */}
          {provider.media.length > 0 && (
            <div className="mb-8 grid grid-cols-2 md:grid-cols-3 gap-3">
              {provider.media.map((img, i) => (
                <div key={i} className={`rounded-2xl overflow-hidden bg-cream ${i === 0 && provider.media.length > 2 ? 'col-span-2 row-span-2' : ''}`}>
                  <img src={img.url} alt={`${provider.name} Bild ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Linke Spalte */}
            <div className="md:col-span-2 space-y-6">
              {provider.description && (
                <div className="bg-white rounded-2xl border border-cream-deep p-6">
                  <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Über uns</h2>
                  <p className="text-stone-600 text-sm leading-relaxed whitespace-pre-line">{provider.description}</p>
                </div>
              )}

              {/* Öffnungszeiten — strukturiert */}
              {hours && (
                <div className="bg-white rounded-2xl border border-cream-deep p-6">
                  <h2 className="font-serif text-lg font-bold text-stone-900 mb-4">Öffnungszeiten</h2>
                  <div className="space-y-1.5">
                    {DAYS.map((day) => {
                      const d = hours[day]
                      return (
                        <div key={day} className="flex items-center text-sm">
                          <span className={`w-28 font-medium ${d?.open ? 'text-stone-800' : 'text-stone-400'}`}>{day}</span>
                          {d?.open ? (
                            <span className="text-stone-600">{d.from} – {d.to} Uhr</span>
                          ) : (
                            <span className="text-stone-400">Geschlossen</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Zahlungsarten */}
              {payments.length > 0 && (
                <div className="bg-white rounded-2xl border border-cream-deep p-6">
                  <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Zahlungsarten</h2>
                  <div className="flex flex-wrap gap-2">
                    {payments.map((p) => (
                      <span key={p} className="text-xs font-medium bg-cream border border-cream-deep text-stone-600 px-3 py-1.5 rounded-full">{p}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Karte */}
              {provider.lat && provider.lng && (
                <div className="bg-white rounded-2xl border border-cream-deep p-6">
                  <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Standort</h2>
                  <LocationMap lat={provider.lat} lng={provider.lng} label={provider.name} className="h-72" />
                  {provider.street && (
                    <p className="text-sm text-stone-500 mt-3">{provider.street}, {provider.zip} {provider.city}</p>
                  )}
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
                    <div>
                      <p className="text-white/60 text-xs mb-0.5">Website</p>
                      <a href={provider.website} target="_blank" rel="noopener noreferrer"
                        className="inline-block bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors mt-1">
                        Website besuchen →
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center">
            <a href="/dienste" className="text-sm text-forest hover:underline">← Alle Dienstleister</a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
