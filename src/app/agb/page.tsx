import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Allgemeine Geschäftsbedingungen | Whelply',
}

export default function AGBPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">Allgemeine Geschäftsbedingungen</h1>

          <div className="bg-white rounded-2xl border border-cream-deep p-8 md:p-12 space-y-8 text-stone-700 text-sm leading-relaxed">

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">§ 1 Geltungsbereich</h2>
              <p>
                Diese AGB gelten für die Nutzung der Plattform whelply.de (nachfolgend „Whelply"),
                betrieben von Manuel Lorenz, Klosterstr. 21, 94072 Bad Füssing (nachfolgend „Betreiber").
              </p>
              <p className="mt-2">
                Whelply ist eine Vermittlungsplattform, die Rassehundezüchter und Welpeninteressenten
                zusammenbringt. Whelply ist nicht selbst Verkäufer, Käufer oder Vermittler von Tieren.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">§ 2 Registrierung und Nutzerkonto</h2>
              <p>
                Die Nutzung bestimmter Funktionen erfordert eine Registrierung. Bei der Registrierung
                sind wahrheitsgemäße Angaben zu machen. Jede Person darf nur ein Konto erstellen.
              </p>
              <p className="mt-2">
                Der Nutzer ist für die Geheimhaltung seiner Zugangsdaten verantwortlich und haftet
                für alle Aktivitäten, die über sein Konto erfolgen.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">§ 3 Züchter-Pflichten</h2>
              <p>Züchter verpflichten sich:</p>
              <ul className="mt-2 space-y-1 ml-4">
                <li>• Nur wahrheitsgemäße Angaben zu ihrem Zwingernamen, Verband und ihren Tieren zu machen.</li>
                <li>• Nur Welpen aus eigener, kontrollierter Zucht anzubieten.</li>
                <li>• Keine Tiere ohne gültigen FCI- oder vergleichbaren Stammbaum als „mit Ahnentafel" zu kennzeichnen.</li>
                <li>• Die geltenden Tierschutzgesetze einzuhalten.</li>
                <li>• Inserate zeitnah zu aktualisieren (z.B. bei Vermittlung eines Welpen).</li>
              </ul>
              <p className="mt-2">
                Whelply behält sich das Recht vor, Züchterkonten bei Verstößen gegen diese Pflichten
                ohne Vorankündigung zu sperren.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">§ 4 Verifizierung</h2>
              <p>
                Züchter können sich freiwillig verifizieren lassen. Die Verifizierung umfasst:
              </p>
              <ul className="mt-2 space-y-1 ml-4">
                <li>• <strong>Identitätsprüfung</strong>: Über unseren Partner Didit (Ausweisdokument + Liveness-Check).</li>
                <li>• <strong>Züchterstatusprüfung</strong>: Durch Hochladen eines offiziellen Dokuments (Zuchtzulassung, Mitgliedsausweis o.ä.).</li>
              </ul>
              <p className="mt-2">
                Ein Verifizierungs-Badge stellt keine Garantie für die Qualität der Zucht dar,
                sondern bestätigt lediglich, dass die angegebene Identität und der Züchterstatus
                geprüft wurden.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">§ 5 Welpensucher-Pflichten</h2>
              <p>Welpensucher verpflichten sich:</p>
              <ul className="mt-2 space-y-1 ml-4">
                <li>• Die Kontaktfunktion nicht für Spam, Betrug oder andere missbräuchliche Zwecke zu nutzen.</li>
                <li>• Keine falschen Angaben zu machen.</li>
                <li>• Zu beachten, dass der Kauf eines Welpen ausschließlich zwischen Züchter und Käufer stattfindet — Whelply ist nicht Vertragspartei.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">§ 6 Haftungsausschluss</h2>
              <p>
                Whelply stellt lediglich die Plattform zur Verfügung. Für die Richtigkeit der von
                Züchtern eingestellten Angaben, die Gesundheit der Tiere oder die Abwicklung von
                Kaufverträgen übernimmt Whelply keine Haftung.
              </p>
              <p className="mt-2">
                Die Haftung des Betreibers ist auf Vorsatz und grobe Fahrlässigkeit beschränkt.
                Die Haftung für leichte Fahrlässigkeit ist ausgeschlossen, soweit nicht wesentliche
                Vertragspflichten betroffen sind.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">§ 7 Preise und Zahlungen</h2>
              <p>
                Die Grundnutzung von Whelply ist für Züchter und Welpensucher kostenlos. Für
                optionale Premium-Funktionen (z.B. Boost-Platzierungen) können Gebühren anfallen,
                die vor der Buchung transparent angezeigt werden.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">§ 8 Geistiges Eigentum</h2>
              <p>
                Die von Nutzern hochgeladenen Inhalte (Bilder, Texte) verbleiben im Eigentum der
                jeweiligen Nutzer. Mit dem Upload räumt der Nutzer Whelply ein einfaches, nicht
                exklusives Nutzungsrecht zur Anzeige auf der Plattform ein.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">§ 9 Kündigung und Löschung</h2>
              <p>
                Nutzer können ihr Konto jederzeit löschen lassen. Dazu genügt eine formlose Nachricht
                an <a href="mailto:info@whelply.com" className="text-forest hover:underline">info@whelply.com</a>.
                Bei Löschung werden alle personenbezogenen Daten entfernt, sofern keine gesetzlichen
                Aufbewahrungspflichten entgegenstehen.
              </p>
              <p className="mt-2">
                Der Betreiber behält sich das Recht vor, Konten bei schwerwiegenden Verstößen gegen
                diese AGB fristlos zu sperren oder zu löschen.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">§ 10 Schlussbestimmungen</h2>
              <p>
                Es gilt das Recht der Bundesrepublik Deutschland. Sollten einzelne Bestimmungen
                dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
              </p>
            </section>

            <p className="text-xs text-stone-400 pt-4 border-t border-cream-deep">
              Stand: August 2026
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
