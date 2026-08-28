import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import DashboardHeader from '@/components/DashboardHeader'
import KategorienManager from '@/components/KategorienManager'

export const dynamic = 'force-dynamic'

export default async function KategorienPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user || user.role !== 'admin') redirect('/')

  let categories: { id: string; slug: string; name: string; description: string | null; sortOrder: number }[] = []
  try {
    categories = await prisma.articleCategory.findMany({ orderBy: { sortOrder: 'asc' } })
  } catch {}

  return (
    <>
      <DashboardHeader title="Artikel-Kategorien" backHref="/admin" backLabel="Admin" />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <KategorienManager initialCategories={categories} />
      </div>
    </>
  )
}
