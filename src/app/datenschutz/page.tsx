import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Datenschutzerklärung | Whelply',
}

export default function DatenschutzPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">Datenschutzerklärung</h1>

          <div className="bg-white rounded-2xl border border-cream-deep p-8 md:p-12 space-y-8 text-stone-700 text-sm leading-relaxed">

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">1. Verantwortlicher</h2>
              <p>
                Manuel Lorenz<br />
                Klosterstr. 21<br />
                94072 Bad Füssing<br />
                E-Mail: <a href="mailto:info@whelply.com" className="text-forest hover:underline">info@whelply.com</a>
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">2. Erhebung und Speicherung personenbezogener Daten</h2>
              <p>
                Beim Besuch unserer Website werden automatisch folgende Daten erhoben, die
                technisch erforderlich sind, um die Website korrekt anzuzeigen:
              </p>
              <ul className="mt-2 space-y-1 ml-4">
                <li>• IP-Adresse</li>
                <li>• Datum und Uhrzeit des Zugriffs</li>
                <li>• Aufgerufene Seite / URL</li>
                <li>• Verwendeter Browser und Betriebssystem</li>
              </ul>
              <p className="mt-2">
                Diese Daten werden in Server-Logdateien gespeichert und nach 30 Tagen automatisch gelöscht.
                Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an der technischen
                Bereitstellung der Website).
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">3. Registrierung und Nutzerkonten</h2>
              <p>
                Bei der Registrierung erheben wir folgende Daten:
              </p>
              <ul className="mt-2 space-y-1 ml-4">
                <li>• E-Mail-Adresse</li>
                <li>• Passwort (verschlüsselt gespeichert mit bcrypt)</li>
                <li>• Rolle (Welpensucher, Züchter oder Dienstleister)</li>
              </ul>
              <p className="mt-2">
                Züchter geben zusätzlich an: Zwingername, Verband, Kontaktdaten (Adresse, Telefon),
                Informationen zu Zuchthunden und Würfen. Diese Angaben sind freiwillig und werden
                öffentlich auf dem Züchterprofil angezeigt, sofern der Züchter dies aktiviert.
              </p>
              <p className="mt-2">
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">4. Züchter-Verifizierung</h2>
              <h3 className="font-semibold text-stone-800 mt-4 mb-2">a) Identitätsprüfung (Didit)</h3>
              <p>
                Zur Identitätsprüfung nutzen wir den Dienst <strong>Didit</strong> (didit.me).
                Dabei werden folgende Daten an Didit übermittelt und dort verarbeitet:
              </p>
              <ul className="mt-2 space-y-1 ml-4">
                <li>• Foto des Ausweisdokuments</li>
                <li>• Biometrisches Selfie (Liveness-Check)</li>
              </ul>
              <p className="mt-2">
                Whelply speichert keine Ausweisdaten oder biometrischen Daten. Wir erhalten von Didit
                lediglich das Ergebnis der Prüfung (bestanden/nicht bestanden). Die Verarbeitung bei
                Didit erfolgt gemäß deren Datenschutzrichtlinie:{' '}
                <a href="https://didit.me/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-forest hover:underline">
                  https://didit.me/legal/privacy-policy
                </a>
              </p>
              <p className="mt-2">
                Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). Die Identitätsprüfung ist
                freiwillig.
              </p>

              <h3 className="font-semibold text-stone-800 mt-4 mb-2">b) Dokumentenprüfung</h3>
              <p>
                Zur Verifizierung des Züchterstatus kann ein Dokument hochgeladen werden
                (z.B. Zuchtzulassung, Mitgliedsausweis). Das Dokument wird ausschließlich zur
                Prüfung verwendet und nach der Entscheidung (Genehmigung oder Ablehnung)
                <strong> automatisch und unwiderruflich gelöscht</strong>.
              </p>
              <p className="mt-2">
                Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung bei Upload).
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">5. Bilder und Medien</h2>
              <p>
                Hochgeladene Bilder (Profilbilder, Hundefotos, Artikelbilder) werden auf unserem
                eigenen Server gespeichert (MinIO/S3-kompatibler Speicher). Bilder werden beim
                Upload automatisch zu WebP konvertiert und in der Größe optimiert. Sie werden
                nicht an Dritte weitergegeben.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">6. Amazon PartnerNet (Affiliate-Links)</h2>
              <p>
                Unsere Website enthält Affiliate-Links zum Amazon PartnerNet. Wenn du auf einen
                solchen Link klickst und ein Produkt kaufst, erhalten wir eine Provision von Amazon.
                Beim Klick auf einen Affiliate-Link setzt Amazon eigene Cookies. Die Datenverarbeitung
                durch Amazon erfolgt gemäß deren Datenschutzerklärung:{' '}
                <a href="https://www.amazon.de/gp/help/customer/display.html?nodeId=201909010" target="_blank" rel="noopener noreferrer" className="text-forest hover:underline">
                  Amazon Datenschutz
                </a>
              </p>
              <p className="mt-2">
                Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung über Cookie-Banner).
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">7. Cookies</h2>
              <p>
                Wir verwenden folgende Cookies:
              </p>
              <ul className="mt-2 space-y-2 ml-4">
                <li>
                  <strong>Technisch notwendige Cookies</strong> (Session-Cookie für Login, Cookie-Einstellungen) —
                  diese sind für den Betrieb der Website erforderlich und können nicht deaktiviert werden.
                  Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.
                </li>
                <li>
                  <strong>Affiliate-Cookies</strong> (Amazon) — werden nur gesetzt, wenn du dem über den
                  Cookie-Banner zustimmst. Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).
                </li>
              </ul>
              <p className="mt-2">
                Du kannst deine Einwilligung jederzeit über den Cookie-Banner (erneut aufrufbar über
                den Link „Cookie-Einstellungen" im Footer) widerrufen.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">8. Hosting</h2>
              <p>
                Diese Website wird auf einem eigenen, selbst verwalteten Server in Deutschland betrieben.
                Es werden keine externen Hosting-Dienstleister eingesetzt. Alle Daten verbleiben auf
                unserem eigenen Server.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">9. Deine Rechte</h2>
              <p>Du hast das Recht auf:</p>
              <ul className="mt-2 space-y-1 ml-4">
                <li>• <strong>Auskunft</strong> über deine gespeicherten Daten (Art. 15 DSGVO)</li>
                <li>• <strong>Berichtigung</strong> unrichtiger Daten (Art. 16 DSGVO)</li>
                <li>• <strong>Löschung</strong> deiner Daten (Art. 17 DSGVO)</li>
                <li>• <strong>Einschränkung</strong> der Verarbeitung (Art. 18 DSGVO)</li>
                <li>• <strong>Datenübertragbarkeit</strong> (Art. 20 DSGVO)</li>
                <li>• <strong>Widerspruch</strong> gegen die Verarbeitung (Art. 21 DSGVO)</li>
                <li>• <strong>Widerruf</strong> erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO)</li>
              </ul>
              <p className="mt-2">
                Du hast außerdem das Recht, dich bei einer <strong>Aufsichtsbehörde</strong> zu beschweren
                (Art. 77 DSGVO). Die zuständige Aufsichtsbehörde ist das Bayerische Landesamt für
                Datenschutzaufsicht (BayLDA).
              </p>
            </section>

            <section>
              <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">10. Kontakt zum Datenschutz</h2>
              <p>
                Für Fragen zum Datenschutz erreichst du uns unter:{' '}
                <a href="mailto:info@whelply.com" className="text-forest hover:underline">info@whelply.com</a>
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
