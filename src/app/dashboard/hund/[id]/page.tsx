import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import HundEditForm from '@/components/HundEditForm'

export default async function HundBearbeitenPage({
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

  const dog = await prisma.dog.findUnique({
    where: { id: params.id },
    include: {
      media: { take: 1, select: { url: true } },
    },
  })

  if (!dog || dog.breederId !== breeder.id) notFound()

  const breeds = await prisma.breed.findMany({
    orderBy: { nameDe: 'asc' },
    select: { id: true, nameDe: true },
  })

  return (
    <HundEditForm
      dog={{
        id: dog.id,
        name: dog.name,
        breedId: dog.breedId,
        sex: dog.sex,
        birthDate: dog.birthDate?.toISOString().slice(0, 10) ?? null,
        color: dog.color,
        pedigreeNumber: dog.pedigreeNumber,
        titles: dog.titles,
        isStud: dog.isStud,
        description: dog.description,
        imageUrl: dog.media[0]?.url ?? null,
        healthInfo: dog.healthInfo,
      }}
      breeds={breeds}
    />
  )
}
