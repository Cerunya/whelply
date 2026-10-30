import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import WelpeForm from '@/components/WelpeForm'

export default async function WelpeHinzufuegenPage({
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
    include: { breed: { select: { nameDe: true } }, _count: { select: { listings: true } } },
  })

  if (!litter || litter.breederId !== breeder.id) notFound()

  return (
    <WelpeForm
      hasPuppies={litter._count.listings > 0}
      litter={{
        id: litter.id,
        breedId: litter.breedId,
        breedName: litter.breed.nameDe,
        bornDate: litter.bornDate?.toISOString().slice(0, 10) ?? null,
        care: {
          hasPedigree: litter.hasPedigree,
          isVaccinated: litter.isVaccinated,
          isDewormed: litter.isDewormed,
          isChipped: litter.isChipped,
          isInsured: litter.isInsured,
          trainingMedical: litter.trainingMedical,
          trainingCharaktertest: litter.trainingCharaktertest,
          trainingAndereTiere: litter.trainingAndereTiere,
          trainingHaushaltsgeraeusche: litter.trainingHaushaltsgeraeusche,
          trainingKinder: litter.trainingKinder,
          trainingAutofahren: litter.trainingAutofahren,
          trainingBelebteOrte: litter.trainingBelebteOrte,
          trainingNotes: litter.trainingNotes ?? '',
        },
      }}
    />
  )
}
