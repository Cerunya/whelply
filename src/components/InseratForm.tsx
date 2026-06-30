'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Breed = { id: number; nameDe: string }
type Litter = { id: string; breedId: number; label: string }

export default function InseratErstellen({ breeds, litters = [] }: { breeds: Breed[]; litters?: Litter[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: '',
    type: 'adult_dog',
    breedId: '',
    litterId: '',
    priceCents: '',
    sex: '',
    description: '',
    status: 'draft',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    if (name === 'litterId') {
      // Beim Wechsel des Wurfs automatisch die passende Rasse setzen und Typ auf "Welpe" stellen
      const litter = litters.find((l) => l.id === value)
      setForm({
        ...form,
        litterId: value,
        type: value ? 'puppy' : 'adult_dog',
        ...(litter ? { breedId: String(litter.breedId) } : {}),
      })
      return
    }
    setForm({ ...form, [name]: value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/inserate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title || null,
        type: form.type,
        breedId: Number(form.breedId),
        litterId: form.litterId || null,
        priceCents: form.priceCents ? Math.round(Number(form.priceCents) * 100) : null,
        sex: form.sex || null,
        description: form.description || null,
        status: form.status,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Fehler beim Speichern.')
      setLoading(false)
      return
    }

    // Direkt zur Bearbeitungsseite — dort können sofort Fotos hinzugefügt werden
    router.push(`/dashboard/inserat/${data.id}`)
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
          <h1 className="font-semibold text-stone-800 text-sm">Neues Inserat erstellen</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Inserat erstellen</h2>
        <p className="text-stone-400 text-sm mb-8">
          Nach dem Speichern kannst du direkt Fotos hinzufügen.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-cream-deep p-7 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>Name</label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="z.B. Bruno, Welpe 3, oder leer lassen"
              className={inputClass}
            />
            <p className="text-xs text-stone-400 mt-1">
              Optional — hilft dir und Interessenten bei der Unterscheidung mehrerer Welpen.
            </p>
          </div>

          {litters.length > 0 && (
            <div>
              <label className={labelClass}>Zu welchem Wurf gehört dieses Inserat?</label>
              <select name="litterId" value={form.litterId} onChange={handleChange} className={inputClass}>
                <option value="">Kein Wurf / einzelnes Tier</option>
                {litters.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
            </div>
          )}

          {!form.litterId && (
            <div>
              <label className={labelClass}>Art des Inserats</label>
              <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
                <option value="adult_dog">Erwachsener Hund (zur Abgabe)</option>
                <option value="puppy">Welpe (einzeln, ohne Wurf)</option>
                <option value="stud">Deckrüde-Angebot</option>
              </select>
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
            <label className={labelClass}>Geschlecht</label>
            <select name="sex" value={form.sex} onChange={handleChange} className={inputClass}>
              <option value="">Nicht angegeben</option>
              <option value="male">Rüde</option>
              <option value="female">Hündin</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Preis (€)</label>
            <input
              type="number"
              name="priceCents"
              value={form.priceCents}
              onChange={handleChange}
              placeholder="z.B. 1200 — leer lassen für &quot;Auf Anfrage&quot;"
              min="0"
              step="1"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Beschreibung</label>
            <textarea
              name="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="Erzähl etwas über den Welpen, die Elterntiere, die Aufzucht..."
              className={inputClass + ' resize-none'}
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
              disabled={loading || !form.breedId}
              className="flex-1 bg-forest text-white py-3 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors disabled:opacity-40"
            >
              {loading ? 'Wird gespeichert...' : 'Weiter zu Fotos →'}
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
