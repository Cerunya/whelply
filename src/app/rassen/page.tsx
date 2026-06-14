import { prisma } from '@/lib/prisma'
import { FCI_GROUPS } from '@/lib/fci-groups'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

// Immer dynamisch rendern, damit Aenderungen (Theme, Status, neue Inserate etc.)
// sofort sichtbar sind, ohne dass der Full Route Cache veraltete Daten zeigt.
export const dynamic = 'force-dynamic'

export default async function RassenlexikonPage() {
  const breeds = await prisma.breed.findMany({
    orderBy: { nameDe: 'asc' },
  })

  const byGroup = new Map<number, typeof breeds>()
  for (const breed of breeds) {
    const list = byGroup.get(breed.fciGroup) ?? []
    list.push(breed)
    byGroup.set(breed.fciGroup, list)
  }

  const groupNumbers = Array.from(byGroup.keys()).sort((a, b) => a - b)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <section className="bg-forest px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-serif text-3xl font-bold text-white mb-2">
              Rasselexikon
            </h1>
            <p className="text-white/70 text-sm">
              Alle {breeds.length} FCI-anerkannten Rassen, organisiert nach den 10 FCI-Gruppen.
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
          {groupNumbers.map((groupNum) => (
            <div key={groupNum}>
              <h2 className="font-serif text-xl font-bold text-stone-900 mb-1">
                Gruppe {groupNum}
              </h2>
              <p className="text-sm text-stone-400 mb-4">{FCI_GROUPS[groupNum]}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {byGroup.get(groupNum)!.map((breed) => (
                  <Link
                    key={breed.id}
                    href={`/rassen/${breed.slug}`}
                    className="bg-white rounded-xl border border-cream-deep px-4 py-3 text-sm font-medium text-stone-700 hover:border-forest/30 hover:text-forest transition-colors"
                  >
                    {breed.nameDe}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
