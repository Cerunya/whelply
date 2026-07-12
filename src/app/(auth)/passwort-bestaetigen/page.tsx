'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function ConfirmContent() {
  const params = useSearchParams()
  const token = params.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Ungültiger Link.')
      return
    }
    fetch('/api/passwort/bestaetigen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (res.ok) {
          setStatus('success')
          setMessage('Dein Passwort wurde erfolgreich geändert.')
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

  if (status === 'loading') {
    return <p className="text-stone-500 text-sm">Passwort wird geändert...</p>
  }

  return (
    <div className="space-y-4">
      <div className={`rounded-xl p-4 border ${status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <p className={`text-sm font-medium ${status === 'success' ? 'text-green-800' : 'text-red-800'}`}>{message}</p>
      </div>
      {status === 'success' && (
        <p className="text-stone-500 text-sm">Du wurdest aus allen Geräten abgemeldet. Bitte logge dich mit deinem neuen Passwort ein.</p>
      )}
      <Link href="/login" className="block text-center bg-forest text-white font-bold py-2.5 rounded-xl hover:bg-forest-light transition-colors">
        Zum Login
      </Link>
    </div>
  )
}

export default function PasswortBestaetigtPage() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-serif text-3xl font-bold text-forest">Whelply</Link>
        </div>
        <div className="bg-white rounded-2xl border border-cream-deep p-8">
          <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">Passwort-Änderung</h1>
          <Suspense fallback={<p className="text-stone-400 text-sm">Laden...</p>}>
            <ConfirmContent />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
