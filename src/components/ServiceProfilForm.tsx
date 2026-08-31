'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const BUNDESLAENDER = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
  'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen',
  'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen',
  'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
]

const CATEGORIES = [
  { value: 'vet', label: 'Tierarzt / Tierklinik' },
  { value: 'groomer', label: 'Hundefriseur / Groomer' },
  { value: 'pension', label: 'Tierpension / Hundesitter' },
  { value: 'trainer', label: 'Hundetrainer / Hundeschule' },
  { value: 'other', label: 'Sonstige Dienstleistung' },
]

type Props = {
  provider: {
    name: string
    category: string
    description: string
    street: string
    zip: string
    city: string
    state: string
    phone: string
    website: string
    openingHours: string
  }
  images?: { id: string; url: string }[]
}

export default function ServiceProfilForm({ provider, images: initialImages = [] }: Props) {
  const router = useRouter()
  const [form, setForm] = useState(provider)
  const [images, setImages] = useState(initialImages)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/service-profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Fehler beim Speichern')
      }
      setSuccess(true)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const labelClass = 'block text-sm font-semibold text-stone-700 mb-1.5'
  const inputClass = 'w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest shadow-sm'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">Profil gespeichert.</div>}

      <div className="bg-white rounded-2xl border border-cream-deep p-6 space-y-4">
        <h2 className="font-serif text-lg font-bold text-stone-900">Allgemein</h2>
        <div>
          <label className={labelClass}>Firmen-/Praxisname <span className="text-red-400">*</span></label>
          <input name="name" value={form.name} onChange={handleChange} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Kategorie</label>
          <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Beschreibung</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} className={inputClass} placeholder="Beschreibe dein Angebot, deine Erfahrung, Spezialisierungen..." />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-cream-deep p-6 space-y-4">
        <h2 className="font-serif text-lg font-bold text-stone-900">Adresse & Kontakt</h2>
        <div>
          <label className={labelClass}>Straße + Hausnummer</label>
          <input name="street" value={form.street} onChange={handleChange} className={inputClass} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>PLZ</label>
            <input name="zip" value={form.zip} onChange={handleChange} maxLength={5} className={inputClass} />
          </div>
          <div className="col-span-2">
            <label className={labelClass}>Ort</label>
            <input name="city" value={form.city} onChange={handleChange} className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Bundesland</label>
          <select name="state" value={form.state} onChange={handleChange} className={inputClass}>
            <option value="">— Bundesland —</option>
            {BUNDESLAENDER.map((bl) => <option key={bl} value={bl}>{bl}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Telefon</label>
            <input name="phone" value={form.phone} onChange={handleChange} type="tel" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Website</label>
            <input name="website" value={form.website} onChange={handleChange} type="url" placeholder="https://..." className={inputClass} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-cream-deep p-6 space-y-4">
        <h2 className="font-serif text-lg font-bold text-stone-900">Öffnungszeiten</h2>
        <textarea
          name="openingHours"
          value={form.openingHours}
          onChange={handleChange}
          rows={4}
          className={inputClass}
          placeholder={"Mo–Fr: 9:00–18:00 Uhr\nSa: 10:00–14:00 Uhr\nSo: geschlossen"}
        />
        <p className="text-xs text-stone-400">Eine Zeile pro Tag oder Zeitraum.</p>
      </div>

      <div className="bg-white rounded-2xl border border-cream-deep p-6 space-y-4">
        <h2 className="font-serif text-lg font-bold text-stone-900">Bilder</h2>
        <p className="text-xs text-stone-400">Zeige deine Räumlichkeiten, dein Team oder deine Arbeit. Max. 6 Bilder.</p>

        <div className="grid grid-cols-3 gap-3">
          {images.map((img) => (
            <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden bg-cream group">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={async () => {
                await fetch(`/api/media-item/${img.id}`, { method: 'DELETE' })
                setImages((prev) => prev.filter((i) => i.id !== img.id))
              }}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
            </div>
          ))}
          {images.length < 6 && (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-stone-200 flex items-center justify-center text-stone-400 hover:border-forest/40 hover:text-forest transition-colors">
              {uploading ? '...' : '+'}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          setUploading(true)
          try {
            const fd = new FormData()
            fd.append('file', file)
            fd.append('purpose', 'gallery')
            const res = await fetch('/api/upload', { method: 'POST', body: fd })
            const data = await res.json()
            if (data.url) {
              setImages((prev) => [...prev, { id: data.id || Date.now().toString(), url: data.url }])
            }
          } catch {}
          setUploading(false)
          if (fileRef.current) fileRef.current.value = ''
        }} />
      </div>

      <button type="submit" disabled={saving}
        className="w-full bg-forest text-white font-bold py-3 rounded-xl hover:bg-forest-light transition-colors disabled:opacity-40">
        {saving ? 'Wird gespeichert...' : 'Profil speichern'}
      </button>
    </form>
  )
}
