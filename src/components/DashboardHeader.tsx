import Link from 'next/link'

type Props = {
  title: string
  backHref?: string
  backLabel?: string
  action?: React.ReactNode
}

export default function DashboardHeader({ title, backHref = '/dashboard', backLabel = 'Dashboard', action }: Props) {
  return (
    <header className="border-b border-cream-deep bg-cream">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-6 sm:px-6 lg:px-8">
        <Link href={backHref} className="flex min-h-10 items-center gap-1.5 text-xs font-semibold text-stone-400 transition-colors hover:text-forest">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {backLabel}
        </Link>
        <h1 className="flex-1 font-serif text-2xl font-bold text-forest sm:text-3xl">{title}</h1>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </header>
  )
}
