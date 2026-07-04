import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import NutzerNameForm from '@/components/NutzerNameForm'

export const dynamic = 'force-dynamic'

export default async function NutzerDashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, role: true, displayName: true, createdAt: true },
  })
  if (!user) redirect('/login')

  const bookmarkCount = await prisma.bookmark.count({ where: { userId: session.user.id } })
  const unreadCount = await prisma.message.count({
    where: {
      senderRole: 'breeder',
      readAt: null,
      conversation: { userId: session.user.id },
    },
  })

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-2xl mx-auto px-4 py-12">

          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="font-serif text-3xl font-bold text-stone-900 mb-1">
                {user.displayName ?? 'Mein Konto'}
              </h1>
              <p className="text-stone-400 text-sm">{user.email}</p>
            </div>
            <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }) }}>
              <button type="submit" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
                Abmelden
              </button>
            </form>
          </div>

          {/* Name bearbeiten */}
          <div className="bg-white rounded-2xl border border-cream-deep p-6 mb-4">
            <h2 className="font-semibold text-stone-800 text-sm mb-3">Mein Name</h2>
            <NutzerNameForm initialName={user.displayName ?? ''} />
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 gap-4 mb-8">
            <Link href="/dashboard/merkliste"
              className="bg-white rounded-2xl border border-cream-deep p-6 hover:border-forest/30 hover:shadow-sm transition-all flex items-center justify-between">
              <div>
                <p className="font-semibold text-stone-900">Meine Merkliste</p>
                <p className="text-sm text-stone-400 mt-0.5">{bookmarkCount} {bookmarkCount === 1 ? 'Eintrag' : 'Einträge'} gespeichert</p>
              </div>
              <svg className="w-5 h-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link href="/dashboard/nachrichten"
              className="relative bg-white rounded-2xl border border-cream-deep p-6 hover:border-forest/30 hover:shadow-sm transition-all flex items-center justify-between">
              <div>
                <p className="font-semibold text-stone-900">Nachrichten</p>
                <p className="text-sm text-stone-400 mt-0.5">Deine Konversationen mit Züchtern</p>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount} neu
                  </span>
                )}
                <svg className="w-5 h-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link href="/welpen"
              className="bg-white rounded-2xl border border-cream-deep p-6 hover:border-forest/30 hover:shadow-sm transition-all flex items-center justify-between">
              <div>
                <p className="font-semibold text-stone-900">Welpen entdecken</p>
                <p className="text-sm text-stone-400 mt-0.5">Alle verfügbaren Welpen durchsuchen</p>
              </div>
              <svg className="w-5 h-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            <Link href="/zuechter"
              className="bg-white rounded-2xl border border-cream-deep p-6 hover:border-forest/30 hover:shadow-sm transition-all flex items-center justify-between">
              <div>
                <p className="font-semibold text-stone-900">Züchter entdecken</p>
                <p className="text-sm text-stone-400 mt-0.5">Geprüfte Züchter in ganz Deutschland</p>
              </div>
              <svg className="w-5 h-5 text-stone-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {/* Züchter werden */}
          <div className="bg-forest rounded-2xl p-6 text-white">
            <h2 className="font-serif text-lg font-bold mb-1">Als Züchter registrieren?</h2>
            <p className="text-white/70 text-sm mb-4">
              Wandle dein Konto in ein Züchter-Konto um und trage deine Würfe und Welpen ein.
            </p>
            <Link href="/dashboard/upgrade"
              className="inline-block bg-honey text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-honey-light transition-colors">
              Zu Züchter upgraden →
            </Link>
          </div>

        </div>
      </main>
    </>
  )
}
