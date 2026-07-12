import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ProfilForm from '@/components/ProfilForm'
import PasswortAendernForm from '@/components/PasswortAendernForm'

export default async function ProfilPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      media: { where: { purpose: 'card' }, take: 1, select: { url: true } },
    },
  })
  if (!breeder) redirect('/login')

  const cardImageUrl = breeder.media[0]?.url ?? null

  return (
    <>
      <ProfilForm
        breeder={{
          kennelName: breeder.kennelName,
          displayName: breeder.displayName,
          fullName: breeder.fullName ?? '',
          showFullName: breeder.showFullName ?? false,
          bio: breeder.bio,
          cardImageUrl,
          website: breeder.website,
          socialInstagram: breeder.socialInstagram,
          socialFacebook: breeder.socialFacebook,
          socialTiktok: breeder.socialTiktok,
          socialYoutube: breeder.socialYoutube,
          verband: breeder.verband,
          mitgliedsnummer: breeder.mitgliedsnummer,
          phone: (breeder.phone ?? '').slice(0, 20),
          street: breeder.street,
          zip: breeder.zip,
          city: breeder.city,
          state: breeder.state,
          showPhone: breeder.showPhone,
          showAddress: breeder.showAddress,
          isPublished: breeder.isPublished ?? true,
          isActive: breeder.isActive ?? true,
          handoverLocation: breeder.handoverLocation ?? '',
          visitPossible: breeder.visitPossible ?? false,
          damVisitPossible: breeder.damVisitPossible ?? false,
        }}
      />
      <div className="max-w-xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-2xl border border-cream-deep p-6">
          <h2 className="font-serif text-lg font-bold text-stone-900 mb-4">Passwort ändern</h2>
          <PasswortAendernForm />
        </div>
      </div>
    </>
  )
}
