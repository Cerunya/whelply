import Link from 'next/link'
import { auth } from '@/lib/auth'
import { signOut } from '@/lib/auth'

export default async function Navbar() {
  const session = await auth()

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-stone-900 tracking-tight">
            Whelply
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/welpen" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
              Welpen
            </Link>
            <Link href="/zuchter" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
              Züchter
            </Link>
            <Link href="/rassen" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
              Rassen
            </Link>
            <Link href="/dienste" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
              Dienste
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              >
                {session.user.kennelName ?? 'Dashboard'}
              </Link>
              <form
                action={async () => {
                  'use server'
                  await signOut({ redirectTo: '/' })
                }}
              >
                <button
                  type="submit"
                  className="text-sm text-stone-500 hover:text-stone-700 transition-colors"
                >
                  Abmelden
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
              >
                Anmelden
              </Link>
              <Link
                href="/register"
                className="bg-stone-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-stone-700 transition-colors font-medium"
              >
                Als Züchter registrieren
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
