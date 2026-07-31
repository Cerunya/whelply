import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import WurfForm from '@/components/WurfForm'

export default async function WurfEintragenPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
  })
  if (!breeder) redirect('/login')

  const breeds = await prisma.breed.findMany({
    orderBy: { nameDe: 'asc' },
    select: { id: true, nameDe: true, slug: true },
  })

  const dogs = await prisma.dog.findMany({
    where: { breederId: breeder.id },
    select: { id: true, name: true, sex: true, breedId: true },
    orderBy: { name: 'asc' },
  })

  const dams = dogs.filter((d) => d.sex === 'female')
  const sires = dogs.filter((d) => d.sex === 'male')

  return <WurfForm breeds={breeds} dams={dams} sires={sires} />
}
