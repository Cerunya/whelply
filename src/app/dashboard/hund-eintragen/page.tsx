import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import HundForm from '@/components/HundForm'

export default async function HundEintragenPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
  })
  if (!breeder) redirect('/login')

  const breeds = await prisma.breed.findMany({
    orderBy: { nameDe: 'asc' },
    select: { id: true, nameDe: true },
  })

  return <HundForm breeds={breeds} />
}
