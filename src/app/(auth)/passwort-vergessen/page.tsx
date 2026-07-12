'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function PasswortVergessenPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/passwort/vergessen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) setStatus('sent')
      else setError('Fehler aufgetreten. Bitte versuche es erneut.')
    } catch {
      setError('Netzwerkfehler')
    }
  }

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-3xl font-bold text-forest">Whelply</Link>
        </div>

        <div className="bg-white rounded-2xl border border-cream-deep p-8">
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">Passwort vergessen?</h1>
          <p className="text-stone-500 text-sm mb-6">
            Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.
          </p>

          {status === 'sent' ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-800 text-sm font-medium">
                Falls ein Konto mit dieser E-Mail existiert, haben wir dir einen Link gesendet. Bitte prüfe dein Postfach.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">E-Mail</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-deep bg-cream/30 focus:outline-none focus:ring-2 focus:ring-forest/30 text-sm"
                  required autoFocus />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button type="submit" disabled={status === 'loading'}
                className="w-full bg-forest text-white font-bold py-2.5 rounded-xl hover:bg-forest-light transition-colors disabled:opacity-50">
                {status === 'loading' ? 'Wird gesendet...' : 'Link senden'}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-stone-400 mt-6">
            <Link href="/login" className="text-forest hover:underline">← Zurück zum Login</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
