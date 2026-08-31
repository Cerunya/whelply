import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ServiceProfilForm from '@/components/ServiceProfilForm'

export const dynamic = 'force-dynamic'

export default async function ServiceProfilPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const provider = await prisma.serviceProvider.findUnique({
    where: { userId: session.user.id },
    include: { media: { select: { id: true, url: true, purpose: true }, orderBy: { sortOrder: 'asc' } } },
  })
  if (!provider) redirect('/')

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <h1 className="font-serif text-2xl font-bold text-stone-900">Profil bearbeiten</h1>
            <a href="/dashboard-service" className="text-sm text-forest hover:underline">← Dashboard</a>
          </div>
          <ServiceProfilForm provider={{
            name: provider.name,
            category: provider.category,
            description: provider.description ?? '',
            street: provider.street ?? '',
            zip: provider.zip ?? '',
            city: provider.city ?? '',
            state: provider.state ?? '',
            phone: provider.phone ?? '',
            website: provider.website ?? '',
            openingHours: (provider as any).openingHours ?? '',
            paymentMethods: (provider as any).paymentMethods ?? '',
            logoUrl: (provider as any).logoUrl ?? '',
            pageCardColor: (provider as any).pageCardColor ?? '#ffffff',
            pageTextColor: (provider as any).pageTextColor ?? '#44403c',
            pageHeadingColor: (provider as any).pageHeadingColor ?? '#1c1917',
            pageBgColor: (provider as any).pageBgColor ?? '#1e3a2f',
            pageBgFixed: (provider as any).pageBgFixed !== false,
            pageContactColor: (provider as any).pageContactColor ?? '#2d5016',
            bgUrl: provider.media.find((m) => m.purpose === 'bg')?.url ?? null,
          }} images={provider.media.filter((m) => m.purpose !== 'bg')} />
        </div>
      </main>
    </>
  )
}
