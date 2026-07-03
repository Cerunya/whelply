import Link from 'next/link'
import { signOutAction } from '@/app/actions/auth'

type Props = {
  title: string
  backHref?: string
  backLabel?: string
  action?: React.ReactNode
}

export default function DashboardHeader({ title, backHref = '/dashboard', backLabel = 'Dashboard', action }: Props) {
  return (
    <header className="bg-white border-b border-cream-deep sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-4">
        <Link href="/" className="font-serif font-bold text-stone-900 text-base flex-shrink-0">
          Whelply
        </Link>
        <span className="text-stone-200">|</span>
        <Link
          href={backHref}
          className="text-sm text-stone-400 hover:text-stone-700 transition-colors flex items-center gap-1.5 flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {backLabel}
        </Link>
        <span className="text-stone-200">|</span>
        <h1 className="font-semibold text-stone-800 text-sm flex-1">{title}</h1>
        {action && <div className="flex-shrink-0">{action}</div>}
        <form action={signOutAction}>
          <button type="submit" className="text-sm text-stone-400 hover:text-stone-700 transition-colors flex-shrink-0">
            Abmelden
          </button>
        </form>
      </div>
    </header>
  )
}
