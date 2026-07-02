import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { slugify } from '@/lib/slugify'

export const dynamic = 'force-dynamic'

export default async function MerklistePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    include: {
      listing: {
        include: {
          breed: { select: { nameDe: true } },
          media: { where: { isPrimary: true }, take: 1, select: { url: true } },
          breeder: { select: { kennelName: true } },
        },
      },
      litter: {
        include: {
          breed: { select: { nameDe: true } },
          media: { take: 1, select: { url: true } },
          breeder: { select: { kennelName: true } },
        },
      },
      breeder: {
        include: {
          media: { where: { purpose: 'background' }, take: 1, select: { url: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const listings = bookmarks.filter((b) => b.listing)
  const litters = bookmarks.filter((b) => b.litter)
  const breeders = bookmarks.filter((b) => b.breeder)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">Meine Merkliste</h1>

          {bookmarks.length === 0 && (
            <div className="text-center py-20 bg-white rounded-2xl border border-cream-deep">
              <p className="text-stone-400">Noch nichts gespeichert. Klicke auf das Lesezeichen-Icon auf Inseraten, Würfen oder Züchterseiten.</p>
            </div>
          )}

          {listings.length > 0 && (
            <section className="mb-10">
              <h2 className="font-serif text-xl font-bold text-stone-900 mb-4">Welpen & Hunde</h2>
              <div className="space-y-3">
                {listings.map((b) => (
                  <Link key={b.id} href={`/welpen/${b.listing!.id}`}
                    className="flex items-center gap-4 bg-white rounded-xl border border-cream-deep p-4 hover:border-forest/30 transition-colors">
                    {b.listing!.media[0]?.url
                      ? <img src={b.listing!.media[0].url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      : <div className="w-16 h-16 rounded-lg bg-cream-dark flex-shrink-0" />
                    }
                    <div>
                      <p className="font-semibold text-stone-900">{b.listing!.title || b.listing!.breed.nameDe}</p>
                      <p className="text-xs text-stone-400">{b.listing!.breed.nameDe} · {b.listing!.breeder.kennelName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {litters.length > 0 && (
            <section className="mb-10">
              <h2 className="font-serif text-xl font-bold text-stone-900 mb-4">Würfe</h2>
              <div className="space-y-3">
                {litters.map((b) => (
                  <Link key={b.id} href={`/zuechter/${slugify(b.litter!.breeder.kennelName)}/wuerfe/${b.litter!.id}`}
                    className="flex items-center gap-4 bg-white rounded-xl border border-cream-deep p-4 hover:border-forest/30 transition-colors">
                    {b.litter!.media[0]?.url
                      ? <img src={b.litter!.media[0].url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      : <div className="w-16 h-16 rounded-lg bg-cream-dark flex-shrink-0" />
                    }
                    <div>
                      <p className="font-semibold text-stone-900">{b.litter!.breed.nameDe}</p>
                      <p className="text-xs text-stone-400">{b.litter!.breeder.kennelName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {breeders.length > 0 && (
            <section>
              <h2 className="font-serif text-xl font-bold text-stone-900 mb-4">Züchter</h2>
              <div className="space-y-3">
                {breeders.map((b) => (
                  <Link key={b.id} href={`/zuechter/${slugify(b.breeder!.kennelName)}`}
                    className="flex items-center gap-4 bg-white rounded-xl border border-cream-deep p-4 hover:border-forest/30 transition-colors">
                    {b.breeder!.media[0]?.url
                      ? <img src={b.breeder!.media[0].url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      : <div className="w-16 h-16 rounded-lg bg-cream-dark flex-shrink-0" />
                    }
                    <div>
                      <p className="font-semibold text-stone-900">{b.breeder!.kennelName}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  )
}
