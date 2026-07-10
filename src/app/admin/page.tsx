import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/AdminDashboard'

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.role !== 'admin') redirect('/')

  const [breeders, listings, users, stats, reports, nonBreederUsers, dogs] = await Promise.all([
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
    prisma.report.findMany({
      include: {
        user: { select: { email: true } },
        listing: { include: { breeder: { select: { kennelName: true } }, breed: { select: { nameDe: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.findMany({
      where: { role: { not: 'admin' } },
      select: { id: true, email: true, displayName: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.dog.findMany({
      include: {
        breed: { select: { nameDe: true } },
        breeder: { select: { kennelName: true } },
        listings: { select: { type: true, status: true }, take: 1 },
        media: { take: 1, select: { url: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
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
      reports={reports.map((r) => ({
        id: r.id,
        reason: r.reason,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
        reporterEmail: r.user.email,
        listingId: r.listingId,
        listingBreed: r.listing.breed.nameDe,
        kennelName: r.listing.breeder.kennelName,
      }))}
      allUsers={nonBreederUsers.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
      }))}
      dogs={dogs.map((d) => ({
        id: d.id,
        name: d.name,
        sex: d.sex,
        isStud: d.isStud,
        breedName: d.breed.nameDe,
        kennelName: d.breeder?.kennelName ?? '—',
        listingType: d.listings[0]?.type ?? null,
        imageUrl: d.media[0]?.url ?? null,
        createdAt: d.createdAt.toISOString(),
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
