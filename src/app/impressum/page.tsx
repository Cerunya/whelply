import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Impressum | Whelply',
}

export default function ImpressumPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">Impressum</h1>

          <div className="bg-white rounded-2xl border border-cream-deep p-8 md:p-12 space-y-8 text-stone-700 text-sm leading-relaxed">

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Angaben gemäß § 5 DDG</h2>
              <p>
                Manuel Lorenz<br />
                Klosterstr. 21<br />
                94072 Bad Füssing
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Kontakt</h2>
              <p>
                E-Mail: <a href="mailto:info@whelply.com" className="text-forest hover:underline">info@whelply.com</a><br />
                Telefon: [wird ergänzt]
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
              <p>
                Manuel Lorenz<br />
                Klosterstr. 21<br />
                94072 Bad Füssing
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">EU-Streitschlichtung</h2>
              <p>
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-forest hover:underline">
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
              <p className="mt-2">
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Haftung für Inhalte</h2>
              <p>
                Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den
                allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht
                verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen
                zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
              </p>
              <p className="mt-2">
                Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen
                Gesetzen bleiben hiervon unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem Zeitpunkt
                der Kenntnis einer konkreten Rechtsverletzung möglich. Bei Bekanntwerden von entsprechenden
                Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Haftung für Links</h2>
              <p>
                Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
                Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der
                verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Urheberrecht</h2>
              <p>
                Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem
                deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung
                außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen
                Autors bzw. Erstellers.
              </p>
            </section>

          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
