import { auth } from '@/lib/auth'

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://whelply.de'

export default async function Footer() {
  const session = await auth()
  return (
    <footer className="bg-forest text-white/60 mt-20 relative z-10">
      <div className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <a href={BASE} className="text-white font-bold text-xl font-serif mb-3 block">Whelply</a>
            <p className="text-sm leading-relaxed text-white/60">
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
                  <a href={`${BASE}${href}`} className="text-white/60 hover:text-white transition-colors">{label}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-4">Züchter</p>
            <ul className="space-y-2.5 text-sm">
              {(session?.user
                ? [
                    ['/dashboard', 'Dashboard'],
                    ['/dashboard/wurf-eintragen', 'Wurf eintragen'],
                    ['/dashboard/profil', 'Profil bearbeiten'],
                  ]
                : [
                    ['/register', 'Kostenlos registrieren'],
                    ['/login', 'Einloggen'],
                  ]
              ).map(([href, label]) => (
                <li key={href}>
                  <a href={`${BASE}${href}`} className="text-white/60 hover:text-white transition-colors">{label}</a>
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
                  <a href={`${BASE}${href}`} className="text-white/60 hover:text-white transition-colors">{label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <p>© {new Date().getFullYear()} Whelply</p>
          <p>Nur FCI-anerkannte Rassen · Kein Tierschutz · Keine Mischlinge</p>
        </div>
      </div>
    </footer>
  )
}
