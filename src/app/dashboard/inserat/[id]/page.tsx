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
    include: { breed: true },
  })

  if (!listing || listing.breederId !== breeder.id) notFound()

  const breeds = await prisma.breed.findMany({
    orderBy: { nameDe: 'asc' },
    select: { id: true, nameDe: true },
  })

  return <InseratEditForm listing={listing} breeds={breeds} />
}
