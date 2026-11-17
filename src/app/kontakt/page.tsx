import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import KontaktSupportForm from '@/components/KontaktSupportForm'

export const metadata: Metadata = {
  title: 'Kontakt',
  description: 'Kontaktiere den Whelply-Support bei Fragen zu deinem Konto, deinem Züchterprofil oder der Plattform.',
}

export default function KontaktPage({ searchParams }: { searchParams: { betreff?: string } }) {
  const initialSubject = typeof searchParams.betreff === 'string' ? searchParams.betreff.slice(0, 150) : ''

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-cream">
        <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
          <div className="mb-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-honey">Whelply-Support</p>
            <h1 className="mt-2 font-serif text-3xl font-bold text-stone-900 sm:text-4xl">Wie können wir helfen?</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-stone-500">Schreib uns bei Fragen zu deinem Konto, deinem Züchterprofil oder Whelply allgemein. Wir melden uns per E-Mail bei dir.</p>
          </div>
          <KontaktSupportForm initialSubject={initialSubject} />
          <p className="mt-5 text-center text-xs text-stone-400">Du kannst uns auch direkt an <a href="mailto:info@whelply.de" className="text-forest hover:underline">info@whelply.de</a> schreiben.</p>
        </div>
      </main>
      <Footer />
    </>
  )
}
