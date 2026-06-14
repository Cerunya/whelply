import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { slugify } from '@/lib/slugify'
import ThemeEditor from '@/components/ThemeEditor'

export default async function ThemePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      media: {
        where: { purpose: { in: ['header', 'background'] } },
        select: { url: true, purpose: true },
      },
    },
  })
  if (!breeder) redirect('/login')

  const headerImage = breeder.media.find((m) => m.purpose === 'header')
  const backgroundImage = breeder.media.find((m) => m.purpose === 'background')

  return (
    <ThemeEditor
      breeder={{
        subdomain: breeder.subdomain,
        themeColor: breeder.themeColor,
        themeAccentColor: breeder.themeAccentColor,
        kennelName: breeder.kennelName,
        headerImageUrl: headerImage?.url ?? null,
        backgroundImageUrl: backgroundImage?.url ?? null,
        zuechterSlug: slugify(breeder.kennelName),
      }}
    />
  )
}
