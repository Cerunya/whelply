import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import GalleryManager from '@/components/GalleryManager'

export default async function GaleriePage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
  })
  if (!breeder) redirect('/login')

  const images = await prisma.media.findMany({
    where: { breederId: breeder.id, purpose: 'gallery' },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, url: true },
  })

  return (
    <div className="min-h-screen bg-cream font-sans">
      <header className="bg-white border-b border-cream-deep sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/dashboard" className="text-stone-400 hover:text-stone-700 transition-colors text-sm">
            ← Dashboard
          </Link>
          <span className="text-stone-300">|</span>
          <h1 className="font-semibold text-stone-800 text-sm">Galerie</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-1">Galerie</h1>
          <p className="text-stone-400 text-sm">
            Fotos rund um deinen Zwinger — erscheinen auf deiner öffentlichen Züchterseite unter "Galerie".
          </p>
        </div>

        <GalleryManager initialImages={images} />
      </main>
    </div>
  )
}
