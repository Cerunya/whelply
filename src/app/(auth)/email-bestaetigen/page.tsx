'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ConfirmContent() {
  const params = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) return
    fetch('/api/auth/email-bestaetigen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (res.ok) {
          setStatus('success')
          setMessage('Deine E-Mail-Adresse wurde bestätigt. Du kannst dich jetzt einloggen.')
        } else {
          setStatus('error')
          setMessage(data.error || 'Fehler aufgetreten')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Netzwerkfehler')
      })
  }, [token])

  // Ohne Token: Formular zum erneuten Anfordern
  if (!token) return <ResendForm />

  if (status === 'loading') {
    return <p className="text-stone-500 text-sm">E-Mail wird bestätigt...</p>
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-4 border ${status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <p className={`text-sm font-medium ${status === 'success' ? 'text-green-800' : 'text-red-800'}`}>{message}</p>
      </div>
      {status === 'success' ? (
        <Link href="/login" className="block text-center bg-forest text-white font-bold py-2.5 rounded-xl hover:bg-forest-light transition-colors">
          Zum Login
        </Link>
      ) : (
        <ResendForm />
      )}
    </div>
  )
}

function ResendForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/auth/email-bestaetigen/erneut', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => {})
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <p className="text-sm text-stone-600">
        Falls ein Konto mit dieser E-Mail existiert und noch nicht bestätigt ist, haben wir dir einen neuen Link geschickt.
        Bitte schau auch im Spam-Ordner nach.
      </p>
    )
  }

  return (
    <form onSubmit={handleResend} className="space-y-3">
      <p className="text-sm text-stone-500">Bestätigungslink erneut anfordern:</p>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="deine@email.de"
        className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-forest text-white py-2.5 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors disabled:opacity-40"
      >
        {loading ? 'Wird gesendet...' : 'Link erneut senden'}
      </button>
    </form>
  )
}

export default function EmailBestaetigenPage() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-3xl font-bold text-forest">Whelply</Link>
        </div>
        <div className="bg-white rounded-2xl border border-cream-deep p-8">
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">E-Mail bestätigen</h1>
          <Suspense fallback={<p className="text-stone-400 text-sm">Laden...</p>}>
            <ConfirmContent />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
