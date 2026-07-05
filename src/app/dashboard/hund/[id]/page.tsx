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
      media: { orderBy: { sortOrder: 'asc' }, select: { id: true, url: true, isPrimary: true, sortOrder: true, purpose: true } },
    },
  })

  if (!dog || dog.breederId !== breeder.id) notFound()

  const breeds = await prisma.breed.findMany({
    orderBy: { nameDe: 'asc' },
    select: { id: true, nameDe: true },
  })

  // Alle Hunde aller Züchter für Elterntier-Auswahl (Stammbaum kann züchterübergreifend sein)
  // Nur Zuchthunde (isStud=true) als Elterntier-Auswahl — keine Welpen
  const allDogs = await prisma.dog.findMany({
    where: { isStud: true },
    select: { id: true, name: true, sex: true },
    orderBy: { name: 'asc' },
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
        media: dog.media,
        healthInfo: dog.healthInfo,
        parentSireId: dog.parentSireId,
        parentDamId: dog.parentDamId,
      }}
      breeds={breeds}
      allDogs={allDogs}
    />
  )
}
