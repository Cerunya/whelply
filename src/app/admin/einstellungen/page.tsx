import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import EinstellungenForm from '@/components/EinstellungenForm'
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
            <h1 className="font-serif text-2xl font-bold text-stone-900">Boost-Einstellungen</h1>
            <p className="text-sm text-stone-500 mt-1">Preis und Frequenz-Deckel der 24h-Topanzeige</p>
          </div>
          <a href="/admin" className="text-sm text-forest hover:underline">← Admin-Dashboard</a>
        </div>

        <EinstellungenForm
          initialPriceCents={settings.priceCents}
          initialCooldownDays={settings.cooldownDays}
        />
      </div>
    </div>
  )
}
