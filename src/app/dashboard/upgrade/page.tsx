'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UpgradePage() {
  const router = useRouter()
  const [kennelName, setKennelName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/upgrade-to-breeder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kennelName }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Fehler beim Upgrade.')
      return
    }

    router.push('/dashboard?upgraded=1')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-cream-deep p-8 shadow-sm">
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">Züchter werden</h1>
          <p className="text-stone-400 text-sm mb-6">
            Wandle dein Konto in ein Züchter-Konto um. Du kannst dann Würfe, Welpen und Zuchthunde eintragen.
            <strong className="text-stone-600"> Dieser Schritt kann nicht rückgängig gemacht werden.</strong>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Zwingername <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={kennelName}
                onChange={(e) => setKennelName(e.target.value)}
                required
                minLength={2}
                maxLength={80}
                placeholder="Mein Zwingername"
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !kennelName.trim()}
              className="w-full bg-forest text-white py-3 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors disabled:opacity-40"
            >
              {loading ? 'Wird geändert...' : 'Zu Züchter-Konto upgraden'}
            </button>

            <Link href="/dashboard" className="block text-center text-sm text-stone-400 hover:text-stone-600">
              Zurück zum Dashboard
            </Link>
          </form>
        </div>
      </div>
    </div>
  )
}
