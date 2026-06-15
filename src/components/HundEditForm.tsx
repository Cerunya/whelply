'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DogImageUploader from './DogImageUploader'
import SaveToast from './SaveToast'

type Breed = { id: number; nameDe: string }
type DogData = {
  id: string
  name: string
  breedId: number
  sex: string
  birthDate: string | null
  color: string | null
  pedigreeNumber: string | null
  titles: string | null
  isStud: boolean
  description: string | null
  imageUrl: string | null
}

export default function HundEditForm({ dog, breeds }: { dog: DogData; breeds: Breed[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    name: dog.name,
    breedId: String(dog.breedId),
    sex: dog.sex,
    birthDate: dog.birthDate ?? '',
    color: dog.color ?? '',
    pedigreeNumber: dog.pedigreeNumber ?? '',
    titles: dog.titles ?? '',
    isStud: dog.isStud,
    description: dog.description ?? '',
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

    const res = await fetch(`/api/hunde/${dog.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        breedId: Number(form.breedId),
        sex: form.sex,
        birthDate: form.birthDate || null,
        color: form.color || null,
        pedigreeNumber: form.pedigreeNumber || null,
        titles: form.titles || null,
        isStud: form.sex === 'male' ? form.isStud : false,
        description: form.description || null,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Fehler beim Speichern.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm(`"${dog.name}" wirklich löschen?`)) return
    setDeleting(true)
    const res = await fetch(`/api/hunde/${dog.id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(data.error ?? 'Fehler beim Löschen.')
      setDeleting(false)
      return
    }

    router.push('/dashboard')
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
          <h1 className="font-semibold text-stone-800 text-sm">Zuchthund bearbeiten</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">{dog.name}</h2>
        <p className="text-stone-400 text-sm mb-8">
          Diese Angaben werden auf deiner Züchter-Seite und bei Würfen angezeigt, bei denen
          dieser Hund als Mutter oder Vater verlinkt ist.
        </p>

        <div className="mb-6">
          <label className={labelClass}>Profilbild</label>
          <DogImageUploader dogId={dog.id} initialUrl={dog.imageUrl} />
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-cream-deep p-7 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
              ✓ Gespeichert.
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
            <label className={labelClass}>Geschlecht <span className="text-red-400">*</span></label>
            <select name="sex" required value={form.sex} onChange={handleChange} className={inputClass}>
              <option value="female">Hündin</option>
              <option value="male">Rüde</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Rasse <span className="text-red-400">*</span></label>
            <select name="breedId" required value={form.breedId} onChange={handleChange} className={inputClass}>
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

          {form.sex === 'male' && (
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
          )}

          <div>
            <label className={labelClass}>Vorstellungstext (optional)</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              placeholder="Erzähl etwas über diesen Hund — Charakter, Geschichte, was ihn besonders macht..."
              className={inputClass}
            />
            <p className="text-xs text-stone-400 mt-1">
              Wenn du hier etwas eingibst, wird dieser Hund mit Foto und Text groß auf deiner
              öffentlichen Züchterseite vorgestellt — sonst nur in der kleinen Übersicht.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !form.name || !form.breedId}
              className="flex-1 bg-forest text-white py-3 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors disabled:opacity-40"
            >
              {loading ? 'Wird gespeichert...' : 'Speichern'}
            </button>
            <Link
              href="/dashboard"
              className="px-5 py-3 border border-stone-200 rounded-xl text-sm text-stone-500 hover:bg-stone-50 transition-colors"
            >
              Zurück
            </Link>
          </div>
        </form>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="mt-4 text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
        >
          {deleting ? 'Wird gelöscht...' : 'Hund löschen'}
        </button>
      </main>
      <SaveToast show={success} />
    </div>
  )
}
