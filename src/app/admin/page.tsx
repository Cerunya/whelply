import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/AdminDashboard'

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.role !== 'admin') redirect('/')

  const [breeders, listings, users, stats] = await Promise.all([
    prisma.breederProfile.findMany({
      include: {
        user: { select: { email: true, createdAt: true } },
        _count: { select: { listings: true, litters: true, dogs: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.listing.findMany({
      include: {
        breed: { select: { nameDe: true } },
        breeder: { select: { kennelName: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.user.count(),
    {
      totalListings: await prisma.listing.count(),
      activeListings: await prisma.listing.count({ where: { status: 'available' } }),
      totalViews: await prisma.listing.aggregate({ _sum: { viewCount: true } }).then((r) => r._sum.viewCount ?? 0),
    },
  ])

  return (
    <AdminDashboard
      breeders={breeders.map((b) => ({
        id: b.id,
        kennelName: b.kennelName,
        displayName: b.displayName,
        email: b.user.email,
        verificationLevel: b.verificationLevel,
        createdAt: b.createdAt.toISOString(),
        listingCount: b._count.listings,
        litterCount: b._count.litters,
        dogCount: b._count.dogs,
      }))}
      listings={listings.map((l) => ({
        id: l.id,
        title: l.title,
        breedName: l.breed.nameDe,
        kennelName: l.breeder.displayName || l.breeder.kennelName,
        status: l.status,
        viewCount: l.viewCount,
        createdAt: l.createdAt.toISOString(),
      }))}
      stats={{
        totalUsers: users,
        totalBreeders: breeders.length,
        totalListings: stats.totalListings,
        activeListings: stats.activeListings,
        totalViews: stats.totalViews,
      }}
    />
  )
}
