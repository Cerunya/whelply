'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardHeader from './DashboardHeader'

type Breed = { id: number; nameDe: string }
type DogOption = { id: string; name: string; sex: string; breedId: number }

export default function WurfForm({
  breeds,
  dams = [],
  sires = [],
}: {
  breeds: Breed[]
  dams?: DogOption[]
  sires?: DogOption[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    breedId: '',
    damId: '',
    sireId: '',
    expectedDate: '',
    bornDate: '',
    puppyCount: '',
    sireExternal: '',
    notes: '',
    status: 'planned',
  })

  // Nur Hunde derselben Rasse zur Auswahl anbieten
  const matchingDams = form.breedId ? dams.filter((d) => d.breedId === Number(form.breedId)) : dams
  const matchingSires = form.breedId ? sires.filter((s) => s.breedId === Number(form.breedId)) : sires

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/wuerfe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        breedId: Number(form.breedId),
        damId: form.damId || null,
        sireId: form.sireId || null,
        expectedDate: form.expectedDate || null,
        bornDate: form.bornDate || null,
        puppyCount: form.puppyCount ? Number(form.puppyCount) : null,
        sireExternal: form.sireId ? null : (form.sireExternal || null),
        notes: form.notes || null,
        status: form.status,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Fehler beim Speichern.')
      setLoading(false)
      return
    }

    router.push(`/dashboard/wurf/${data.id}`)
    router.refresh()
  }

  const labelClass = 'block text-sm font-medium text-stone-700 mb-1.5'
  const inputClass = 'w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest bg-white'

  return (
    <div className="min-h-screen bg-cream font-sans">
      <DashboardHeader title="Wurf eintragen" />

      <main className="max-w-xl mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Wurf eintragen</h2>
        <p className="text-stone-400 text-sm mb-8">
          Trag deinen geplanten oder bereits geborenen Wurf ein. Käufer können sich vormerken lassen.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-cream-deep p-7 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>Rasse <span className="text-red-400">*</span></label>
            <select name="breedId" required value={form.breedId} onChange={handleChange} className={inputClass}>
              <option value="">Rasse auswählen</option>
              {breeds.map((b) => (
                <option key={b.id} value={b.id}>{b.nameDe}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Status <span className="text-red-400">*</span></label>
            <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
              <option value="planned">Geplant (Deckung steht bevor)</option>
              <option value="pregnant">Trächtig</option>
              <option value="born">Geboren</option>
              <option value="available">Welpen abgabebereit</option>
            </select>
          </div>

          {(form.status === 'planned' || form.status === 'pregnant') && (
            <div>
              <label className={labelClass}>Erwartetes Datum</label>
              <input
                type="text"
                name="expectedDate"
                value={form.expectedDate}
                onChange={handleChange}
                placeholder="z.B. Ende Mai 2026"
                className={inputClass}
              />
              <p className="text-xs text-stone-400 mt-1">
                Freitext — muss kein genaues Datum sein.
              </p>
            </div>
          )}

          {(form.status === 'born' || form.status === 'available' || form.status === 'sold_out') && (
            <div>
              <label className={labelClass}>Geburtsdatum</label>
              <input
                type="date"
                name="bornDate"
                value={form.bornDate}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className={labelClass}>Anzahl Welpen</label>
            <input
              type="number"
              name="puppyCount"
              value={form.puppyCount}
              onChange={handleChange}
              min="1"
              max="20"
              placeholder="z.B. 6"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Mutterhündin</label>
            <select name="damId" value={form.damId} onChange={handleChange} className={inputClass}>
              <option value="">Nicht angegeben</option>
              {matchingDams.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            {dams.length === 0 && (
              <p className="text-xs text-stone-400 mt-1">
                Noch keine Hündinnen eingetragen.{' '}
                <Link href="/dashboard/hund-eintragen" className="text-forest hover:underline">
                  Jetzt eintragen
                </Link>
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Deckrüde</label>
            <select name="sireId" value={form.sireId} onChange={handleChange} className={inputClass}>
              <option value="">Externer Deckrüde / nicht angegeben</option>
              {matchingSires.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {!form.sireId && (
            <div>
              <label className={labelClass}>Name des externen Deckrüden</label>
              <input
                type="text"
                name="sireExternal"
                value={form.sireExternal}
                onChange={handleChange}
                placeholder="Falls der Deckrüde nicht auf Whelply registriert ist"
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className={labelClass}>Notizen</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Besonderheiten zum Wurf, Farben, Gesundheitstests der Eltern..."
              className={inputClass + ' resize-none'}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !form.breedId}
              className="flex-1 bg-forest text-white py-3 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors disabled:opacity-40"
            >
              {loading ? 'Wird gespeichert...' : 'Wurf speichern'}
            </button>
            <Link
              href="/dashboard"
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
