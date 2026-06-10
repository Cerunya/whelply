'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    email: '',
    password: '',
    kennelName: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Registrierung
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Ein Fehler ist aufgetreten.')
      setLoading(false)
      return
    }

    // Nach erfolgreicher Registrierung direkt einloggen
    await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    router.push('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-gray-900">
            Whelply
          </Link>
          <p className="text-gray-500 mt-2 text-sm">Züchter-Konto erstellen</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              FCI-Zwingername <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="kennelName"
              required
              value={form.kennelName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="z.B. vom Schwarzen Tal"
            />
            <p className="text-xs text-gray-400 mt-1">
              Dein bei der FCI registrierter Zwingername. Muss eindeutig sein.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-Mail <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="name@beispiel.de"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Passwort <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              value={form.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              placeholder="Mindestens 8 Zeichen"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Konto wird erstellt...' : 'Konto erstellen'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            Mit der Registrierung bestätigst du, dass dein Zwingername bei der FCI registriert ist.
            Falsche Angaben führen zur sofortigen Sperrung.
          </p>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Bereits registriert?{' '}
          <Link href="/login" className="text-gray-900 font-medium hover:underline">
            Anmelden
          </Link>
        </p>
      </div>
    </main>
  )
}
