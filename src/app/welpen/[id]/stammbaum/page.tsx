import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export const dynamic = 'force-dynamic'

export default async function StammbaumPage({
  params,
}: {
  params: { id: string }
}) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      breed: { select: { nameDe: true } },
      media: { where: { isPrimary: true }, take: 1, select: { url: true } },
      litter: {
        include: {
          // Eltern (Generation 1)
          dam: {
            include: {
              media: { take: 1, select: { url: true } },
              // Großeltern mütterlicherseits (Generation 2)
              littersAsDam: {
                take: 1,
                orderBy: { bornDate: 'desc' },
                include: {
                  dam: {
                    include: {
                      media: { take: 1, select: { url: true } },
                      // Urgroßeltern (Generation 3) mütterlicherseits-mütterlich
                      littersAsDam: {
                        take: 1,
                        orderBy: { bornDate: 'desc' },
                        include: {
                          dam: { select: { id: true, name: true } },
                          sire: { select: { id: true, name: true } },
                        },
                      },
                    },
                  },
                  sire: {
                    include: {
                      media: { take: 1, select: { url: true } },
                      littersAsSire: {
                        take: 1,
                        orderBy: { bornDate: 'desc' },
                        include: {
                          dam: { select: { id: true, name: true } },
                          sire: { select: { id: true, name: true } },
                        },
                      },
                    },
                  },
                },
              },
              littersAsSire: {
                take: 1,
                orderBy: { bornDate: 'desc' },
                include: {
                  dam: { select: { id: true, name: true } },
                  sire: { select: { id: true, name: true } },
                },
              },
            },
          },
          sire: {
            include: {
              media: { take: 1, select: { url: true } },
              // Großeltern väterlicherseits (Generation 2)
              littersAsSire: {
                take: 1,
                orderBy: { bornDate: 'desc' },
                include: {
                  dam: {
                    include: {
                      media: { take: 1, select: { url: true } },
                      littersAsDam: {
                        take: 1,
                        orderBy: { bornDate: 'desc' },
                        include: {
                          dam: { select: { id: true, name: true } },
                          sire: { select: { id: true, name: true } },
                        },
                      },
                    },
                  },
                  sire: {
                    include: {
                      media: { take: 1, select: { url: true } },
                      littersAsSire: {
                        take: 1,
                        orderBy: { bornDate: 'desc' },
                        include: {
                          dam: { select: { id: true, name: true } },
                          sire: { select: { id: true, name: true } },
                        },
                      },
                    },
                  },
                },
              },
              littersAsDam: {
                take: 1,
                orderBy: { bornDate: 'desc' },
                include: {
                  dam: { select: { id: true, name: true } },
                  sire: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!listing || !listing.litter) notFound()

  const name = listing.title || `Welpe aus ${listing.breed.nameDe}-Wurf`
  const photo = listing.media[0]?.url
  const sex = listing.sex === 'male' ? 'Rüde' : listing.sex === 'female' ? 'Hündin' : ''
  const bornDate = listing.litter.bornDate

  const dam = listing.litter.dam
  const sire = listing.litter.sire
  const sireExternal = listing.litter.sireExternal

  // Großeltern
  const damMother = dam?.littersAsDam?.[0]?.dam ?? null
  const damFather = dam?.littersAsDam?.[0]?.sire ?? null
  const sireMother = sire?.littersAsSire?.[0]?.dam ?? null
  const sireFather = sire?.littersAsSire?.[0]?.sire ?? null

  // Urgroßeltern
  const damMotherMother = dam?.littersAsDam?.[0]?.dam && 'littersAsDam' in (dam.littersAsDam?.[0]?.dam as object)
    ? (dam.littersAsDam[0].dam as any).littersAsDam?.[0]?.dam ?? null : null
  const damMotherFather = dam?.littersAsDam?.[0]?.dam && 'littersAsDam' in (dam.littersAsDam?.[0]?.dam as object)
    ? (dam.littersAsDam[0].dam as any).littersAsDam?.[0]?.sire ?? null : null
  const damFatherMother = dam?.littersAsDam?.[0]?.sire && 'littersAsSire' in (dam.littersAsDam?.[0]?.sire as object)
    ? (dam.littersAsDam[0].sire as any).littersAsSire?.[0]?.dam ?? null : null
  const damFatherFather = dam?.littersAsDam?.[0]?.sire && 'littersAsSire' in (dam.littersAsDam?.[0]?.sire as object)
    ? (dam.littersAsDam[0].sire as any).littersAsSire?.[0]?.sire ?? null : null
  const sireMotherMother = sire?.littersAsSire?.[0]?.dam && 'littersAsDam' in (sire.littersAsSire?.[0]?.dam as object)
    ? (sire.littersAsSire[0].dam as any).littersAsDam?.[0]?.dam ?? null : null
  const sireMotherFather = sire?.littersAsSire?.[0]?.dam && 'littersAsDam' in (sire.littersAsSire?.[0]?.dam as object)
    ? (sire.littersAsSire[0].dam as any).littersAsDam?.[0]?.sire ?? null : null
  const sireFatherMother = sire?.littersAsSire?.[0]?.sire && 'littersAsSire' in (sire.littersAsSire?.[0]?.sire as object)
    ? (sire.littersAsSire[0].sire as any).littersAsSire?.[0]?.dam ?? null : null
  const sireFatherFather = sire?.littersAsSire?.[0]?.sire && 'littersAsSire' in (sire.littersAsSire?.[0]?.sire as object)
    ? (sire.littersAsSire[0].sire as any).littersAsSire?.[0]?.sire ?? null : null

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-6xl mx-auto px-4 py-10">

          <div className="mb-6">
            <Link href={`/welpen/${params.id}`} className="text-sm text-forest font-semibold hover:underline">
              ← Zurück zum Inserat
            </Link>
          </div>

          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-1">
            Stammbaum: {name}
          </h1>
          <p className="text-stone-400 text-sm mb-8">
            {listing.breed.nameDe}
            {sex ? ` · ${sex}` : ''}
            {bornDate ? ` · Geboren am ${bornDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' })}` : ''}
          </p>

          {/* Stammbaum-Tabelle */}
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">

              {/* Zeile: Welpe */}
              <div className="flex justify-center mb-8">
                <div className="bg-white rounded-2xl border-2 border-forest/30 p-5 w-56 text-center shadow-sm">
                  {photo && <img src={photo} alt={name} className="w-20 h-20 rounded-xl object-cover mx-auto mb-3" />}
                  <p className="text-xs text-stone-400 uppercase tracking-wide mb-1">
                    {sex || 'Welpe'}
                    {bornDate ? ` · Geb. ${bornDate.toLocaleDateString('de-DE')}` : ''}
                  </p>
                  <p className="font-serif font-bold text-stone-900 text-sm">{name}</p>
                  <p className="text-xs text-stone-400">{listing.breed.nameDe}</p>
                </div>
              </div>

              {/* Verbindungslinie Welpe → Eltern */}
              <div className="flex justify-center mb-2">
                <div className="w-0.5 h-6 bg-stone-300" />
              </div>
              <div className="flex justify-center mb-2">
                <div className="w-1/2 h-0.5 bg-stone-300" />
              </div>

              {/* Zeile: Eltern */}
              <div className="grid grid-cols-2 gap-8 mb-8">
                {/* Mutter */}
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-stone-300 mb-2" />
                  {dam ? (
                    <Link href={`/hund/${dam.id}`} className="bg-white rounded-2xl border-2 border-pink-200 p-4 w-full max-w-xs hover:border-pink-300 hover:shadow transition-all block">
                      {dam.media[0]?.url && <img src={dam.media[0].url} alt={dam.name} className="w-16 h-16 rounded-xl object-cover mx-auto mb-2" />}
                      <p className="text-xs text-pink-500 font-semibold uppercase tracking-wide text-center mb-1">Mutter</p>
                      <p className="font-serif font-bold text-stone-900 text-sm text-center">{dam.name}</p>
                      {dam.titles && <p className="text-xs text-stone-400 text-center mt-1">{dam.titles}</p>}
                    </Link>
                  ) : (
                    <div className="bg-cream rounded-2xl border border-cream-deep p-4 w-full max-w-xs text-center text-stone-400 text-sm">Mutter nicht angegeben</div>
                  )}
                </div>

                {/* Vater */}
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-stone-300 mb-2" />
                  {sire ? (
                    <Link href={`/hund/${sire.id}`} className="bg-white rounded-2xl border-2 border-blue-200 p-4 w-full max-w-xs hover:border-blue-300 hover:shadow transition-all block">
                      {sire.media[0]?.url && <img src={sire.media[0].url} alt={sire.name} className="w-16 h-16 rounded-xl object-cover mx-auto mb-2" />}
                      <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide text-center mb-1">Vater</p>
                      <p className="font-serif font-bold text-stone-900 text-sm text-center">{sire.name}</p>
                      {sire.titles && <p className="text-xs text-stone-400 text-center mt-1">{sire.titles}</p>}
                    </Link>
                  ) : sireExternal ? (
                    <div className="bg-white rounded-2xl border-2 border-blue-200 p-4 w-full max-w-xs text-center">
                      <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-1">Vater (extern)</p>
                      <p className="font-serif font-bold text-stone-900 text-sm">{sireExternal}</p>
                    </div>
                  ) : (
                    <div className="bg-cream rounded-2xl border border-cream-deep p-4 w-full max-w-xs text-center text-stone-400 text-sm">Vater nicht angegeben</div>
                  )}
                </div>
              </div>

              {/* Zeile: Großeltern */}
              {(damMother || damFather || sireMother || sireFather) && (
                <>
                  <div className="grid grid-cols-4 gap-4 mb-8">
                    {[
                      { label: 'Großmutter (m)', dog: damMother, color: 'pink' },
                      { label: 'Großvater (m)', dog: damFather, color: 'blue' },
                      { label: 'Großmutter (v)', dog: sireMother, color: 'pink' },
                      { label: 'Großvater (v)', dog: sireFather, color: 'blue' },
                    ].map(({ label, dog, color }) => (
                      <div key={label} className="flex flex-col items-center">
                        <div className="w-0.5 h-4 bg-stone-300 mb-2" />
                        {dog ? (
                          <Link href={`/hund/${dog.id}`}
                            className={`bg-white rounded-xl border-2 ${color === 'pink' ? 'border-pink-100 hover:border-pink-200' : 'border-blue-100 hover:border-blue-200'} p-3 w-full hover:shadow transition-all block text-center`}>
                            <p className={`text-xs ${color === 'pink' ? 'text-pink-400' : 'text-blue-400'} font-semibold mb-1`}>{label}</p>
                            <p className="text-xs font-semibold text-stone-800 line-clamp-2">{dog.name}</p>
                          </Link>
                        ) : (
                          <div className="bg-cream rounded-xl border border-cream-deep p-3 w-full text-center">
                            <p className="text-xs text-stone-300">{label}</p>
                            <p className="text-xs text-stone-300 mt-1">—</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Zeile: Urgroßeltern */}
                  {(damMotherMother || damMotherFather || damFatherMother || damFatherFather ||
                    sireMotherMother || sireMotherFather || sireFatherMother || sireFatherFather) && (
                    <div className="grid grid-cols-8 gap-2">
                      {[
                        { label: 'Urgroßmutter', dog: damMotherMother },
                        { label: 'Urgroßvater', dog: damMotherFather },
                        { label: 'Urgroßmutter', dog: damFatherMother },
                        { label: 'Urgroßvater', dog: damFatherFather },
                        { label: 'Urgroßmutter', dog: sireMotherMother },
                        { label: 'Urgroßvater', dog: sireMotherFather },
                        { label: 'Urgroßmutter', dog: sireFatherMother },
                        { label: 'Urgroßvater', dog: sireFatherFather },
                      ].map(({ label, dog }, i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className="w-0.5 h-3 bg-stone-200 mb-1.5" />
                          {dog ? (
                            <Link href={`/hund/${(dog as any).id}`}
                              className="bg-white rounded-lg border border-stone-200 hover:border-stone-300 p-2 w-full block text-center transition-colors">
                              <p className="text-xs text-stone-400 mb-0.5 leading-tight">{label}</p>
                              <p className="text-xs font-medium text-stone-700 line-clamp-2 leading-tight">{(dog as any).name}</p>
                            </Link>
                          ) : (
                            <div className="bg-cream rounded-lg border border-cream-deep p-2 w-full text-center">
                              <p className="text-xs text-stone-300 leading-tight">{label}</p>
                              <p className="text-xs text-stone-200 mt-0.5">—</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Hinweis */}
          <p className="text-xs text-stone-400 mt-8 text-center">
            Nur auf Whelply eingetragene und verknüpfte Hunde sind im Stammbaum sichtbar.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
