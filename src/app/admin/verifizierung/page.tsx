import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import VerifizierungAdmin from '@/components/VerifizierungAdmin'

export const dynamic = 'force-dynamic'

export default async function AdminVerifizierungPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.role !== 'admin') redirect('/')

  const pending = await prisma.breederProfile.findMany({
    where: {
      verificationDocKey: { not: null },
      verificationLevel: 'kennel_verified',
    },
    select: {
      id: true,
      kennelName: true,
      verband: true,
      mitgliedsnummer: true,
      verificationDocKey: true,
      verificationRequestedAt: true,
      user: { select: { email: true } },
    },
    orderBy: { verificationRequestedAt: 'asc' },
  })

  const idPending = await prisma.breederProfile.findMany({
    where: { idDocKey: { not: null } },
    select: {
      id: true,
      kennelName: true,
      fullName: true,
      idDocKey: true,
      idDocBackKey: true,
      idDocRequestedAt: true,
      user: { select: { email: true } },
    },
    orderBy: { idDocRequestedAt: 'asc' },
  })

  const totalOpen = pending.length + idPending.length

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-2xl font-bold text-stone-900">Verifizierungen</h1>
            <p className="text-sm text-stone-500 mt-1">
              {totalOpen} ausstehend ({idPending.length} ID-Prüfung{idPending.length === 1 ? '' : 'en'}, {pending.length} Züchterstatus)
            </p>
          </div>
          <a href="/admin" className="text-sm text-forest hover:underline">← Admin-Dashboard</a>
        </div>

        {totalOpen === 0 ? (
          <div className="bg-white rounded-2xl border border-cream-deep p-12 text-center">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-stone-600 font-medium">Keine offenen Verifizierungen</p>
          </div>
        ) : (
          <VerifizierungAdmin
            pending={pending.map((p) => ({
              id: p.id,
              kennelName: p.kennelName,
              email: p.user.email,
              verband: p.verband,
              mitgliedsnummer: p.mitgliedsnummer,
              docKey: p.verificationDocKey!,
              requestedAt: p.verificationRequestedAt?.toISOString() ?? '',
            }))}
            idPending={idPending.map((p) => ({
              id: p.id,
              kennelName: p.kennelName,
              fullName: p.fullName,
              email: p.user.email,
              docKey: p.idDocKey!,
              backKey: p.idDocBackKey,
              requestedAt: p.idDocRequestedAt?.toISOString() ?? '',
            }))}
          />
        )}
      </div>
    </div>
  )
}
