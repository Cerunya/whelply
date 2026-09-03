'use client'

import { useState } from 'react'

export default function BoostKaufButton({ listingId, priceLabel }: { listingId: string; priceLabel: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/boost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Etwas ist schiefgelaufen.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Verbindungsfehler. Bitte versuch es erneut.')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full bg-honey text-white font-bold text-base px-8 py-4 rounded-xl hover:bg-honey-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && (
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {loading ? 'Weiter zu Stripe …' : `Jetzt für ${priceLabel} boosten`}
      </button>
      {error && (
        <p className="text-sm text-red-600 mt-3 text-center">{error}</p>
      )}
    </div>
  )
}
