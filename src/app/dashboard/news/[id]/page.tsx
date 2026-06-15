import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import NewsPostForm from '@/components/NewsPostForm'

export default async function NewsEditPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
  })
  if (!breeder) redirect('/login')

  const post = await prisma.newsPost.findUnique({
    where: { id: params.id },
    include: { media: { take: 1, select: { id: true, url: true } } },
  })

  if (!post || post.breederId !== breeder.id) notFound()

  return (
    <NewsPostForm
      post={{
        id: post.id,
        title: post.title,
        content: post.content,
        imageUrl: post.media[0]?.url ?? null,
        mediaId: post.media[0]?.id ?? null,
      }}
    />
  )
}
