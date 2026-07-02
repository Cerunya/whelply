import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default async function UnsubscribePage({ params }: { params: { token: string } }) {
  const alert = await prisma.welpenAlert.findUnique({
    where: { unsubscribeToken: params.token },
    include: { breed: { select: { nameDe: true } } },
  })

  if (!alert) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-cream flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl border border-cream-deep p-10 max-w-md w-full text-center shadow-sm">
            <p className="text-2xl mb-3">🔍</p>
            <h1 className="font-serif text-xl font-bold text-stone-900 mb-2">Link nicht gefunden</h1>
            <p className="text-stone-400 text-sm mb-6">Dieser Abmelde-Link ist ungültig oder wurde bereits verwendet.</p>
            <Link href="/" className="text-forest text-sm font-semibold hover:underline">Zur Startseite</Link>
          </div>
        </main>
      </>
    )
  }

  // Sofort löschen beim Aufruf der Seite
  await prisma.welpenAlert.delete({ where: { id: alert.id } })

  const label = [alert.breed?.nameDe, alert.state].filter(Boolean).join(' · ') || 'Alle Welpen'

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-cream-deep p-10 max-w-md w-full text-center shadow-sm">
          <p className="text-4xl mb-4">✓</p>
          <h1 className="font-serif text-xl font-bold text-stone-900 mb-2">Erfolgreich abgemeldet</h1>
          <p className="text-stone-500 text-sm mb-1">
            Du erhältst keine weiteren Welpen-Alerts für:
          </p>
          <p className="text-forest font-semibold text-sm mb-6">{label}</p>
          <p className="text-stone-400 text-xs mb-6">
            Deine E-Mail-Adresse ({alert.email}) wurde aus unserem System entfernt.
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/welpen" className="text-sm font-semibold text-white bg-forest px-5 py-2.5 rounded-xl hover:bg-forest-light transition-colors">
              Zurück zu den Welpen
            </Link>
            <Link href="/" className="text-sm text-stone-400 hover:text-stone-600">
              Zur Startseite
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
