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
          }} />
        </div>
      </main>
    </>
  )
}
