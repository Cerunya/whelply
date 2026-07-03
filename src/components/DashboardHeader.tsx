import Link from 'next/link'
import { signOut } from '@/lib/auth'

export default function DashboardHeader({ title }: { title: string }) {
  return (
    <header className="bg-white border-b border-cream-deep sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="text-sm text-stone-400 hover:text-stone-700 transition-colors flex items-center gap-1.5 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </Link>

        <h1 className="font-semibold text-stone-800 text-sm">{title}</h1>

        <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }) }}>
          <button type="submit" className="text-sm text-stone-400 hover:text-stone-700 transition-colors flex-shrink-0">
            Abmelden
          </button>
        </form>
      </div>
    </header>
  )
}
