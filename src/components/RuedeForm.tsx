'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardHeader from './DashboardHeader'

type Breed = { id: number; nameDe: string }

export default function RuedeForm({ breeds }: { breeds: Breed[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    breedId: '',
    birthDate: '',
    color: '',
    pedigreeNumber: '',
    titles: '',
    isStud: false,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked })
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/hunde', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        breedId: Number(form.breedId),
        sex: 'male',
        birthDate: form.birthDate || null,
        color: form.color || null,
        pedigreeNumber: form.pedigreeNumber || null,
        titles: form.titles || null,
        isStud: form.isStud,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Fehler beim Speichern.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const labelClass = 'block text-sm font-medium text-stone-700 mb-1.5'
  const inputClass = 'w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest bg-white'

  return (
    <div className="min-h-screen bg-cream font-sans">
      <DashboardHeader title="Rüde eintragen" />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Rüde eintragen</h2>
        <p className="text-stone-400 text-sm mb-8">
          Trag deinen Zuchtrüden ein. Wenn du ihn als Deckrüde anbietest,
          erscheint er auf der öffentlichen Zuchtrüden-Seite.
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
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Rasse <span className="text-red-400">*</span></label>
            <select name="breedId" required value={form.breedId} onChange={handleChange} className={inputClass}>
              <option value="">Rasse auswählen</option>
              {breeds.map((b) => (
                <option key={b.id} value={b.id}>{b.nameDe}</option>
              ))}
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
            <label className={labelClass}>Ahnentafel-Nummer</label>
            <input
              type="text"
              name="pedigreeNumber"
              value={form.pedigreeNumber}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Titel / Auszeichnungen</label>
            <input
              type="text"
              name="titles"
              value={form.titles}
              onChange={handleChange}
              placeholder="z.B. VDH-Champion, Schönheitschampion..."
              className={inputClass}
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isStud"
              checked={form.isStud}
              onChange={handleChange}
              className="mt-1 w-4 h-4 accent-forest"
            />
            <span className="text-sm text-stone-600">
              <span className="font-medium text-stone-800">Als Deckrüde anbieten</span>
              <br />
              Erscheint mit Hervorhebung auf der öffentlichen Zuchtrüden-Seite.
            </span>
          </label>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={loading || !form.name || !form.breedId}
              className="min-h-11 w-full flex-1 rounded-xl bg-forest px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-forest-light disabled:opacity-40"
            >
              {loading ? 'Wird gespeichert...' : 'Rüde speichern'}
            </button>
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-200 px-5 py-2.5 text-sm text-stone-500 transition-colors hover:bg-stone-50"
            >
              Abbrechen
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
