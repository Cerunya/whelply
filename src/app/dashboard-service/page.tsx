import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export const dynamic = 'force-dynamic'

const CATEGORY_LABELS: Record<string, string> = {
  vet: 'Tierarzt / Tierklinik',
  groomer: 'Hundefriseur / Groomer',
  pension: 'Tierpension / Hundesitter',
  trainer: 'Hundetrainer / Hundeschule',
  other: 'Sonstige Dienstleistung',
}

export default async function ServiceDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const provider = await prisma.serviceProvider.findUnique({
    where: { userId: session.user.id },
  })
  if (!provider) redirect('/')

  const isComplete = !!(provider.name && provider.city && provider.phone)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">{provider.name}</h1>
          <p className="text-stone-400 text-sm mb-8">
            {CATEGORY_LABELS[provider.category] ?? provider.category}
            {provider.city && ` · ${provider.city}`}
          </p>

          {!isComplete && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8">
              <p className="text-amber-800 text-sm font-medium">Dein Profil ist noch unvollständig.</p>
              <p className="text-amber-600 text-xs mt-1">Füge Adresse, Telefon und eine Beschreibung hinzu, damit Kunden dich finden können.</p>
              <Link href="/dashboard-service/profil" className="text-amber-700 text-xs font-bold hover:underline mt-2 inline-block">Profil vervollständigen →</Link>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <Link href="/dashboard-service/profil" className="bg-white rounded-2xl border border-cream-deep p-6 hover:border-forest/30 transition-colors">
              <p className="font-semibold text-stone-900">Profil bearbeiten</p>
              <p className="text-xs text-stone-400 mt-1">Name, Beschreibung, Kontaktdaten, Öffnungszeiten</p>
            </Link>
            <Link href={`/dienste/${provider.id}`} target="_blank" className="bg-white rounded-2xl border border-cream-deep p-6 hover:border-forest/30 transition-colors">
              <p className="font-semibold text-stone-900">Öffentliches Profil</p>
              <p className="text-xs text-stone-400 mt-1">So sehen Besucher deinen Eintrag</p>
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-cream-deep p-6">
            <h2 className="font-serif text-lg font-bold text-stone-900 mb-4">Dein Eintrag</h2>
            <div className="space-y-3 text-sm text-stone-600">
              <p><span className="text-stone-400 w-24 inline-block">Kategorie:</span> {CATEGORY_LABELS[provider.category]}</p>
              <p><span className="text-stone-400 w-24 inline-block">Standort:</span> {[provider.city, provider.state].filter(Boolean).join(', ') || '—'}</p>
              <p><span className="text-stone-400 w-24 inline-block">Telefon:</span> {provider.phone || '—'}</p>
              <p><span className="text-stone-400 w-24 inline-block">Website:</span> {provider.website ? <a href={provider.website} target="_blank" className="text-forest hover:underline">{provider.website}</a> : '—'}</p>
              <p><span className="text-stone-400 w-24 inline-block">Premium:</span> {provider.isPremium ? '✓ Ja' : 'Nein'}</p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
