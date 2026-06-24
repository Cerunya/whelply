import Link from 'next/link'
import { auth, signOut } from '@/lib/auth'

export default async function BreederNavbar() {
  const session = await auth()

  return (
    <nav className="h-10 bg-white/70 backdrop-blur-sm border-b border-stone-200/60 flex items-center px-4 justify-between sticky top-0 z-50">
      <Link href="/" className="font-serif font-bold text-stone-700 text-sm tracking-wide hover:text-forest transition-colors">
        Whelply
      </Link>
      <div className="flex items-center gap-4">
        {session ? (
          <>
            <Link href="/dashboard" className="text-xs text-stone-500 hover:text-stone-800 transition-colors font-medium">
              Dashboard
            </Link>
            <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }) }}>
              <button type="submit" className="text-xs text-stone-400 hover:text-stone-700 transition-colors">
                Abmelden
              </button>
            </form>
          </>
        ) : (
          <Link href="/login" className="text-xs text-stone-500 hover:text-stone-800 transition-colors font-medium">
            Anmelden
          </Link>
        )}
      </div>
    </nav>
  )
}
