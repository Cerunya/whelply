'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import DashboardIcon from './DashboardIcon'
import { signOutAction } from '@/app/actions/auth'

type Props = {
  kennelName: string
  city: string | null
  plan: string
  unreadCount: number
  isAdmin: boolean
  children: React.ReactNode
}

const navItems = [
  { label: 'Übersicht', href: '/dashboard', icon: 'overview' as const, match: (path: string) => path === '/dashboard' },
  { label: 'Würfe', href: '/dashboard#wuerfe', icon: 'litter' as const, match: (path: string) => path.includes('/wurf') },
  { label: 'Meine Hunde', href: '/dashboard#hunde', icon: 'dog' as const, match: (path: string) => path.includes('/hund') || path.includes('/ruede') },
  { label: 'Inserate', href: '/dashboard#inserate', icon: 'listing' as const, match: (path: string) => path.includes('/inserat') || path.includes('/boost') || path.includes('/upgrade') },
  { label: 'Züchterseite', href: '/dashboard#zuechterseite', icon: 'profile' as const, match: (path: string) => ['/profil', '/theme', '/ueber-uns', '/news', '/galerie'].some(part => path.includes(part)) },
]

const pageTitles: Array<[string, string]> = [
  ['/nachrichten', 'Nachrichten'], ['/inserat-importieren', 'Inserat importieren'], ['/inserat-erstellen', 'Neues Inserat'],
  ['/inserat/', 'Inserat bearbeiten'], ['/wurf-eintragen', 'Wurf eintragen'], ['/wurf/', 'Wurf verwalten'],
  ['/hund-eintragen', 'Zuchthund eintragen'], ['/hund/', 'Zuchthund bearbeiten'], ['/ruede-eintragen', 'Deckrüde eintragen'],
  ['/ueber-uns', 'Über uns'], ['/theme', 'Branding'], ['/galerie', 'Galerie'], ['/news', 'Aktuelles'],
  ['/profil', 'Profil & Verifizierung'], ['/boost', 'Topanzeige'], ['/upgrade', 'Tarif auswählen'],
]

export default function DashboardShell({ kennelName, city, plan, unreadCount, isAdmin, children }: Props) {
  const pathname = usePathname()
  if (pathname === '/dashboard' || pathname === '/dashboard/nutzer' || pathname === '/dashboard/merkliste') return children
  const title = pageTitles.find(([part]) => pathname.includes(part))?.[1] ?? 'Züchterdashboard'
  const isActive = (item: typeof navItems[number]) => item.match(pathname)
  const messagesActive = pathname.includes('/nachrichten')

  return <div className="min-h-screen bg-[#F7F5EF] font-sans text-stone-800">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-[#122619] px-4 py-6 text-white lg:flex">
      <Link href="/" className="mb-8 flex items-center gap-3 px-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-honey text-forest-dark"><DashboardIcon name="litter" /></span><span><span className="block font-serif text-2xl font-bold">Whelply</span><span className="block text-[10px] text-white/60">Züchterdashboard</span></span></Link>
      <nav className="space-y-1.5" aria-label="Dashboard-Navigation">
        {navItems.map(item => <Link key={item.label} href={item.href} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${isActive(item) ? 'bg-cream text-forest' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}><DashboardIcon name={item.icon} className="h-[19px] w-[19px]" />{item.label}</Link>)}
        <Link href="/dashboard/nachrichten" className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${messagesActive ? 'bg-cream text-forest' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}><DashboardIcon name="messages" className="h-[19px] w-[19px]" /><span className="flex-1">Nachrichten</span>{unreadCount > 0 && <span className="rounded-full bg-honey px-2 py-0.5 text-[10px] font-bold text-forest-dark">{unreadCount > 9 ? '9+' : unreadCount}</span>}</Link>
      </nav>
      <div className="mt-auto space-y-1 border-t border-white/10 pt-5">
        <Link href="/dashboard/profil" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs font-medium text-white/65 hover:bg-white/10 hover:text-white"><DashboardIcon name="settings" className="h-[18px] w-[18px]" />Einstellungen</Link>
        <Link href="/" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs font-medium text-white/65 hover:bg-white/10 hover:text-white"><DashboardIcon name="website" className="h-[18px] w-[18px]" />Zur Website</Link>
        {isAdmin && <Link href="/admin" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs font-semibold text-honey-light hover:bg-white/10">Admin</Link>}
        <div className="mt-4 flex items-center gap-3 border-t border-white/10 px-3 pt-4"><span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-honey text-xs font-bold text-forest-dark">{kennelName.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{kennelName}</p><p className="mt-0.5 text-[10px] capitalize text-white/50">{plan} Plan</p></div></div>
        <form action={signOutAction}><button type="submit" className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-3 text-xs font-semibold text-white/80 transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white"><DashboardIcon name="logout" className="h-4 w-4" />Abmelden</button></form>
      </div>
    </aside>

    <div className="lg:pl-60">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-cream-deep bg-cream px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest text-white"><DashboardIcon name="litter" className="h-[18px] w-[18px]" /></span><span className="font-serif text-2xl font-bold text-forest">Whelply</span></Link>
        <div className="flex items-center gap-1"><Link href="/dashboard/nachrichten" className="relative flex h-11 w-11 items-center justify-center text-stone-600" aria-label="Nachrichten"><DashboardIcon name="mail" className="h-5 w-5" />{unreadCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-honey" />}</Link><Link href="/dashboard/profil" className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-[10px] font-bold text-white" aria-label="Profil öffnen">{kennelName.slice(0, 2).toUpperCase()}</Link></div>
      </header>
      <header className="hidden h-[68px] items-center justify-between border-b border-cream-deep bg-white px-8 lg:flex">
        <div><p className="text-sm font-semibold text-stone-700">{title}</p><p className="mt-0.5 text-[10px] text-stone-400">{kennelName}{city ? ` · ${city}` : ''}</p></div>
        <div className="flex items-center gap-3">{isAdmin && <Link href="/admin" className="text-xs font-semibold text-honey">Admin</Link>}<Link href="/dashboard/nachrichten" className="relative flex h-11 w-11 items-center justify-center rounded-xl text-stone-500 hover:bg-cream" aria-label="Nachrichten"><DashboardIcon name="mail" className="h-5 w-5" />{unreadCount > 0 && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-honey" />}</Link><Link href="/dashboard/profil" className="flex min-h-11 items-center gap-2 rounded-xl px-2 hover:bg-cream"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-[10px] font-bold text-white">{kennelName.slice(0, 2).toUpperCase()}</span><span className="text-xs font-semibold">{kennelName}</span></Link></div>
      </header>
      <div className="pb-24 lg:pb-0">{children}</div>
    </div>

    <nav className="fixed inset-x-0 bottom-0 z-40 flex min-h-[70px] items-start justify-around border-t border-cream-deep bg-white px-1 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 lg:hidden" aria-label="Mobile Dashboard-Navigation">
      {navItems.map(item => <Link key={item.label} href={item.href} className={`flex min-w-[58px] flex-col items-center gap-1 rounded-lg px-2 py-1.5 ${isActive(item) ? 'text-forest' : 'text-stone-400'}`}><DashboardIcon name={item.icon} className="h-5 w-5" /><span className="text-[9px] font-medium">{item.label === 'Meine Hunde' ? 'Hunde' : item.label === 'Züchterseite' ? 'Profil' : item.label}</span></Link>)}
    </nav>
  </div>
}
