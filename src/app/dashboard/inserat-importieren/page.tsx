import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import InseratImport from '@/components/InseratImport'

export const dynamic = 'force-dynamic'

export default async function InseratImportierenPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const breeder = await prisma.breederProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } })
  if (!breeder) redirect('/dashboard')
  const breeds = await prisma.breed.findMany({ select: { id: true, nameDe: true }, orderBy: { nameDe: 'asc' } })
  return <InseratImport breeds={breeds} />
}
