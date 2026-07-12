import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import ProduktVerwaltung from '@/components/ProduktVerwaltung'

export const dynamic = 'force-dynamic'

export default async function AdminProduktePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
  if (user?.role !== 'admin') redirect('/dashboard')

  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <main className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-sm text-stone-400 hover:text-forest">← Admin</Link>
            <h1 className="font-serif text-3xl font-bold text-stone-900 mt-1">Affiliate-Produkte</h1>
          </div>
        </div>
        <ProduktVerwaltung initialProducts={products.map((p) => ({
          id: p.id,
          asin: p.asin,
          name: p.name,
          imageUrl: p.imageUrl,
          category: p.category,
          description: p.description,
          affiliateTag: p.affiliateTag,
          priceCents: p.priceCents,
          isAvailable: p.isAvailable,
        }))} />
      </div>
    </main>
  )
}
