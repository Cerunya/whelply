'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardHeader from './DashboardHeader'
import ImageUploader from '@/components/ImageUploader'
import SaveToast from '@/components/SaveToast'

type Breed = { id: number; nameDe: string }
type Litter = { id: string; breedId: number; label: string }
type MediaItem = { id: string; url: string; isPrimary: boolean }
type Listing = {
  id: string
  title: string | null
  type: string
  breedId: number
  litterId: string | null
  priceCents: number | null
  sex: string | null
  description: string | null
  status: string
  hasPedigree: boolean
  isVaccinated: boolean
  isDewormed: boolean
  isChipped: boolean
  isInsured: boolean
  birthLocation: string | null
  chipNumber: string | null
}

export default function InseratEditForm({
  listing,
  breeds,
  litters = [],
  media = [],
}: {
  listing: Listing
  breeds: Breed[]
  litters?: Litter[]
  media?: MediaItem[]
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    title: listing.title ?? '',
    type: listing.type,
    breedId: String(listing.breedId),
    litterId: listing.litterId ?? '',
    priceCents: listing.priceCents ? String(listing.priceCents / 100) : '',
    sex: listing.sex ?? '',
    description: listing.description ?? '',
    status: listing.status,
    hasPedigree: listing.hasPedigree,
    isVaccinated: listing.isVaccinated,
    isDewormed: listing.isDewormed,
    isChipped: listing.isChipped,
    isInsured: listing.isInsured,
    birthLocation: listing.birthLocation ?? '',
    chipNumber: listing.chipNumber ?? '',
  })

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch(`/api/inserate/${listing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title || null,
        type: form.litterId ? 'puppy' : form.type,
        breedId: Number(form.breedId),
        litterId: form.litterId || null,
        priceCents: form.priceCents ? Math.round(Number(form.priceCents) * 100) : null,
        sex: form.sex || null,
        description: form.description || null,
        status: form.status,
        hasPedigree: form.hasPedigree,
        isVaccinated: form.isVaccinated,
        isDewormed: form.isDewormed,
        isChipped: form.isChipped,
        isInsured: form.isInsured,
        birthLocation: form.birthLocation || null,
        chipNumber: form.chipNumber || null,
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
      <DashboardHeader title="Inserat bearbeiten" />

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
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
              ✓ Gespeichert.
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
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* Welpen-Zusatzinfos */}
          {(form.type === 'puppy' || form.litterId) && (
            <>
              <div>
                <label className={labelClass}>Geburtsort</label>
                <input
                  type="text"
                  name="birthLocation"
                  value={form.birthLocation}
                  onChange={handleChange}
                  placeholder="z.B. Beim Züchter, 12345 Musterstadt"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Chipnummer (optional)</label>
                <input
                  type="text"
                  name="chipNumber"
                  value={form.chipNumber}
                  onChange={handleChange}
                  placeholder="15-stellige ISO-Chipnummer"
                  maxLength={20}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={`${labelClass} mb-3`}>Gesundheit & Dokumente</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'hasPedigree', label: 'Ahnentafel vorhanden' },
                    { key: 'isVaccinated', label: 'Geimpft' },
                    { key: 'isDewormed', label: 'Entwurmt' },
                    { key: 'isChipped', label: 'Gechipt' },
                    { key: 'isInsured', label: 'Versichert' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 p-3 bg-cream rounded-xl border border-cream-deep cursor-pointer hover:bg-stone-50 transition-colors">
                      <input
                        type="checkbox"
                        checked={form[key as keyof typeof form] as boolean}
                        onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                        className="w-4 h-4 rounded accent-forest"
                      />
                      <span className="text-sm text-stone-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

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
      <SaveToast show={success} />
    </div>
  )
}
