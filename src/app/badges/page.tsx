import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Was bedeuten die Badges? | Whelply',
  robots: { index: false, follow: false },
}

const badges = [
  {
    id: 'id-geprueft',
    icon: '🪪',
    name: 'ID geprüft',
    color: 'bg-green-50 border-green-200',
    iconBg: 'bg-green-500',
    description: 'Die Identität dieses Züchters wurde automatisch verifiziert.',
    details: [
      'Der Züchter hat einen gültigen Personalausweis oder Reisepass vorgelegt.',
      'Ein biometrischer Abgleich (Liveness-Check) hat bestätigt, dass die Person echt ist.',
      'Die Prüfung erfolgt über unseren Partner Didit — Whelply speichert keine Ausweisdaten.',
    ],
  },
  {
    id: 'zucht-verifiziert',
    icon: '📄',
    name: 'Zucht verifiziert',
    color: 'bg-green-50 border-green-200',
    iconBg: 'bg-green-500',
    description: 'Der Züchterstatus wurde durch ein offizielles Dokument belegt und manuell geprüft.',
    details: [
      'Der Züchter hat ein Dokument eingereicht: Zuchtzulassung, Vereinsmitgliedsausweis, Ahnentafel eines eigenen Wurfes oder Zwingerschutz-Urkunde.',
      'Unser Team hat das Dokument manuell geprüft und bestätigt.',
      'Das Dokument wurde nach der Prüfung automatisch gelöscht (DSGVO).',
    ],
  },
  {
    id: 'ahnentafel',
    icon: '📜',
    name: 'Ahnentafel',
    color: 'bg-amber-50 border-amber-200',
    iconBg: 'bg-amber-500',
    description: 'Dieser Welpe hat eine anerkannte Ahnentafel (Abstammungsnachweis).',
    details: [
      'Die Ahnentafel wird von einem anerkannten Zuchtverband (z.B. VDH, FCI) ausgestellt.',
      'Sie dokumentiert die Abstammung über mindestens drei Generationen.',
      'Nur Welpen aus kontrollierter Zucht erhalten eine Ahnentafel.',
    ],
  },
  {
    id: 'geimpft',
    icon: '💉',
    name: 'Geimpft',
    color: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-500',
    description: 'Dieser Welpe wurde altersgerecht geimpft.',
    details: [
      'Die Grundimmunisierung umfasst typischerweise Staupe, Hepatitis, Parvovirose und Leptospirose.',
      'Die Impfung ist im Impfpass/EU-Heimtierausweis dokumentiert.',
      'Der Züchter gibt an, dass die Impfung durchgeführt wurde — Whelply prüft den Impfpass nicht selbst.',
    ],
  },
  {
    id: 'entwurmt',
    icon: '💊',
    name: 'Entwurmt',
    color: 'bg-purple-50 border-purple-200',
    iconBg: 'bg-purple-500',
    description: 'Dieser Welpe wurde altersgerecht entwurmt.',
    details: [
      'Welpen werden in der Regel ab der 2. Lebenswoche alle 2 Wochen entwurmt.',
      'Die Entwurmung schützt vor Spul-, Haken- und Bandwürmern.',
      'Der Züchter gibt an, dass die Entwurmung durchgeführt wurde.',
    ],
  },
  {
    id: 'gechipt',
    icon: '📡',
    name: 'Gechipt',
    color: 'bg-stone-100 border-stone-300',
    iconBg: 'bg-stone-500',
    description: 'Dieser Welpe wurde mit einem Mikrochip gekennzeichnet.',
    details: [
      'Der Mikrochip ist eine 15-stellige Nummer, die unter die Haut implantiert wird.',
      'Er ermöglicht die eindeutige Identifikation des Hundes — z.B. beim Tierarzt oder wenn der Hund entläuft.',
      'In Deutschland ist die Kennzeichnung mit Chip für alle Hunde empfohlen, in vielen Bundesländern Pflicht.',
    ],
  },
]

export default function BadgesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-3">Was bedeuten die Badges?</h1>
          <p className="text-stone-500 mb-12">
            Badges auf Whelply zeigen auf einen Blick, welche Prüfungen ein Züchter oder Welpe durchlaufen hat.
            Hier erklären wir, was jedes Badge bedeutet.
          </p>

          <div className="space-y-8">
            {badges.map((b) => (
              <div key={b.id} id={b.id} className={`rounded-2xl border ${b.color} p-6 scroll-mt-24`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 ${b.iconBg} rounded-full flex items-center justify-center text-white text-lg`}>
                    {b.icon}
                  </div>
                  <h2 className="font-serif text-xl font-bold text-stone-900">{b.name}</h2>
                </div>
                <p className="text-stone-700 mb-4">{b.description}</p>
                <ul className="space-y-2">
                  {b.details.map((d, i) => (
                    <li key={i} className="flex gap-2 text-sm text-stone-600">
                      <span className="text-stone-400 flex-shrink-0 mt-0.5">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
