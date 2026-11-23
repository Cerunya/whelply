import { auth, signOut } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { slugify } from '@/lib/slugify'
import BreederStatusToggles from '@/components/BreederStatusToggles'
import { getBoostSettings, formatBoostPrice } from '@/lib/boost'
import OnboardingChecklist from '@/components/OnboardingChecklist'
import DashboardIcon from '@/components/DashboardIcon'

export const dynamic = 'force-dynamic'

const listingStatus = {
  available: { label: 'Aktiv', classes: 'bg-green-50 text-green-700' },
  reserved: { label: 'Reserviert', classes: 'bg-amber-50 text-amber-700' },
  sold: { label: 'Verkauft', classes: 'bg-stone-200 text-stone-600' },
  expired: { label: 'Inaktiv', classes: 'bg-red-50 text-red-700' },
  draft: { label: 'Entwurf', classes: 'bg-stone-100 text-stone-500' },
} as const

const litterStatus = {
  available: { label: 'Verfügbar', classes: 'bg-green-50 text-green-700' },
  sold_out: { label: 'Ausverkauft', classes: 'bg-stone-200 text-stone-600' },
  born: { label: 'Geboren', classes: 'bg-blue-50 text-blue-700' },
  pregnant: { label: 'Trächtig', classes: 'bg-pink-50 text-pink-700' },
  planned: { label: 'Geplant', classes: 'bg-amber-50 text-amber-700' },
} as const

function SignOutButton({ className = '' }: { className?: string }) {
  return <form action={async () => { 'use server'; await signOut({ redirectTo: '/' }) }}>
    <button type="submit" className={className}><DashboardIcon name="logout" className="h-4 w-4" />Abmelden</button>
  </form>
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true, onboardingDismissedAt: true } })
  if (!user) redirect('/login')
  if (user.role === 'service') redirect('/dashboard-service')
  if (user.role !== 'breeder' && user.role !== 'admin') redirect('/dashboard/nutzer')

  const breeder = await prisma.breederProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      listings: {
        include: { breed: { select: { nameDe: true } } },
        orderBy: { createdAt: 'desc' },
      },
      litters: {
        include: {
          breed: { select: { nameDe: true } },
          _count: { select: { listings: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      dogs: {
        where: { listings: { none: { type: 'puppy' } } },
        include: {
          breed: { select: { nameDe: true } },
          media: { take: 1, select: { url: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
      subscription: true,
      user: { select: { role: true } },
      _count: { select: { listings: true, dogs: true } },
    },
  })

  if (!breeder) redirect('/dashboard/upgrade')

  const unreadCount = await prisma.message.count({
    where: {
      readAt: null,
      OR: [
        { senderRole: 'user', conversation: { breederId: breeder.id } },
        { senderRole: 'breeder', conversation: { userId: session.user.id } },
      ],
    },
  })

  const activeListings = breeder.listings.filter((l) => l.status === 'available')
  const draftListings = breeder.listings.filter((l) => l.status === 'draft')
  const totalViews = breeder.listings.reduce((sum, l) => sum + l.viewCount, 0)
  const plan = breeder.subscription?.plan ?? 'free'
  const maxFree = 15
  const canAddMore = plan !== 'free' || activeListings.length < maxFree
  const boostSettings = await getBoostSettings()
  const boostPriceLabel = formatBoostPrice(boostSettings.priceCents)

  const onboardingItems = [
    { key: 'profil', label: 'Profil ausfüllen (Ort, Kontaktdaten)', href: '/dashboard/profil', done: !!breeder.city },
    { key: 'ueber-uns', label: '„Über uns“-Text schreiben', href: '/dashboard/ueber-uns', done: !!breeder.bio },
    { key: 'hund', label: 'Ersten Zuchthund eintragen', href: '/dashboard/hund-eintragen', done: breeder._count.dogs > 0 },
    { key: 'wurf', label: 'Ersten Wurf eintragen', href: '/dashboard/wurf-eintragen', done: breeder.litters.length > 0 },
    { key: 'inserat', label: 'Erstes Inserat erstellen', href: '/dashboard/inserat-erstellen', done: breeder._count.listings > 0 },
    { key: 'verifizierung', label: 'Verifizierung starten (ID-Check)', href: '/dashboard/profil', done: breeder.diditStatus === 'approved' || breeder.verificationLevel !== 'none' },
    { key: 'theme', label: 'Züchterseite gestalten (Theme & Branding)', href: '/dashboard/theme', done: !!breeder.themeColor },
  ]

  const navItems = [
    { label: 'Übersicht', href: '#uebersicht', icon: 'overview' as const },
    { label: 'Würfe', href: '#wuerfe', icon: 'litter' as const },
    { label: 'Meine Hunde', href: '#hunde', icon: 'dog' as const },
    { label: 'Inserate', href: '#inserate', icon: 'listing' as const },
    { label: 'Züchterseite', href: '#zuechterseite', icon: 'profile' as const },
  ]

  const stats = [
    { label: 'Aktive Inserate', value: activeListings.length, icon: 'listing' as const, note: `${breeder._count.listings} Inserate gesamt` },
    { label: 'Aktuelle Würfe', value: breeder.litters.length, icon: 'litter' as const, note: `${draftListings.length} Entwürfe` },
    { label: 'Profilaufrufe', value: totalViews.toLocaleString('de-DE'), icon: 'eye' as const, note: 'Aufrufe deiner Inserate' },
    { label: 'Verifizierung', value: breeder.verificationLevel === 'doc_verified' ? 'Verifiziert' : breeder.verificationLevel === 'kennel_verified' ? 'In Prüfung' : 'Offen', icon: 'shield' as const, note: breeder.diditStatus === 'approved' ? 'ID geprüft' : 'ID-Prüfung offen' },
    { label: 'Nachrichten', value: unreadCount, icon: 'mail' as const, note: 'Ungelesen' },
  ]

  return (
    <div className="min-h-screen bg-[#F7F5EF] font-sans text-stone-800">
      {/* Desktop: feste Seitennavigation */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-[#122619] px-4 py-6 text-white lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-3 px-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-honey text-forest-dark"><DashboardIcon name="litter" /></span>
          <span><span className="block font-serif text-2xl font-bold">Whelply</span><span className="block text-[10px] text-white/60">Züchterdashboard</span></span>
        </Link>
        <nav className="space-y-1.5" aria-label="Dashboard-Navigation">
          {navItems.map((item, index) => <Link key={item.label} href={item.href} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${index === 0 ? 'bg-cream text-forest' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}><DashboardIcon name={item.icon} className="h-[19px] w-[19px]" />{item.label}</Link>)}
          <Link href="/dashboard/nachrichten" className="flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"><DashboardIcon name="messages" className="h-[19px] w-[19px]" /><span className="flex-1">Nachrichten</span>{unreadCount > 0 && <span className="rounded-full bg-honey px-2 py-0.5 text-[10px] font-bold text-forest-dark">{unreadCount > 9 ? '9+' : unreadCount}</span>}</Link>
        </nav>
        <div className="mt-auto space-y-1 border-t border-white/10 pt-5">
          <Link href="/dashboard/profil" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs font-medium text-white/65 hover:bg-white/10 hover:text-white"><DashboardIcon name="settings" className="h-[18px] w-[18px]" />Einstellungen</Link>
          <Link href="/" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs font-medium text-white/65 hover:bg-white/10 hover:text-white"><DashboardIcon name="website" className="h-[18px] w-[18px]" />Zur Website</Link>
          {breeder.user.role === 'admin' && <Link href="/admin" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-xs font-semibold text-honey-light hover:bg-white/10">Admin</Link>}
          <div className="mt-4 flex items-center gap-3 border-t border-white/10 px-3 pt-4">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-honey text-xs font-bold text-forest-dark">{breeder.kennelName.slice(0, 2).toUpperCase()}</span>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{breeder.kennelName}</p><p className="mt-0.5 text-[10px] capitalize text-white/50">{plan} Plan</p></div>
          </div>
          <SignOutButton className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/20 px-3 text-xs font-semibold text-white/80 transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white" />
        </div>
      </aside>

      <div className="lg:pl-60">
        {/* Mobile: kompakter Kopfbereich */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-cream-deep bg-cream px-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest text-white"><DashboardIcon name="litter" className="h-[18px] w-[18px]" /></span><span className="font-serif text-2xl font-bold text-forest">Whelply</span></Link>
          <div className="flex items-center gap-1">
            <Link href="/dashboard/nachrichten" className="relative flex h-11 w-11 items-center justify-center text-stone-600" aria-label="Nachrichten"><DashboardIcon name="mail" className="h-5 w-5" />{unreadCount > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-honey" />}</Link>
            <Link href="/dashboard/profil" className="flex h-9 w-9 items-center justify-center rounded-full bg-forest text-[10px] font-bold text-white" aria-label="Profil öffnen">{breeder.kennelName.slice(0, 2).toUpperCase()}</Link>
          </div>
        </header>

        <section className="relative overflow-hidden bg-forest px-5 py-7 lg:hidden">
          <svg className="pointer-events-none absolute inset-0 h-full w-full text-white opacity-[0.04]" aria-hidden="true"><defs><pattern id="dashboard-paws" width="180" height="180" patternUnits="userSpaceOnUse"><g fill="currentColor" transform="translate(20 20) rotate(-18 30 30)"><ellipse cx="30" cy="40" rx="13" ry="15"/><ellipse cx="10" cy="25" rx="6" ry="8"/><ellipse cx="23" cy="14" rx="6" ry="8"/><ellipse cx="37" cy="14" rx="6" ry="8"/><ellipse cx="50" cy="25" rx="6" ry="8"/></g><g fill="currentColor" transform="translate(105 100) rotate(16 30 30)"><ellipse cx="30" cy="40" rx="13" ry="15"/><ellipse cx="10" cy="25" rx="6" ry="8"/><ellipse cx="23" cy="14" rx="6" ry="8"/><ellipse cx="37" cy="14" rx="6" ry="8"/><ellipse cx="50" cy="25" rx="6" ry="8"/></g></pattern></defs><rect width="100%" height="100%" fill="url(#dashboard-paws)" /></svg>
          <div className="relative">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-honey-light">Mein Züchterdashboard</p>
            <h1 className="font-serif text-3xl font-bold text-white">{breeder.kennelName}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-white/75"><DashboardIcon name="location" className="h-3.5 w-3.5" />{breeder.city || 'Deutschland'}<span>·</span><span className="capitalize">{plan} Plan</span></p>
            <div className="mt-5 [&_button]:border-white/20 [&_button]:text-white"><BreederStatusToggles initialPublished={breeder.isPublished ?? true} initialActive={breeder.isActive ?? true} /></div>
          </div>
        </section>

        {/* Desktop: obere Leiste */}
        <header className="hidden h-[68px] items-center justify-between border-b border-cream-deep bg-white px-8 lg:flex">
          <p className="text-sm font-semibold text-stone-700">Übersicht</p>
          <div className="flex items-center gap-3">
            {breeder.user.role === 'admin' && <Link href="/admin" className="text-xs font-semibold text-honey">Admin</Link>}
            <Link href="/dashboard/nachrichten" className="relative flex h-11 w-11 items-center justify-center rounded-xl text-stone-500 hover:bg-cream" aria-label="Nachrichten"><DashboardIcon name="mail" className="h-5 w-5" />{unreadCount > 0 && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-honey" />}</Link>
            <Link href="/dashboard/profil" className="flex min-h-11 items-center gap-2 rounded-xl px-2 hover:bg-cream"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-[10px] font-bold text-white">{breeder.kennelName.slice(0, 2).toUpperCase()}</span><span className="text-xs font-semibold">{breeder.kennelName}</span></Link>
          </div>
        </header>

        <main id="uebersicht" className="mx-auto max-w-[1440px] scroll-mt-24 px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <div className="mb-7 hidden items-center justify-between gap-6 lg:flex">
            <div><p className="mb-1 text-xs text-stone-500">Willkommen zurück</p><h1 className="font-serif text-3xl font-bold text-forest">Dein Zwinger auf einen Blick.</h1><p className="mt-2 text-xs text-stone-400">{breeder.kennelName}{breeder.city ? ` · ${breeder.city}` : ''} · <span className="capitalize">{plan} Plan</span>{plan === 'free' && ` · ${activeListings.length}/${maxFree} aktive Inserate`}</p></div>
            {canAddMore && <Link href="/dashboard/inserat-erstellen" className="flex min-h-11 items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-forest-light"><DashboardIcon name="plus" className="h-4 w-4" />Neues Inserat</Link>}
          </div>

          {/* Kennzahlen */}
          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-5 lg:gap-4">
            {stats.map((stat) => <div key={stat.label} className="rounded-2xl border border-cream-deep bg-white p-4 shadow-[0_3px_12px_rgba(27,58,45,0.025)] lg:p-5"><div className="flex items-center justify-between gap-2 text-stone-400"><span className="text-[11px] font-medium text-stone-500">{stat.label}</span><DashboardIcon name={stat.icon} className="h-[18px] w-[18px]" /></div>{stat.label === 'Verifizierung' ? <p className="mt-3"><span className={`inline-flex rounded-full px-3 py-1.5 text-sm font-bold ${stat.value === 'Verifiziert' ? 'bg-green-50 text-green-700' : stat.value === 'In Prüfung' ? 'bg-amber-50 text-amber-700' : 'bg-stone-100 text-stone-600'}`}>{stat.value}</span></p> : <p className="mt-2 font-serif text-2xl font-bold text-forest lg:mt-3 lg:text-3xl">{stat.value}</p>}<p className="mt-1 text-[10px] text-stone-400">{stat.note}</p></div>)}
          </div>

          {/* Zentrale Aktionen */}
          <section className="mb-6 rounded-2xl bg-[#EAF3EC] p-4 lg:p-5" aria-labelledby="dashboard-actions">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div><h2 id="dashboard-actions" className="font-serif text-lg font-bold text-forest">Was möchtest du eintragen?</h2><p className="mt-1 text-xs text-stone-500">Der schnellste Weg zu deinen wichtigsten Aufgaben.</p></div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                {canAddMore ? <Link href="/dashboard/inserat-erstellen" className="col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-xs font-bold text-white hover:bg-forest-light sm:col-span-1 lg:hidden xl:flex"><DashboardIcon name="plus" className="h-4 w-4" />Neues Inserat</Link> : <div className="col-span-2 flex items-center gap-3 rounded-xl border border-honey/30 bg-honey-pale px-4 py-2.5 sm:col-span-1"><p className="text-xs text-stone-700">Free-Limit erreicht ({maxFree} Inserate)</p><Link href="/dashboard/upgrade" className="text-xs font-bold text-honey">Pro werden →</Link></div>}
                <Link href="/dashboard/wurf-eintragen" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-forest/15 bg-white px-3 py-2.5 text-xs font-bold text-forest hover:border-forest/35"><DashboardIcon name="litter" className="h-4 w-4" />Wurf eintragen</Link>
                <Link href="/dashboard/hund-eintragen" className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-forest/15 bg-white px-3 py-2.5 text-xs font-bold text-forest hover:border-forest/35"><DashboardIcon name="dog" className="h-4 w-4" />Zuchthund eintragen</Link>
                <Link href="/dashboard/inserat-importieren" className="col-span-2 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-forest/15 bg-white px-3 py-2.5 text-xs font-bold text-forest hover:border-forest/35 sm:col-span-1"><DashboardIcon name="import" className="h-4 w-4" />Import<span className="rounded bg-honey/15 px-1.5 py-0.5 text-[9px] uppercase text-honey">Beta</span></Link>
              </div>
            </div>
          </section>

          {!user.onboardingDismissedAt && <div className="mb-7"><OnboardingChecklist title="Erste Schritte auf Whelply" subtitle="Richte deinen Zwinger ein — so finden dich Welpeninteressenten" items={onboardingItems} /></div>}

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div className="min-w-0 space-y-7">
              {/* Würfe */}
              <section id="wuerfe" className="scroll-mt-24 rounded-2xl border border-cream-deep bg-white p-4 sm:p-5">
                <div className="mb-4 flex items-start justify-between gap-4"><div><h2 className="font-serif text-xl font-bold text-forest">Deine Würfe</h2><p className="mt-1 text-xs text-stone-400">Aktuelle und geplante Würfe</p></div><Link href="/dashboard/wurf-eintragen" className="flex min-h-10 items-center gap-1.5 text-xs font-bold text-forest hover:text-honey">Neuer Wurf<DashboardIcon name="arrow" className="h-4 w-4" /></Link></div>
                {breeder.litters.length === 0 ? <div className="rounded-xl bg-cream px-4 py-8 text-center"><p className="text-sm text-stone-400">Noch keine Würfe eingetragen.</p><Link href="/dashboard/wurf-eintragen" className="mt-3 inline-block text-xs font-bold text-forest">Ersten Wurf eintragen →</Link></div> : <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">{breeder.litters.map((litter) => { const status = litterStatus[litter.status as keyof typeof litterStatus] ?? litterStatus.planned; return <Link key={litter.id} href={`/dashboard/wurf/${litter.id}`} className="group flex min-w-0 items-center gap-3 rounded-xl border border-cream-deep bg-white p-3.5 transition-all hover:-translate-y-0.5 hover:border-forest/30"><span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#EAF3EC] text-forest"><DashboardIcon name="litter" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-sm font-semibold text-stone-800">{litter.name || litter.breed.nameDe}</h3><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${status.classes}`}>{status.label}</span></div>{litter.name && <p className="mt-1 truncate text-[11px] text-stone-400">{litter.breed.nameDe}</p>}<p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-stone-400"><DashboardIcon name="calendar" className="h-3.5 w-3.5" />{litter.bornDate ? `Geboren am ${litter.bornDate.toLocaleDateString('de-DE')}` : litter.expectedDate ? `Erwartet: ${litter.expectedDate}` : 'Geplant'}<span>·</span>{litter._count.listings} Welpe{litter._count.listings !== 1 ? 'n' : ''}</p></div><DashboardIcon name="arrow" className="h-4 w-4 flex-shrink-0 text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-forest" /></Link>})}</div>}
              </section>

              {/* Hunde */}
              <section id="hunde" className="scroll-mt-24 rounded-2xl border border-cream-deep bg-white p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-4"><h2 className="font-serif text-xl font-bold text-forest">Meine Hunde</h2><Link href="/dashboard/hund-eintragen" className="flex min-h-10 items-center gap-1.5 text-xs font-bold text-forest hover:text-honey">Hund eintragen<DashboardIcon name="plus" className="h-4 w-4" /></Link></div>
                {breeder.dogs.length === 0 ? <div className="rounded-2xl border border-cream-deep bg-white px-4 py-8 text-center"><p className="text-sm text-stone-400">Noch keine Zuchthunde eingetragen.</p><Link href="/dashboard/hund-eintragen" className="mt-3 inline-block text-xs font-bold text-forest">Ersten Zuchthund eintragen →</Link></div> : <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">{breeder.dogs.map((dog) => <Link key={dog.id} href={`/dashboard/hund/${dog.id}`} className="flex min-w-0 items-center gap-3 rounded-xl border border-cream-deep bg-white p-3 transition-colors hover:border-forest/30"><span className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream-dark text-stone-300">{dog.media[0]?.url ? <img src={dog.media[0].url} alt={dog.name} className="h-full w-full object-cover" /> : <DashboardIcon name="dog" />}</span><span className="min-w-0 flex-1"><strong className="block truncate text-sm font-semibold text-stone-800">{dog.name}</strong><span className="mt-1 block truncate text-[10px] text-stone-400">{dog.sex === 'male' ? 'Rüde · Deckrüde' : 'Hündin · Zuchthündin'}</span><span className="mt-0.5 block truncate text-[10px] text-stone-400">{dog.breed.nameDe}</span></span><DashboardIcon name="arrow" className="h-4 w-4 flex-shrink-0 text-stone-300" /></Link>)}</div>}
              </section>

              {/* Inserate */}
              <section id="inserate" className="scroll-mt-24 overflow-hidden rounded-2xl border border-cream-deep bg-white">
                <div className="flex items-center justify-between border-b border-cream-deep px-5 py-4"><div><h2 className="font-serif text-xl font-bold text-forest">Meine Inserate</h2><p className="mt-1 text-xs text-stone-400">Status, Aufrufe und Boosts verwalten</p></div><Link href="/dashboard/inserat-erstellen" className="hidden min-h-10 items-center gap-1.5 text-xs font-bold text-forest hover:text-honey sm:flex">Neues Inserat<DashboardIcon name="plus" className="h-4 w-4" /></Link></div>
                {breeder.listings.length === 0 ? <div className="px-4 py-14 text-center"><p className="mb-3 text-sm text-stone-400">Noch keine Inserate.</p><Link href="/dashboard/inserat-erstellen" className="text-sm font-semibold text-forest hover:underline">Erstes Inserat erstellen →</Link></div> : <>
                  <div className="hidden overflow-x-auto md:block"><table className="w-full text-sm"><thead><tr className="border-b border-cream-deep bg-cream text-left text-[10px] font-semibold uppercase tracking-wide text-stone-400"><th className="px-5 py-3">Inserat</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Aufrufe</th><th className="px-4 py-3">Preis</th><th className="px-4 py-3">Boost</th><th className="px-5 py-3" /></tr></thead><tbody className="divide-y divide-cream-deep">{breeder.listings.map((listing) => { const isBoosted = !!listing.boostExpiresAt && listing.boostExpiresAt > new Date(); const status = listingStatus[listing.status as keyof typeof listingStatus] ?? listingStatus.draft; return <tr key={listing.id} className="hover:bg-cream/50"><td className="max-w-[240px] px-5 py-4"><Link href={`/welpen/${listing.id}`} target="_blank" className="block truncate text-xs font-semibold text-stone-800 hover:text-forest">{listing.title || listing.breed.nameDe}</Link><span className="mt-1 block truncate text-[10px] text-stone-400">{listing.breed.nameDe}</span></td><td className="px-4 py-4"><span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${status.classes}`}>{status.label}</span></td><td className="px-4 py-4"><span className="inline-flex items-center gap-1.5 text-xs text-stone-500"><DashboardIcon name="eye" className="h-4 w-4 text-stone-300" />{listing.viewCount}</span></td><td className="whitespace-nowrap px-4 py-4 text-xs text-stone-500">{listing.priceCents ? `${(listing.priceCents / 100).toLocaleString('de-DE')} €` : 'Auf Anfrage'}</td><td className="px-4 py-4">{isBoosted ? <span className="text-[10px] font-semibold text-honey">★ Aktiv<span className="mt-0.5 block font-normal text-stone-400">{listing.boostImpressions} Einblendungen</span></span> : <Link href={`/dashboard/boost/${listing.id}`} className="whitespace-nowrap text-[10px] font-medium text-stone-400 hover:text-honey">{boostPriceLabel} buchen</Link>}</td><td className="px-5 py-4 text-right"><Link href={`/dashboard/inserat/${listing.id}`} className="text-[10px] font-semibold text-stone-400 hover:text-forest">Bearbeiten</Link></td></tr>})}</tbody></table></div>
                  <div className="divide-y divide-cream-deep md:hidden">{breeder.listings.map((listing) => { const isBoosted = !!listing.boostExpiresAt && listing.boostExpiresAt > new Date(); const status = listingStatus[listing.status as keyof typeof listingStatus] ?? listingStatus.draft; return <div key={listing.id} className="p-4"><div className="mb-2 flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/welpen/${listing.id}`} target="_blank" className="block text-sm font-semibold text-stone-800">{listing.title || listing.breed.nameDe}</Link><p className="mt-1 text-xs text-stone-400">{listing.breed.nameDe}</p></div><span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${status.classes}`}>{status.label}</span></div><div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-500"><span>{listing.priceCents ? `${(listing.priceCents / 100).toLocaleString('de-DE')} €` : 'Preis auf Anfrage'}</span><span className="inline-flex items-center gap-1"><DashboardIcon name="eye" className="h-3.5 w-3.5 text-stone-300" />{listing.viewCount}</span>{isBoosted ? <span className="font-semibold text-honey">★ Boost aktiv</span> : <Link href={`/dashboard/boost/${listing.id}`} className="font-medium text-stone-400">Boost: {boostPriceLabel}</Link>}</div><Link href={`/dashboard/inserat/${listing.id}`} className="block rounded-lg border border-cream-deep bg-cream py-2.5 text-center text-sm font-semibold text-stone-700">Bearbeiten</Link></div>})}</div>
                </>}
              </section>
            </div>

            {/* Züchterseite und Sichtbarkeit */}
            <aside className="space-y-5">
              <section id="zuechterseite" className="scroll-mt-24 overflow-hidden rounded-2xl border border-cream-deep bg-white">
                <div className="relative flex h-24 items-center justify-center overflow-hidden bg-forest"><span className="flex h-12 w-12 -rotate-3 items-center justify-center rounded-2xl bg-cream text-forest shadow-sm"><DashboardIcon name="profile" className="h-6 w-6" /></span></div>
                <div className="p-5"><h2 className="font-serif text-lg font-bold text-forest">{breeder.kennelName}</h2><p className="mt-1.5 flex items-center gap-1.5 text-xs text-stone-400"><DashboardIcon name="location" className="h-3.5 w-3.5" />{breeder.city || 'Deutschland'}{breeder.state ? `, ${breeder.state}` : ''}</p><Link href={`/zuechter/${slugify(breeder.kennelName)}`} target="_blank" className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-forest/20 text-xs font-bold text-forest hover:bg-forest/5">Züchterseite ansehen<DashboardIcon name="website" className="h-4 w-4" /></Link>
                  <div className="mt-4 grid grid-cols-3 gap-2">{[{ label: 'Profil', href: '/dashboard/profil', icon: 'user' as const },{ label: 'Über uns', href: '/dashboard/ueber-uns', icon: 'listing' as const },{ label: 'Branding', href: '/dashboard/theme', icon: 'palette' as const },{ label: 'Aktuelles', href: '/dashboard/news', icon: 'news' as const },{ label: 'Galerie', href: '/dashboard/galerie', icon: 'gallery' as const },{ label: 'Nachrichten', href: '/dashboard/nachrichten', icon: 'messages' as const }].map((item) => <Link key={item.label} href={item.href} className="relative flex min-h-[68px] flex-col items-center justify-center gap-1.5 rounded-xl border border-cream-deep bg-cream/60 px-1 text-center text-[10px] font-semibold text-forest hover:border-forest/30 hover:bg-forest/5"><DashboardIcon name={item.icon} className="h-[18px] w-[18px]" />{item.label}{item.label === 'Nachrichten' && unreadCount > 0 && <span className="absolute right-1.5 top-1.5 rounded-full bg-honey px-1.5 text-[8px] font-bold text-forest-dark">{unreadCount}</span>}</Link>)}</div>
                  <div className="mt-5 border-t border-cream-deep pt-4 [&>div]:w-full [&_label]:justify-between"><BreederStatusToggles initialPublished={breeder.isPublished ?? true} initialActive={breeder.isActive ?? true} /></div>
                </div>
              </section>

              <div className="rounded-2xl bg-[#FFF2D8] p-5"><div className="flex items-start gap-3"><DashboardIcon name="trend" className="h-5 w-5 flex-shrink-0 text-honey" /><div><h2 className="font-serif text-base font-bold text-[#664C1D]">Mehr Sichtbarkeit</h2><p className="mt-2 text-xs leading-relaxed text-[#725C34]">Hebe passende Inserate mit einem Boost in den Suchergebnissen hervor.</p><Link href="#inserate" className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-xs font-bold text-[#82560D]">Inserat auswählen<DashboardIcon name="arrow" className="h-3.5 w-3.5" /></Link></div></div></div>
            </aside>
          </div>
        </main>
      </div>

      {/* Mobile: untere Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex min-h-[70px] items-start justify-around border-t border-cream-deep bg-white px-1 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 lg:hidden" aria-label="Mobile Dashboard-Navigation">
        {navItems.map((item, index) => <Link key={item.label} href={item.href} className={`flex min-w-[58px] flex-col items-center gap-1 rounded-lg px-2 py-1.5 ${index === 0 ? 'text-forest' : 'text-stone-400'}`}><DashboardIcon name={item.icon} className="h-5 w-5" /><span className="text-[9px] font-medium">{item.label === 'Meine Hunde' ? 'Hunde' : item.label === 'Züchterseite' ? 'Profil' : item.label}</span></Link>)}
      </nav>
    </div>
  )
}
