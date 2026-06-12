'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUploader from '@/components/ImageUploader'

type Breed = { id: number; nameDe: string }
type MediaItem = { id: string; url: string; isPrimary: boolean }
type Listing = {
  id: string
  breedId: number
  priceCents: number | null
  sex: string | null
  description: string | null
  status: string
}

export default function InseratEditForm({
  listing,
  breeds,
  media = [],
}: {
  listing: Listing
  breeds: Breed[]
  media?: MediaItem[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    breedId: String(listing.breedId),
    priceCents: listing.priceCents ? String(listing.priceCents / 100) : '',
    sex: listing.sex ?? '',
    description: listing.description ?? '',
    status: listing.status,
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch(`/api/inserate/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        breedId: Number(form.breedId),
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

    router.push('/dashboard')
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm('Inserat wirklich löschen?')) return
    setDeleting(true)

    const res = await fetch(`/api/inserate/${listing.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setError('Fehler beim Löschen.')
      setDeleting(false)
    }
  }

  const labelClass = 'block text-sm font-medium text-stone-700 mb-1.5'
  const inputClass =
    'w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest bg-white'

  return (
    <div className="min-h-screen bg-cream font-sans">
      <header className="bg-white border-b border-cream-deep sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-stone-400 hover:text-stone-700 transition-colors text-sm"
          >
            ← Dashboard
          </Link>
          <span className="text-stone-300">|</span>
          <h1 className="font-semibold text-stone-800 text-sm">Inserat bearbeiten</h1>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-8">
          Inserat bearbeiten
        </h2>

        <div className="bg-white rounded-2xl border border-cream-deep p-7 mb-5">
          <label className={labelClass}>Fotos</label>
          <ImageUploader listingId={listing.id} initialMedia={media} />
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-cream-deep p-7 space-y-5"
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>
              Rasse <span className="text-red-400">*</span>
            </label>
            <select
              name="breedId"
              required
              value={form.breedId}
              onChange={handleChange}
              className={inputClass}
            >
              {breeds.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nameDe}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Geschlecht</label>
            <select
              name="sex"
              value={form.sex}
              onChange={handleChange}
              className={inputClass}
            >
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
              placeholder='leer lassen für "Auf Anfrage"'
              min="0"
              step="50"
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
              className={inputClass + ' resize-none'}
            />
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="draft">Entwurf (nicht sichtbar)</option>
              <option value="available">Aktiv (sofort sichtbar)</option>
              <option value="reserved">Reserviert</option>
              <option value="sold">Verkauft</option>
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-forest text-white py-3 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors disabled:opacity-40"
            >
              {loading ? 'Wird gespeichert...' : 'Änderungen speichern'}
            </button>
            <Link
              href="/dashboard"
              className="px-5 py-3 border border-stone-200 rounded-xl text-sm text-stone-500 hover:bg-stone-50 transition-colors"
            >
              Abbrechen
            </Link>
          </div>

          <div className="pt-2 border-t border-cream-deep">
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
            >
              {deleting ? 'Wird gelöscht...' : 'Inserat löschen'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
