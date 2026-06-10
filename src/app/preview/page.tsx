'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PreviewPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(false)

    const res = await fetch('/api/preview-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/')
      router.refresh()
    } else {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-forest flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-serif text-4xl font-bold text-white mb-2">Whelply</h1>
        <p className="text-white/50 text-sm mb-10">Diese Seite ist noch nicht öffentlich.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Passwort"
            autoFocus
            className="w-full bg-white/10 border border-white/20 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-honey focus:border-transparent"
          />
          {error && (
            <p className="text-red-400 text-sm">Falsches Passwort.</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-honey text-white py-3 rounded-xl text-sm font-bold hover:bg-honey-light transition-colors disabled:opacity-40"
          >
            {loading ? '...' : 'Eintreten'}
          </button>
        </form>
      </div>
    </main>
  )
}
