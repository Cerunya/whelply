'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SUBJECTS = [
  'Welpen-Anfrage',
  'Deckrüde / Verpaarung',
  'Besuch vereinbaren',
  'Allgemeine Frage',
  'Sonstiges',
]

export default function KontaktForm({
  breederId,
  kennelName,
  isLoggedIn,
}: {
  breederId: string
  kennelName: string
  isLoggedIn: boolean
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: SUBJECTS[0],
    message: '',
    honeypot: '', // verstecktes Feld — Bots füllen es aus, Menschen nicht
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isLoggedIn) { router.push('/login'); return }
    setLoading(true)
    setError('')

    // Honeypot: wenn ausgefüllt → Bot
    if (form.honeypot) {
      setDone(true) // fake success für den Bot
      return
    }

    const content = `**${form.subject}**\n\nVon: ${form.firstName} ${form.lastName}\nE-Mail: ${form.email}${form.phone ? `\nTelefon: ${form.phone}` : ''}\n\n${form.message}`

    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ breederId, content }),
    })

    setLoading(false)
    if (res.ok) {
      setDone(true)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Fehler beim Senden.')
    }
  }

  if (done) {
    return (
      <div className="text-center py-10">
        <p className="text-4xl mb-4">✓</p>
        <p className="font-semibold text-stone-900 text-lg mb-2">Nachricht gesendet!</p>
        <p className="text-stone-400 text-sm">{kennelName} wird sich so bald wie möglich bei dir melden.</p>
      </div>
    )
  }

  const inputClass = 'w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest'
  const labelClass = 'block text-sm font-medium text-stone-700 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot — versteckt für Menschen, Bots füllen es aus */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <input
          type="text"
          name="website_url"
          value={form.honeypot}
          onChange={(e) => setForm({ ...form, honeypot: e.target.value })}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Nachname <span className="text-red-400">*</span></label>
          <input name="lastName" value={form.lastName} onChange={handleChange} required
            placeholder="Mustermann" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Vorname <span className="text-red-400">*</span></label>
          <input name="firstName" value={form.firstName} onChange={handleChange} required
            placeholder="Max" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>E-Mail <span className="text-red-400">*</span></label>
        <input type="email" name="email" value={form.email} onChange={handleChange} required
          placeholder="max@beispiel.de" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Telefon</label>
        <input type="tel" name="phone" value={form.phone} onChange={handleChange}
          placeholder="+49 123 456789" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Betreff <span className="text-red-400">*</span></label>
        <select name="subject" value={form.subject} onChange={handleChange} className={inputClass}>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <label className={labelClass}>Nachricht <span className="text-red-400">*</span></label>
        <textarea name="message" value={form.message} onChange={handleChange} required
          rows={5} maxLength={2000} placeholder="Deine Nachricht..."
          className={inputClass + ' resize-y'} />
        <p className="text-xs text-stone-300 text-right mt-1">{form.message.length}/2000</p>
      </div>

      <p className="text-xs text-stone-400">
        Deine Daten werden ausschließlich zur Beantwortung deiner Anfrage verwendet und nicht weitergegeben.
      </p>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {!isLoggedIn ? (
        <p className="text-sm text-stone-500 bg-cream rounded-xl px-4 py-3">
          Du musst <a href="/login" className="text-forest font-semibold hover:underline">angemeldet sein</a>, um eine Nachricht zu senden.
        </p>
      ) : (
        <button type="submit" disabled={loading}
          className="w-full bg-forest text-white py-3 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors disabled:opacity-40">
          {loading ? 'Wird gesendet...' : 'Nachricht senden'}
        </button>
      )}
    </form>
  )
}
