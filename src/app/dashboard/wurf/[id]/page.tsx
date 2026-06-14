import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import LitterDashboard from '@/components/LitterDashboard'

export default async function WurfDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
  })
  if (!breeder) redirect('/login')

  const litter = await prisma.litter.findUnique({
    where: { id: params.id },
    include: {
      breed: { select: { nameDe: true } },
      dam: { select: { id: true, name: true } },
      sire: { select: { id: true, name: true } },
      listings: {
        include: {
          dog: true,
          media: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      media: { take: 1, select: { url: true } },
    },
  })

  if (!litter || litter.breederId !== breeder.id) notFound()

  // Eigene Hunde für Mutter/Vater-Auswahl (gefiltert nach Rasse des Wurfs)
  const dogs = await prisma.dog.findMany({
    where: { breederId: breeder.id },
    select: { id: true, name: true, sex: true, breedId: true },
    orderBy: { name: 'asc' },
  })
  const dams = dogs.filter((d) => d.sex === 'female')
  const sires = dogs.filter((d) => d.sex === 'male')

  return (
    <LitterDashboard
      litter={{
        id: litter.id,
        breedId: litter.breedId,
        breedName: litter.breed.nameDe,
        damId: litter.damId,
        sireId: litter.sireId,
        damName: litter.dam?.name ?? null,
        sireName: litter.sire?.name ?? litter.sireExternal,
        sireExternal: litter.sireExternal,
        expectedDate: litter.expectedDate?.toISOString().slice(0, 10) ?? null,
        bornDate: litter.bornDate?.toISOString().slice(0, 10) ?? null,
        puppyCount: litter.puppyCount,
        status: litter.status,
        notes: litter.notes,
        imageUrl: litter.media[0]?.url ?? null,
      }}
      dams={dams}
      sires={sires}
      puppies={litter.listings.map((l) => ({
        listingId: l.id,
        dogId: l.dog?.id ?? null,
        name: l.title || l.dog?.name || 'Unbenannt',
        sex: l.sex,
        status: l.status,
        priceCents: l.priceCents,
        imageUrl: l.media[0]?.url ?? null,
      }))}
    />
  )
}
