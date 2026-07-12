'use client'

import { useState } from 'react'

export default function PasswortAendernForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setStatus('error')
      setMessage('Passwörter stimmen nicht überein')
      return
    }
    if (newPassword.length < 8) {
      setStatus('error')
      setMessage('Neues Passwort muss mindestens 8 Zeichen haben')
      return
    }

    setStatus('loading')
    try {
      const res = await fetch('/api/passwort/aendern', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage('Bestätigungsmail gesendet! Bitte prüfe dein E-Mail-Postfach.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Fehler aufgetreten')
      }
    } catch {
      setStatus('error')
      setMessage('Netzwerkfehler')
    }
  }

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-cream-deep bg-cream/30 focus:outline-none focus:ring-2 focus:ring-forest/30 text-sm'

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs text-stone-500 mb-1">Aktuelles Passwort</label>
        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
          className={inputClass} required />
      </div>
      <div>
        <label className="block text-xs text-stone-500 mb-1">Neues Passwort</label>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
          className={inputClass} required minLength={8} />
      </div>
      <div>
        <label className="block text-xs text-stone-500 mb-1">Neues Passwort bestätigen</label>
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          className={inputClass} required minLength={8} />
      </div>

      {message && (
        <p className={`text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}

      <button type="submit" disabled={status === 'loading'}
        className="bg-forest text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-forest-light transition-colors disabled:opacity-50">
        {status === 'loading' ? 'Wird gesendet...' : 'Passwort ändern'}
      </button>
    </form>
  )
}
