'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardHeader from './DashboardHeader'
import { resizeImage } from '@/lib/image-resize'

type Breed = { id: number; nameDe: string }

export default function HundForm({ breeds }: { breeds: Breed[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [createdDogId, setCreatedDogId] = useState<string | null>(null)
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    name: '',
    breedId: '',
    sex: 'female',
    birthDate: '',
    color: '',
    pedigreeNumber: '',
    titles: '',
    isStud: false,
  })

  useEffect(() => {
    const urls = images.map((file) => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [images])

  function handleImages(files: FileList | null) {
    if (!files) return
    const valid = Array.from(files).filter((file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    setImages((prev) => [...prev, ...valid])
    setError('')
  }

  async function uploadImages(dogId: string) {
    for (const file of images) {
      const resized = await resizeImage(file, 1920, 0.85)
      const formData = new FormData()
      formData.append('file', resized)
      formData.append('dogId', dogId)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Upload fehlgeschlagen')
    }
  }

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
    setCreatedDogId(null)
    setLoading(true)

    const res = await fetch('/api/hunde', {
      method: 'POST',
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
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Fehler beim Speichern.')
      setLoading(false)
      return
    }

    try {
      await uploadImages(data.id)
    } catch {
      setCreatedDogId(data.id)
      setError('Der Hund wurde angelegt, aber nicht alle Bilder konnten hochgeladen werden. Du kannst den Upload auf der Hundeseite wiederholen.')
      setLoading(false)
      return
    }

    router.push(`/dashboard/hund/${data.id}`)
    router.refresh()
  }

  const labelClass = 'block text-sm font-medium text-stone-700 mb-1.5'
  const inputClass = 'w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest bg-white'

  return (
    <div className="min-h-screen bg-cream font-sans">
      <DashboardHeader title="Zuchthund eintragen" />

      <main className="max-w-xl mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl font-bold text-stone-900 mb-2">Zuchthund eintragen</h2>
        <p className="text-stone-400 text-sm mb-2">
          Trag deine Zuchthündinnen und -rüden ein. Sie erscheinen auf deiner Züchter-Seite
          und können bei der Eintragung von Würfen als Mutter oder Vater verlinkt werden.
        </p>
        <p className="text-stone-400 text-xs mb-8">
          Hinweis: Dies ist <strong>kein Inserat</strong>. Welpen zum Verkauf trägst du über
          "Wurf eintragen" → "Welpe hinzufügen" ein.
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-cream-deep p-7 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
              {error}
              {createdDogId && (
                <Link href={`/dashboard/hund/${createdDogId}`} className="mt-2 inline-block font-semibold underline">
                  Zum angelegten Hund
                </Link>
              )}
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
            <label className={labelClass}>Bilder</label>
            {previews.length > 0 && (
              <div className="mb-3 grid grid-cols-3 gap-3">
                {previews.map((url, index) => (
                  <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-cream-deep bg-cream">
                    <img src={url} alt={`Ausgewähltes Bild ${index + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                      aria-label="Bild entfernen"
                    >
                      ✕
                    </button>
                    {index === 0 && <span className="absolute bottom-1.5 left-1.5 rounded bg-forest px-1.5 py-0.5 text-[9px] font-bold text-white">Titelbild</span>}
                  </div>
                ))}
              </div>
            )}
            <div
              onClick={() => inputRef.current?.click()}
              onDrop={(e) => { e.preventDefault(); handleImages(e.dataTransfer.files) }}
              onDragOver={(e) => e.preventDefault()}
              className="cursor-pointer rounded-xl border-2 border-dashed border-stone-200 p-6 text-center hover:border-forest/40 hover:bg-cream/50"
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => { handleImages(e.target.files); e.target.value = '' }}
              />
              <p className="text-sm font-medium text-stone-500">Bilder auswählen</p>
              <p className="mt-1 text-xs text-stone-400">Mehrere möglich · werden beim Speichern hochgeladen</p>
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

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !form.name || !form.breedId}
              className="flex-1 bg-forest text-white py-3 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors disabled:opacity-40"
            >
              {loading ? (images.length ? 'Hund und Bilder werden gespeichert...' : 'Wird gespeichert...') : 'Hund speichern'}
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
