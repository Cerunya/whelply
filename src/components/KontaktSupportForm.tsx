'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function KontaktSupportForm({ initialSubject = '' }: { initialSubject?: string }) {
  const [form, setForm] = useState({ name: '', email: '', subject: initialSubject, message: '', website: '' })
  const [privacy, setPrivacy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const inputClass = 'w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-forest focus:ring-2 focus:ring-forest/20'
  const labelClass = 'mb-1.5 block text-sm font-medium text-stone-700'

  function update(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/kontakt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, privacy }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Die Nachricht konnte nicht gesendet werden.')
      setSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-forest/15 bg-white p-8 text-center shadow-sm sm:p-10">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest/10 text-xl text-forest">✓</div>
        <h2 className="mt-5 font-serif text-2xl font-bold text-stone-900">Nachricht angekommen</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone-500">Danke für deine Nachricht. Wir melden uns so schnell wie möglich bei dir.</p>
        <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-forest px-5 text-sm font-bold text-white hover:bg-forest-light">Zur Startseite</Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-cream-deep bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className={labelClass}>Name *</label>
          <input id="contact-name" name="name" value={form.name} onChange={update} required minLength={2} maxLength={100} autoComplete="name" className={inputClass} />
        </div>
        <div>
          <label htmlFor="contact-email" className={labelClass}>E-Mail-Adresse *</label>
          <input id="contact-email" name="email" type="email" value={form.email} onChange={update} required autoComplete="email" className={inputClass} />
        </div>
      </div>
      <div className="mt-5">
        <label htmlFor="contact-subject" className={labelClass}>Betreff *</label>
        <input id="contact-subject" name="subject" value={form.subject} onChange={update} required minLength={2} maxLength={150} placeholder="Worum geht es?" className={inputClass} />
      </div>
      <div className="mt-5">
        <label htmlFor="contact-message" className={labelClass}>Nachricht *</label>
        <textarea id="contact-message" name="message" value={form.message} onChange={update} required minLength={10} maxLength={5000} rows={7} placeholder="Beschreibe dein Anliegen möglichst genau." className={inputClass} />
      </div>
      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" value={form.website} onChange={update} tabIndex={-1} autoComplete="off" />
      </div>
      <label className="mt-5 flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-stone-500">
        <input type="checkbox" checked={privacy} onChange={(event) => setPrivacy(event.target.checked)} required className="mt-0.5 h-4 w-4 accent-forest" />
        <span>Ich habe die <Link href="/datenschutz" className="text-forest underline">Datenschutzerklärung</Link> gelesen und bin mit der Verarbeitung meiner Angaben zur Bearbeitung der Anfrage einverstanden. *</span>
      </label>
      {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <button type="submit" disabled={loading || !privacy} className="mt-6 min-h-12 w-full rounded-xl bg-forest px-5 text-sm font-bold text-white transition hover:bg-forest-light disabled:opacity-40">
        {loading ? 'Nachricht wird gesendet …' : 'Nachricht senden'}
      </button>
    </form>
  )
}
