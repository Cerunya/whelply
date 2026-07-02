'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

type Role = 'buyer' | 'breeder' | 'service'

const ROLES: { value: Role; label: string; desc: string; icon: string }[] = [
  { value: 'buyer', label: 'Welpensucher', desc: 'Ich suche einen Welpen oder Hund', icon: '🐾' },
  { value: 'breeder', label: 'Züchter', desc: 'Ich züchte und biete Welpen an', icon: '🏡' },
  { value: 'service', label: 'Dienstleister', desc: 'Ich biete Dienstleistungen an', icon: '🔧' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('buyer')
  const [form, setForm] = useState({ email: '', password: '', kennelName: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        role,
        ...(role === 'breeder' && form.kennelName ? { kennelName: form.kennelName } : {}),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Ein Fehler ist aufgetreten.')
      setLoading(false)
      return
    }

    await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-2xl font-bold text-stone-900">Whelply</Link>
          <h1 className="text-xl font-semibold text-stone-800 mt-4">Konto erstellen</h1>
          <p className="text-stone-400 text-sm mt-1">Wähle, wie du Whelply nutzen möchtest</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-cream-deep p-8 space-y-6 shadow-sm">

          {/* Rollenauswahl */}
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                  role === r.value
                    ? 'border-forest bg-forest/5 text-forest'
                    : 'border-cream-deep text-stone-400 hover:border-stone-300'
                }`}
              >
                <span className="text-2xl">{r.icon}</span>
                <span className="text-xs font-semibold">{r.label}</span>
                <span className="text-[10px] leading-tight text-stone-400">{r.desc}</span>
              </button>
            ))}
          </div>

          {/* Zwingername nur für Züchter */}
          {role === 'breeder' && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Zwingername <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="kennelName"
                value={form.kennelName}
                onChange={handleChange}
                required
                placeholder="Mein Zwingername"
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">E-Mail</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="deine@email.de"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Passwort</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              placeholder="Mindestens 8 Zeichen"
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest text-white py-3 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors disabled:opacity-40"
          >
            {loading ? 'Wird registriert...' : 'Konto erstellen'}
          </button>

          <p className="text-center text-sm text-stone-400">
            Bereits registriert?{' '}
            <Link href="/login" className="text-forest font-medium hover:underline">Anmelden</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
