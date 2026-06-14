import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import InseratEditForm from '@/components/InseratEditForm'

export default async function InseratBearbeitenPage({
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

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      breed: true,
      media: { orderBy: { sortOrder: 'asc' } },
    },
  })

  if (!listing || listing.breederId !== breeder.id) notFound()

  const breeds = await prisma.breed.findMany({
    orderBy: { nameDe: 'asc' },
    select: { id: true, nameDe: true },
  })

  const litters = await prisma.litter.findMany({
    where: { breederId: breeder.id },
    include: { breed: { select: { nameDe: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const LITTER_STATUS_LABELS: Record<string, string> = {
    planned: 'geplant',
    pregnant: 'trächtig',
    born: 'geboren',
    available: 'abgabebereit',
    sold_out: 'ausverkauft',
  }

  const littersForForm = litters.map((l) => ({
    id: l.id,
    breedId: l.breedId,
    label: `${l.breed.nameDe} — ${LITTER_STATUS_LABELS[l.status]}${
      l.bornDate ? ` (${l.bornDate.toLocaleDateString('de-DE')})` : ''
    }`,
  }))

  const media = listing.media.map((m) => ({
    id: m.id,
    url: m.url,
    isPrimary: m.isPrimary,
  }))

  return <InseratEditForm listing={listing} breeds={breeds} litters={littersForForm} media={media} />
}
