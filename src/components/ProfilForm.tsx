'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const BUNDESLAENDER = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
  'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen',
  'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen',
  'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
]

type BreederData = {
  kennelName: string
  displayName: string | null
  bio: string | null
  website: string | null
  verband: string | null
  mitgliedsnummer: string | null
  phone: string | null
  street: string | null
  zip: string | null
  city: string | null
  state: string | null
  showPhone: boolean
  showAddress: boolean
}

export default function ProfilForm({ breeder }: { breeder: BreederData }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    displayName: breeder.displayName ?? '',
    bio: breeder.bio ?? '',
    website: breeder.website ?? '',
    verband: breeder.verband ?? '',
    mitgliedsnummer: breeder.mitgliedsnummer ?? '',
    phone: breeder.phone ?? '',
    street: breeder.street ?? '',
    zip: breeder.zip ?? '',
    city: breeder.city ?? '',
    state: breeder.state ?? '',
    showPhone: breeder.showPhone,
    showAddress: breeder.showAddress,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked })
    } else {
      setForm({ ...form, [name]: value })
    }
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/profil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Fehler beim Speichern.')
      return
    }

    setSuccess(true)
    router.refresh()
  }

  const labelClass = 'block text-sm font-medium text-stone-700 mb-1.5'
  const inputClass = 'w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest bg-white'

  return (
    <div className="min-h-screen bg-cream font-sans">
      <header className="bg-white border-b border-cream-deep sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/dashboard" className="text-stone-400 hover:text-stone-700 transition-colors text-sm">
            ← Dashboard
          </Link>
          <span className="text-stone-300">|</span>
          <h1 className="font-semibold text-stone-800 text-sm">Profil bearbeiten</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Profil bearbeiten</h2>
        <p className="text-stone-400 text-sm mb-8">
          Zwingername: <span className="font-medium text-stone-600">{breeder.kennelName}</span>
          {' '}(nicht änderbar — bei der FCI registriert)
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
              Profil gespeichert.
            </div>
          )}

          {/* Öffentliches Profil */}
          <div className="bg-white rounded-2xl border border-cream-deep p-7 space-y-5">
            <h3 className="font-semibold text-stone-800 text-sm uppercase tracking-wide">
              Öffentliches Profil
            </h3>
            <p className="text-xs text-stone-400 -mt-3">
              Diese Angaben sind für Besucher auf deiner Züchter-Seite sichtbar.
            </p>

            <div>
              <label className={labelClass}>Anzeigename</label>
              <input
                type="text"
                name="displayName"
                value={form.displayName}
                onChange={handleChange}
                placeholder={breeder.kennelName}
                className={inputClass}
              />
              <p className="text-xs text-stone-400 mt-1">
                Leer lassen um deinen Zwingernamen ({breeder.kennelName}) zu verwenden.
              </p>
            </div>

            <div>
              <label className={labelClass}>Über dich / deine Zucht</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={4}
                placeholder="Erzähl etwas über deine Zucht, Philosophie, Erfahrung..."
                className={inputClass + ' resize-none'}
              />
            </div>

            <div>
              <label className={labelClass}>Webseite</label>
              <input
                type="url"
                name="website"
                value={form.website}
                onChange={handleChange}
                placeholder="https://..."
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Verband</label>
                <input
                  type="text"
                  name="verband"
                  value={form.verband}
                  onChange={handleChange}
                  placeholder="z.B. VDH"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Mitgliedsnummer</label>
                <input
                  type="text"
                  name="mitgliedsnummer"
                  value={form.mitgliedsnummer}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Stadt</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Bundesland</label>
                <select name="state" value={form.state} onChange={handleChange} className={inputClass}>
                  <option value="">Nicht angegeben</option>
                  {BUNDESLAENDER.map((bl) => (
                    <option key={bl} value={bl}>{bl}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Private Kontaktdaten */}
          <div className="bg-white rounded-2xl border border-cream-deep p-7 space-y-5">
            <h3 className="font-semibold text-stone-800 text-sm uppercase tracking-wide">
              Private Kontaktdaten
            </h3>
            <p className="text-xs text-stone-400 -mt-3">
              Standardmäßig nicht öffentlich sichtbar. Nötig für Verifizierung und Kontaktaufnahme durch Whelply.
              Du kannst unten festlegen, ob diese Angaben auf deiner Züchter-Seite angezeigt werden sollen.
            </p>

            <div>
              <label className={labelClass}>Telefonnummer</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+49 ..."
                className={inputClass}
              />
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="showPhone"
                  checked={form.showPhone}
                  onChange={handleChange}
                  className="w-4 h-4 accent-forest"
                />
                <span className="text-xs text-stone-500">
                  Telefonnummer auf meiner Züchter-Seite öffentlich anzeigen
                </span>
              </label>
            </div>

            <div>
              <label className={labelClass}>Straße & Hausnummer</label>
              <input
                type="text"
                name="street"
                value={form.street}
                onChange={handleChange}
                className={inputClass}
              />
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="showAddress"
                  checked={form.showAddress}
                  onChange={handleChange}
                  className="w-4 h-4 accent-forest"
                />
                <span className="text-xs text-stone-500">
                  Vollständige Adresse (Straße + PLZ) auf meiner Züchter-Seite öffentlich anzeigen.
                  Stadt und Bundesland sind unabhängig davon immer sichtbar.
                </span>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>PLZ</label>
                <input
                  type="text"
                  name="zip"
                  value={form.zip}
                  onChange={handleChange}
                  maxLength={5}
                  className={inputClass}
                />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Ort</label>
                <input
                  type="text"
                  value={form.city}
                  disabled
                  className={inputClass + ' bg-stone-50 text-stone-400'}
                />
                <p className="text-xs text-stone-400 mt-1">Wird oben im öffentlichen Profil gepflegt.</p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-forest text-white py-3 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors disabled:opacity-40"
          >
            {loading ? 'Wird gespeichert...' : 'Profil speichern'}
          </button>
        </form>
      </main>
    </div>
  )
}
