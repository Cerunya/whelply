import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/lib/auth'

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-gray-900">
          Whelply
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {session.user.kennelName ?? session.user.email}
          </span>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/' })
            }}
          >
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Abmelden
            </button>
          </form>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Willkommen, {session.user.kennelName ?? 'Züchter'}
        </h1>
        <p className="text-gray-500 mb-8">
          Dein Züchter-Dashboard — hier verwaltest du deine Inserate und Würfe.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Aktive Inserate</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Würfe</p>
            <p className="text-3xl font-bold text-gray-900">0</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Plan</p>
            <p className="text-xl font-bold text-gray-900">Kostenlos</p>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Schnellzugriff</h2>
          <div className="flex flex-wrap gap-3">
            <button
              disabled
              className="bg-gray-900 text-white rounded-lg px-4 py-2 text-sm font-medium opacity-40 cursor-not-allowed"
            >
              + Neues Inserat
            </button>
            <button
              disabled
              className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 opacity-40 cursor-not-allowed"
            >
              + Neuen Wurf eintragen
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Inserate und Würfe kommen im nächsten Update.
          </p>
        </div>
      </div>
    </main>
  )
}
