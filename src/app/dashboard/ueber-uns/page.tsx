import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import UeberUnsForm from '@/components/UeberUnsForm'

export const dynamic = 'force-dynamic'

export default async function UeberUnsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
  })
  if (!breeder) redirect('/login')

  return (
    <UeberUnsForm
      initialBio={breeder.bio ?? ''}
    />
  )
}
