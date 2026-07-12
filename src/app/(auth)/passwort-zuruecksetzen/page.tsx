'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ResetForm() {
  const params = useSearchParams()
  const token = params.get('token')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  if (!token) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <p className="text-red-800 text-sm">Ungültiger Link. Bitte fordere einen neuen an.</p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setStatus('error')
      setMessage('Passwörter stimmen nicht überein')
      return
    }
    setStatus('loading')
    try {
      const res = await fetch('/api/passwort/zuruecksetzen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage('Passwort erfolgreich geändert! Du kannst dich jetzt einloggen.')
      } else {
        setStatus('error')
        setMessage(data.error || 'Fehler aufgetreten')
      }
    } catch {
      setStatus('error')
      setMessage('Netzwerkfehler')
    }
  }

  if (status === 'success') {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-800 text-sm font-medium">{message}</p>
        </div>
        <Link href="/login" className="block text-center bg-forest text-white font-bold py-2.5 rounded-xl hover:bg-forest-light transition-colors">
          Zum Login
        </Link>
      </div>
    )
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-cream-deep bg-cream/30 focus:outline-none focus:ring-2 focus:ring-forest/30 text-sm'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Neues Passwort</label>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
          className={inputClass} required minLength={8} autoFocus />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Passwort bestätigen</label>
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass} required minLength={8} />
      </div>
      {status === 'error' && <p className="text-red-600 text-sm">{message}</p>}
      <button type="submit" disabled={status === 'loading'}
        className="w-full bg-forest text-white font-bold py-2.5 rounded-xl hover:bg-forest-light transition-colors disabled:opacity-50">
        {status === 'loading' ? 'Wird gespeichert...' : 'Neues Passwort setzen'}
      </button>
    </form>
  )
}

export default function PasswortZuruecksetzenPage() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-3xl font-bold text-forest">Whelply</Link>
        </div>
        <div className="bg-white rounded-2xl border border-cream-deep p-8">
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">Neues Passwort vergeben</h1>
          <Suspense fallback={<p className="text-stone-400 text-sm">Laden...</p>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
