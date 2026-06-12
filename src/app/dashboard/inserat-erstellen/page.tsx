import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import InseratForm from '@/components/InseratForm'

export default async function InseratErstellenPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
    include: { subscription: true, _count: { select: { listings: { where: { status: 'available' } } } } },
  })
  if (!breeder) redirect('/login')

  // Free-Plan Limit prüfen
  const plan = breeder.subscription?.plan ?? 'free'
  if (plan === 'free' && breeder._count.listings >= 3) {
    redirect('/dashboard')
  }

  const breeds = await prisma.breed.findMany({
    orderBy: { nameDe: 'asc' },
    select: { id: true, nameDe: true },
  })

  const litters = await prisma.litter.findMany({
    where: { breederId: breeder.id },
    include: { breed: { select: { nameDe: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const littersForForm = litters.map((l) => ({
    id: l.id,
    breedId: l.breedId,
    label: `${l.breed.nameDe} — ${
      l.bornDate ? `geb. ${l.bornDate.toLocaleDateString('de-DE')}` : 'geplant'
    }`,
  }))

  return <InseratForm breeds={breeds} litters={littersForForm} />
}
