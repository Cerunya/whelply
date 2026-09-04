import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import EinstellungenForm from '@/components/EinstellungenForm'
import BildOptimierung from '@/components/BildOptimierung'
import { getBoostSettings } from '@/lib/boost'

export const dynamic = 'force-dynamic'

export default async function AdminEinstellungenPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.role !== 'admin') redirect('/')

  const settings = await getBoostSettings()

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">Einstellungen</h1>
            <p className="text-sm text-stone-500 mt-1">Boost-Preis, Frequenz-Deckel und Wartung</p>
          </div>
          <a href="/admin" className="text-sm text-forest hover:underline">← Admin-Dashboard</a>
        </div>

        <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Boost</h2>
        <EinstellungenForm
          initialPriceCents={settings.priceCents}
          initialCooldownDays={settings.cooldownDays}
        />

        <h2 className="font-serif text-lg font-bold text-stone-900 mt-10 mb-3">Bilder-Optimierung</h2>
        <BildOptimierung />
      </div>
    </div>
  )
}
