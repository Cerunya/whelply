import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import BreederPageHeader from '@/components/BreederPageHeader'
import BreederPageContent from '@/components/BreederPageContent'
import { getBreederBySlug, getBreederTabs } from '@/lib/breeder'

export const dynamic = 'force-dynamic'

export default async function GaleriePage({
  params,
}: {
  params: { slug: string }
}) {
  const breeder = await getBreederBySlug(params.slug)
  if (!breeder) notFound()

  const tabs = await getBreederTabs(breeder.id)

  const images = await prisma.media.findMany({
    where: { breederId: breeder.id, purpose: 'gallery' },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, url: true },
  })

  return (
    <>
      <Navbar />
      <main className="min-h-screen relative">
        <BreederPageHeader breeder={breeder} slug={params.slug} tabs={tabs} active="galerie" />

        <BreederPageContent>
          <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6">Galerie</h2>

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
        </BreederPageContent>
      </main>
      <Footer />
    </>
  )
}
