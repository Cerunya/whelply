import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function GaleriePage({
  params,
}: {
  params: { slug: string }
}) {
  const breeders = await prisma.breederProfile.findMany({
    select: { id: true, kennelName: true, displayName: true, themeColor: true },
  })
  const match = breeders.find((b) => slugify(b.kennelName) === params.slug)
  if (!match) notFound()

  const images = await prisma.media.findMany({
    where: { breederId: match.id, purpose: 'gallery' },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, url: true },
  })

  const displayName = match.displayName || match.kennelName

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <section
          className="bg-forest px-4 py-10"
          style={match.themeColor ? { backgroundColor: match.themeColor } : undefined}
        >
          <div className="max-w-5xl mx-auto">
            <p className="text-xs text-white/60 mb-2">
              <Link href={`/zuechter/${params.slug}`} className="hover:underline">{displayName}</Link>
              {' / Galerie'}
            </p>
            <h1 className="font-serif text-3xl font-bold text-white">Galerie</h1>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-12">
          {images.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-cream-deep">
              <p className="text-stone-400">Noch keine Fotos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <div key={img.id}>
                  <a
                    href={`#foto-${img.id}`}
                    className="aspect-square rounded-xl overflow-hidden border border-cream-deep block cursor-zoom-in hover:opacity-90 transition-opacity"
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </a>

                  {/* Lightbox: per CSS :target ein-/ausgeblendet, kein JS nötig */}
                  <div
                    id={`foto-${img.id}`}
                    className="hidden target:flex fixed inset-0 z-50 items-center justify-center p-4 bg-black/90"
                  >
                    <a href="#" className="absolute inset-0" aria-label="Schließen" />
                    <img
                      src={img.url}
                      alt=""
                      className="relative max-w-full max-h-full object-contain rounded-lg"
                    />
                    <a
                      href="#"
                      aria-label="Schließen"
                      className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white text-2xl leading-none hover:bg-white/20 transition-colors"
                    >
                      ×
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <Link href={`/zuechter/${params.slug}`} className="text-sm text-forest font-semibold hover:underline">
              ← Zurück zur Züchterseite
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
