'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardHeader from './DashboardHeader'
import DogGalleryUploader from './DogGalleryUploader'
import DogBgUploader from './DogBgUploader'
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
  bgUrl: string | null
  media?: { id: string; url: string; isPrimary: boolean; sortOrder: number; purpose: string | null }[]
  healthInfo: string | null
  parentSireId: string | null
  parentDamId: string | null
}

type DogOption = { id: string; name: string; sex: string }


function ParentSearch({
  label, dogs, value, onChange, inputClass,
}: {
  label: string
  dogs: DogOption[]
  value: string
  onChange: (id: string) => void
  inputClass: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  const selected = dogs.find((d) => d.id === value)
  const filtered = query
    ? dogs.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
    : dogs

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-stone-700 mb-1.5">{label}</label>
      <div className={inputClass + ' flex items-center gap-2 cursor-pointer relative'} onClick={() => setOpen(true)}>
        <span className={selected ? 'text-stone-800' : 'text-stone-400'}>
          {selected ? selected.name : '— nicht angegeben —'}
        </span>
        {value && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(''); setQuery('') }}
            className="ml-auto text-stone-400 hover:text-stone-700"
          >
            ×
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-stone-200 shadow-lg">
          <div className="p-2 border-b border-stone-100">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Suchen..."
              className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-forest"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(''); setQuery(''); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-sm text-stone-400 hover:bg-cream transition-colors"
            >
              — nicht angegeben —
            </button>
            {filtered.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => { onChange(d.id); setOpen(false); setQuery('') }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-cream transition-colors ${d.id === value ? 'bg-cream font-semibold text-forest' : 'text-stone-800'}`}
              >
                {d.name}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-sm text-stone-400">Keine Ergebnisse</p>
            )}
          </div>
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
    </div>
  )
}

export default function HundEditForm({ dog, breeds, allDogs = [] }: { dog: DogData; breeds: Breed[]; allDogs?: DogOption[] }) {
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
    healthInfo: dog.healthInfo ?? '',
    parentSireId: dog.parentSireId ?? '',
    parentDamId: dog.parentDamId ?? '',
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
        isStud: form.isStud,
        description: form.description || null,
        healthInfo: form.healthInfo || null,
        parentSireId: form.parentSireId || null,
        parentDamId: form.parentDamId || null,
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
      <DashboardHeader title="Zuchthund bearbeiten" />

      <main className="max-w-xl mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">{dog.name}</h2>
        <p className="text-stone-400 text-sm mb-8">
          Diese Angaben werden auf deiner Züchter-Seite und bei Würfen angezeigt, bei denen
          dieser Hund als Mutter oder Vater verlinkt ist.
        </p>

        <div className="mb-6">
          <label className={labelClass}>Fotos</label>
          {dog.isStud && (
            <div className="mb-4">
              <p className="text-xs text-stone-500 font-medium mb-2">Hintergrundbild der Deckrüden-Seite</p>
              <DogBgUploader dogId={dog.id} initialUrl={dog.bgUrl} />
            </div>
          )}
          {dog.isStud ? (
            <DogGalleryUploader dogId={dog.id} initialImages={dog.media ?? []} />
          ) : (
            <DogGalleryUploader dogId={dog.id} initialImages={dog.media ?? []} simpleMode />
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-cream-deep p-7 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">
              <p className="font-medium mb-2">✓ Gespeichert.</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Link href="/dashboard/hund-erstellen"
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-white border border-green-200 text-green-700 rounded-lg px-3 py-1.5 hover:bg-green-100 transition-colors">
                  + Weiteren Hund eintragen
                </Link>
                <Link href={`/hund/${dog.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-white border border-green-200 text-green-700 rounded-lg px-3 py-1.5 hover:bg-green-100 transition-colors">
                  Profil ansehen →
                </Link>
              </div>
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

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="isStud"
              checked={form.isStud}
              onChange={handleChange}
              className="mt-1 w-4 h-4 accent-forest"
            />
            <span className="text-sm text-stone-600">
              <span className="font-medium text-stone-800">
                {form.sex === 'male' ? 'Als Deckrüde anbieten' : 'Als Zuchthündin zeigen'}
              </span>
              <br />
              Erscheint auf der öffentlichen Zuchthunde-Seite.
            </span>
          </label>

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

          <div>
            <label className={labelClass}>Gesundheitstests / Untersuchungen (optional)</label>
            <textarea
              name="healthInfo"
              value={form.healthInfo}
              onChange={handleChange}
              rows={5}
              placeholder={'z.B.\nHD/ED: HD-A / ED-0\nDNA-Augenuntersuchung: frei\nMDR1: +/+ (normal)'}
              className={inputClass}
            />
            <p className="text-xs text-stone-400 mt-1">
              Freitext — wird unverändert auf dem Profil dieses Hundes angezeigt.
            </p>
          </div>

          {/* Elterntiere für Stammbaum */}
          {allDogs.length > 0 && (
            <div className="border-t border-cream-deep pt-5">
              <p className="text-sm font-semibold text-stone-700 mb-1">Elterntiere (für Stammbaum)</p>
              <p className="text-xs text-stone-400 mb-4">
                Verknüpfe Vater und Mutter dieses Hundes, falls sie auf Whelply eingetragen sind.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ParentSearch
                  label="Vater (auf Whelply)"
                  dogs={allDogs.filter((d) => d.sex === 'male' && d.id !== dog.id)}
                  value={form.parentSireId}
                  onChange={(id) => setForm({ ...form, parentSireId: id })}
                  inputClass={inputClass}
                />
                <ParentSearch
                  label="Mutter (auf Whelply)"
                  dogs={allDogs.filter((d) => d.sex === 'female' && d.id !== dog.id)}
                  value={form.parentDamId}
                  onChange={(id) => setForm({ ...form, parentDamId: id })}
                  inputClass={inputClass}
                />
              </div>
            </div>
          )}

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
