'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardHeader from './DashboardHeader'

type LitterInfo = {
  id: string
  breedId: number
  breedName: string
  bornDate: string | null
}

export default function WelpeForm({ litter }: { litter: LitterInfo }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successId, setSuccessId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    sex: 'male',
    birthDate: litter.bornDate ?? '',
    color: '',
    chipNumber: '',
    priceCents: '',
    status: 'draft',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch(`/api/wuerfe/${litter.id}/welpen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        sex: form.sex,
        birthDate: form.birthDate || null,
        color: form.color || null,
        chipNumber: form.chipNumber || null,
        priceCents: form.priceCents ? Math.round(Number(form.priceCents) * 100) : null,
        status: form.status,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Fehler beim Speichern.')
      setLoading(false)
      return
    }

    setLoading(false)
    setSuccessId(data.listingId)
  }

  const labelClass = 'block text-sm font-medium text-stone-700 mb-1.5'
  const inputClass = 'w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest bg-white'

  if (successId) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-4">
        <p className="text-green-700 font-semibold text-lg">✓ Welpe eingetragen!</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href={`/welpen/${successId}`}
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold bg-white border border-green-200 text-green-700 rounded-xl px-4 py-2.5 hover:bg-green-50 transition-colors">
            Inserat ansehen →
          </a>
          <a href={`/dashboard/inserat/${successId}`}
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold bg-white border border-green-200 text-green-700 rounded-xl px-4 py-2.5 hover:bg-green-50 transition-colors">
            Fotos hinzufügen
          </a>
          <button
            onClick={() => { setSuccessId(null); setForm({ name: '', sex: 'male', birthDate: litter.bornDate ?? '', color: '', chipNumber: '', priceCents: '', status: 'draft' }) }}
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold bg-forest text-white rounded-xl px-4 py-2.5 hover:bg-forest-light transition-colors">
            + Weiteren Welpen anlegen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream font-sans">
      <DashboardHeader title="Welpe hinzufügen" backHref={`/dashboard/wurf/${litter.id}`} backLabel="Wurf" />

      <main className="max-w-xl mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Welpe hinzufügen</h2>
        <p className="text-stone-400 text-sm mb-8">
          {litter.breedName} — wird automatisch diesem Wurf zugeordnet.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-cream-deep p-7 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>Name <span className="text-red-400">*</span></label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="z.B. Bruno"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Geschlecht <span className="text-red-400">*</span></label>
            <select name="sex" required value={form.sex} onChange={handleChange} className={inputClass}>
              <option value="male">Rüde</option>
              <option value="female">Hündin</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Geburtsdatum</label>
              <input
                type="date"
                name="birthDate"
                value={form.birthDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Farbe</label>
              <input
                type="text"
                name="color"
                value={form.color}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Chip-Nummer</label>
            <input
              type="text"
              name="chipNumber"
              value={form.chipNumber}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Preis (€)</label>
            <input
              type="number"
              name="priceCents"
              value={form.priceCents}
              onChange={handleChange}
              placeholder='leer lassen für "Auf Anfrage"'
              min="0"
              step="1"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
              <option value="draft">Entwurf (nicht sichtbar)</option>
              <option value="available">Aktiv (sofort sichtbar)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !form.name}
              className="flex-1 bg-forest text-white py-3 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors disabled:opacity-40"
            >
              {loading ? 'Wird gespeichert...' : 'Weiter zu Fotos →'}
            </button>
            <Link
              href={`/dashboard/wurf/${litter.id}`}
              className="px-5 py-3 border border-stone-200 rounded-xl text-sm text-stone-500 hover:bg-stone-50 transition-colors"
            >
              Abbrechen
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
