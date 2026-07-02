'use client'

import { useState } from 'react'

type Props = {
  breedName?: string
  breedId?: number
  state?: string
}

export default function WelpenAlertButton({ breedName, breedId, state }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/welpen-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, breedId, state }),
    })
    const data = await res.json()
    setLoading(false)
    setResult({ ok: res.ok, msg: data.message ?? data.error })
  }

  const label = [breedName, state].filter(Boolean).join(' · ') || 'Alle Welpen'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm font-semibold text-white bg-honey px-4 py-2 rounded-xl hover:bg-honey-light transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        Alert einrichten
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            {result ? (
              <div className="text-center py-4">
                <p className={`text-lg font-semibold mb-2 ${result.ok ? 'text-green-700' : 'text-red-600'}`}>
                  {result.ok ? '✓ Alert eingerichtet!' : '⚠ Fehler'}
                </p>
                <p className="text-stone-500 text-sm mb-6">{result.msg}</p>
                <button onClick={() => { setOpen(false); setResult(null) }}
                  className="text-sm text-forest font-semibold hover:underline">
                  Schließen
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-serif text-xl font-bold text-stone-900 mb-1">
                  Neue Welpen per E-Mail
                </h2>
                <p className="text-stone-400 text-sm mb-1">
                  Du wirst einmal täglich benachrichtigt wenn neue Welpen eingetragen werden.
                </p>
                <p className="text-xs text-forest font-semibold mb-6">
                  Filter: {label}
                </p>

                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">E-Mail-Adresse</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="deine@email.de"
                      className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
                    />
                  </div>

                  <div className="bg-cream rounded-xl px-4 py-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-xs text-stone-600">
                      Alle neuen Welpen: <strong>{label}</strong>
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-400">
                    Deine E-Mail-Adresse wird nur für diesen Alert verwendet und nicht weitergegeben. Du kannst dich jederzeit abmelden.
                  </p>

                  <div className="flex gap-2">
                    <button type="button" onClick={() => setOpen(false)}
                      className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50">
                      Abbrechen
                    </button>
                    <button type="submit" disabled={loading}
                      className="flex-1 py-2.5 rounded-xl bg-honey text-white text-sm font-bold hover:bg-honey-light disabled:opacity-50">
                      {loading ? '...' : 'Alert aktivieren'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
