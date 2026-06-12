import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ProfilForm from '@/components/ProfilForm'

export default async function ProfilPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
  })
  if (!breeder) redirect('/login')

  return (
    <ProfilForm
      breeder={{
        kennelName: breeder.kennelName,
        displayName: breeder.displayName,
        bio: breeder.bio,
        website: breeder.website,
        verband: breeder.verband,
        mitgliedsnummer: breeder.mitgliedsnummer,
        phone: breeder.phone,
        street: breeder.street,
        zip: breeder.zip,
        city: breeder.city,
        state: breeder.state,
      }}
    />
  )
}
