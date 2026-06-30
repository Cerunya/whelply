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
        fullName: breeder.fullName ?? '',
        showFullName: breeder.showFullName ?? false,
        bio: breeder.bio,
        website: breeder.website,
        socialInstagram: breeder.socialInstagram,
        socialFacebook: breeder.socialFacebook,
        socialTiktok: breeder.socialTiktok,
        socialYoutube: breeder.socialYoutube,
        verband: breeder.verband,
        mitgliedsnummer: breeder.mitgliedsnummer,
        phone: breeder.phone,
        street: breeder.street,
        zip: breeder.zip,
        city: breeder.city,
        state: breeder.state,
        showPhone: breeder.showPhone,
        showAddress: breeder.showAddress,
        isPublished: breeder.isPublished ?? true,
      }}
    />
  )
}
