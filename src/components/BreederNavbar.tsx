import { auth, signOut } from '@/lib/auth'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://whelply.de'

export default async function BreederNavbar() {
  const session = await auth()
  return (
    <nav className="h-10 bg-white/70 backdrop-blur-sm border-b border-stone-200/60 flex items-center px-4 justify-between sticky top-0 z-50">
      <a href={BASE} className="font-serif font-bold text-stone-700 text-sm tracking-wide hover:text-forest transition-colors">
        Whelply
      </a>
      <div className="flex items-center gap-4">
        {session ? (
          <>
            <a href={`${BASE}/dashboard`} className="text-xs text-stone-500 hover:text-stone-800 transition-colors font-medium">
              Dashboard
            </a>
            <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }) }}>
              <button type="submit" className="text-xs text-stone-400 hover:text-stone-700 transition-colors">
                Abmelden
              </button>
            </form>
          </>
        ) : (
          <a href={`${BASE}/login`} className="text-xs text-stone-500 hover:text-stone-800 transition-colors font-medium">
            Anmelden
          </a>
        )}
      </div>
    </nav>
  )
}
