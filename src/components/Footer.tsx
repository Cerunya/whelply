import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div>
            <p className="text-white font-semibold mb-3">Whelply</p>
            <p className="text-sm leading-relaxed">
              Die Plattform für seriöse Rassehunde-Züchter in Deutschland. Nur FCI-anerkannte Rassen.
            </p>
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-3">Entdecken</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/welpen" className="hover:text-white transition-colors">Welpen suchen</Link></li>
              <li><Link href="/zuchter" className="hover:text-white transition-colors">Züchter finden</Link></li>
              <li><Link href="/rassen" className="hover:text-white transition-colors">Rasselexikon</Link></li>
              <li><Link href="/dienste" className="hover:text-white transition-colors">Dienste</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-3">Züchter</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/register" className="hover:text-white transition-colors">Kostenlos registrieren</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Einloggen</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white text-sm font-medium mb-3">Rechtliches</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/impressum" className="hover:text-white transition-colors">Impressum</Link></li>
              <li><Link href="/datenschutz" className="hover:text-white transition-colors">Datenschutz</Link></li>
              <li><Link href="/agb" className="hover:text-white transition-colors">AGB</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-stone-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <p>© {new Date().getFullYear()} Whelply. Alle Rechte vorbehalten.</p>
          <p>Nur FCI-anerkannte Rassen · Kein Tierschutz · Keine Mischlinge</p>
        </div>
      </div>
    </footer>
  )
}
