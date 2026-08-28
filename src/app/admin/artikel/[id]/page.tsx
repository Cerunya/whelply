import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import DashboardHeader from '@/components/DashboardHeader'
import ArtikelEditor from '@/components/ArtikelEditor'

export const dynamic = 'force-dynamic'

export default async function AdminArtikelEditPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.role !== 'admin') redirect('/')

  const isNew = params.id === 'neu'
  const article = isNew ? null : await prisma.article.findUnique({ where: { id: params.id } })
  if (!isNew && !article) notFound()

  const breedsRaw = await prisma.breed.findMany({ select: { id: true, nameDe: true, slug: true }, orderBy: { nameDe: 'asc' } })
  const breeds = breedsRaw.map((b) => ({ id: String(b.id), nameDe: b.nameDe, slug: b.slug }))

  const productsRaw = await prisma.product.findMany({ where: { isAvailable: true }, select: { id: true, name: true, asin: true }, orderBy: { name: 'asc' } })

  let categories: { id: string; slug: string; name: string }[] = []
  try {
    categories = await prisma.articleCategory.findMany({ select: { id: true, slug: true, name: true }, orderBy: { sortOrder: 'asc' } })
  } catch {}

  return (
    <>
      <DashboardHeader title={isNew ? 'Neuer Artikel' : 'Artikel bearbeiten'} backHref="/admin/artikel" backLabel="Artikel" />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ArtikelEditor
          article={article ? {
            id: article.id,
            slug: article.slug,
            title: article.title,
            excerpt: article.excerpt ?? '',
            content: article.content,
            category: article.category,
            coverImageUrl: article.coverImageUrl ?? '',
            metaTitle: article.metaTitle ?? '',
            metaDescription: article.metaDescription ?? '',
            breedId: article.breedId ? String(article.breedId) : '',
            authorName: article.authorName ?? '',
            isPublished: article.isPublished,
            sidebarProductId: (article as any).sidebarProductId ?? '',
          } : undefined}
          breeds={breeds}
          products={productsRaw}
          categories={categories}
        />
      </div>
    </>
  )
}
