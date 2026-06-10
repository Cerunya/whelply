import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-forest text-forest-muted mt-20">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <p className="text-white font-bold text-xl font-serif mb-3">Whelply</p>
            <p className="text-sm leading-relaxed text-forest-muted">
              Die Plattform für seriöse Rassehunde-Züchter in Deutschland.
              Nur FCI-anerkannte Rassen.
            </p>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-4">Entdecken</p>
            <ul className="space-y-2.5 text-sm">
              {[
                ['/welpen', 'Welpen suchen'],
                ['/zuechter', 'Züchter finden'],
                ['/rassen', 'Rasselexikon'],
                ['/dienste', 'Dienste'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-4">Züchter</p>
            <ul className="space-y-2.5 text-sm">
              {[
                ['/register', 'Kostenlos registrieren'],
                ['/login', 'Einloggen'],
                ['/dashboard', 'Dashboard'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-4">Rechtliches</p>
            <ul className="space-y-2.5 text-sm">
              {[
                ['/impressum', 'Impressum'],
                ['/datenschutz', 'Datenschutz'],
                ['/agb', 'AGB'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-forest-light pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-forest-muted">
          <p>© {new Date().getFullYear()} Whelply</p>
          <p>Nur FCI-anerkannte Rassen · Kein Tierschutz · Keine Mischlinge</p>
        </div>
      </div>
    </footer>
  )
}
