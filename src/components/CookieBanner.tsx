'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Consent = 'all' | 'necessary' | null

export default function CookieBanner() {
  const [consent, setConsent] = useState<Consent>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = document.cookie
      .split('; ')
      .find((c) => c.startsWith('cookie_consent='))
      ?.split('=')[1] as Consent | undefined

    if (!stored) {
      setVisible(true)
    } else {
      setConsent(stored)
    }
  }, [])

  function accept(choice: 'all' | 'necessary') {
    // Cookie 1 Jahr gültig
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `cookie_consent=${choice}; path=/; expires=${expires}; SameSite=Lax`
    setConsent(choice)
    setVisible(false)
  }

  // Zum erneuten Öffnen (z.B. vom Footer-Link)
  // @ts-ignore — wird global verfügbar gemacht
  if (typeof window !== 'undefined') {
    (window as any).__openCookieBanner = () => {
      setVisible(true)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-[9999] px-4 pb-4">
      <div className="max-w-2xl mx-auto bg-stone-900 text-white rounded-2xl p-6 shadow-2xl border border-stone-700">
        <p className="text-sm leading-relaxed mb-4">
          Wir verwenden Cookies, um die Website zu betreiben und dein Erlebnis zu verbessern.
          Technisch notwendige Cookies sind für die Funktion der Seite erforderlich.
          Affiliate-Cookies (Amazon) setzen wir nur mit deiner Zustimmung.{' '}
          <Link href="/datenschutz" className="underline hover:text-honey">
            Mehr erfahren
          </Link>
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => accept('all')}
            className="flex-1 bg-forest text-white text-sm font-bold py-3 rounded-xl hover:bg-forest-light transition-colors"
          >
            Alle akzeptieren
          </button>
          <button
            onClick={() => accept('necessary')}
            className="flex-1 bg-stone-700 text-white text-sm font-medium py-3 rounded-xl hover:bg-stone-600 transition-colors"
          >
            Nur notwendige
          </button>
        </div>
      </div>
    </div>
  )
}
