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

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
const PAYMENT_OPTIONS = [
  { id: 'bargeld', label: 'Bargeld', icon: '💵' },
  { id: 'ec', label: 'EC-Karte', icon: '💳' },
  { id: 'kreditkarte', label: 'Kreditkarte', icon: '💳' },
  { id: 'paypal', label: 'PayPal', icon: '🅿️' },
]

type DayHours = { open: boolean; from1: string; to1: string; from2: string; to2: string }
type OpeningHours = Record<string, DayHours>

function defaultHours(): OpeningHours {
  const h: OpeningHours = {}
  DAYS.forEach((d) => { h[d] = { open: d !== 'Sonntag', from1: '09:00', to1: '12:00', from2: '14:00', to2: '18:00' } })
  return h
}

function parseHours(json: string): OpeningHours {
  try { return JSON.parse(json) } catch { return defaultHours() }
}

type Props = {
  provider: {
    name: string; category: string; description: string
    street: string; zip: string; city: string; state: string
    phone: string; website: string; openingHours: string; paymentMethods: string
    logoUrl: string
  }
  images?: { id: string; url: string }[]
}

export default function ServiceProfilForm({ provider, images: initialImages = [] }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    name: provider.name,
    category: provider.category,
    description: provider.description,
    street: provider.street,
    zip: provider.zip,
    city: provider.city,
    state: provider.state,
    phone: provider.phone,
    website: provider.website,
  })
  const [hours, setHours] = useState<OpeningHours>(parseHours(provider.openingHours))
  const [payments, setPayments] = useState<string[]>(provider.paymentMethods ? provider.paymentMethods.split(',').map((s) => s.trim()).filter(Boolean) : [])
  const [logoUrl, setLogoUrl] = useState(provider.logoUrl)
  const [images, setImages] = useState(initialImages)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSuccess(false)
  }

  function updateDay(day: string, field: keyof DayHours, value: string | boolean) {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
    setSuccess(false)
  }

  function togglePayment(id: string) {
    setPayments((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id])
    setSuccess(false)
  }

  async function uploadImage(file: File, purpose: string) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('purpose', purpose)
    const res = await fetch('/api/service-upload', { method: 'POST', body: fd })
    if (!res.ok) throw new Error('Upload fehlgeschlagen')
    return res.json()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/service-profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          openingHours: JSON.stringify(hours),
          paymentMethods: payments.join(', '),
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Fehler')
      setSuccess(true)
      router.refresh()
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const labelClass = 'block text-sm font-semibold text-stone-700 mb-1.5'
  const inputClass = 'w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-700 bg-white focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest shadow-sm'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">Profil gespeichert.</div>}

      {/* Logo */}
      <div className="bg-white rounded-2xl border border-cream-deep p-6">
        <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Logo</h2>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-20 h-20 rounded-xl object-contain border border-cream-deep" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-cream border border-cream-deep flex items-center justify-center text-stone-400 text-2xl">🏢</div>
          )}
          <div>
            <button type="button" onClick={() => logoRef.current?.click()} disabled={logoUploading}
              className="text-sm font-semibold text-forest hover:underline disabled:opacity-40">
              {logoUploading ? 'Wird hochgeladen...' : logoUrl ? 'Logo ändern' : 'Logo hochladen'}
            </button>
            <p className="text-xs text-stone-400 mt-0.5">Quadratisch empfohlen, max. 400px</p>
          </div>
        </div>
        <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          setLogoUploading(true)
          try {
            const data = await uploadImage(file, 'logo')
            setLogoUrl(data.url)
          } catch {}
          setLogoUploading(false)
          if (logoRef.current) logoRef.current.value = ''
        }} />
      </div>

      {/* Allgemein */}
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
          <textarea name="description" value={form.description} onChange={handleChange} rows={4} className={inputClass}
            placeholder="Beschreibe dein Angebot, deine Erfahrung, Spezialisierungen..." />
        </div>
      </div>

      {/* Adresse & Kontakt */}
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
            <input name="website" value={form.website} onChange={handleChange} placeholder="https://..." className={inputClass} />
          </div>
        </div>
      </div>

      {/* Öffnungszeiten */}
      <div className="bg-white rounded-2xl border border-cream-deep p-6">
        <h2 className="font-serif text-lg font-bold text-stone-900 mb-4">Öffnungszeiten</h2>
        <div className="space-y-2">
          {DAYS.map((day) => (
            <div key={day} className="flex items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 w-28 flex-shrink-0 cursor-pointer">
                <input type="checkbox" checked={hours[day]?.open ?? false}
                  onChange={(e) => updateDay(day, 'open', e.target.checked)}
                  className="w-4 h-4 rounded border-stone-300 text-forest focus:ring-forest" />
                <span className={`text-sm ${hours[day]?.open ? 'text-stone-800 font-medium' : 'text-stone-400'}`}>{day}</span>
              </label>
              {hours[day]?.open ? (
                <div className="flex items-center gap-1 text-sm flex-wrap">
                  <input type="time" value={hours[day].from1}
                    onChange={(e) => updateDay(day, 'from1', e.target.value)}
                    className="border border-stone-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30" />
                  <span className="text-stone-400">–</span>
                  <input type="time" value={hours[day].to1}
                    onChange={(e) => updateDay(day, 'to1', e.target.value)}
                    className="border border-stone-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30" />
                  <span className="text-stone-300 mx-1">|</span>
                  <input type="time" value={hours[day].from2}
                    onChange={(e) => updateDay(day, 'from2', e.target.value)}
                    className="border border-stone-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30" />
                  <span className="text-stone-400">–</span>
                  <input type="time" value={hours[day].to2}
                    onChange={(e) => updateDay(day, 'to2', e.target.value)}
                    className="border border-stone-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30" />
                </div>
              ) : (
                <span className="text-xs text-stone-400">Geschlossen</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Zahlungsarten */}
      <div className="bg-white rounded-2xl border border-cream-deep p-6">
        <h2 className="font-serif text-lg font-bold text-stone-900 mb-4">Zahlungsarten</h2>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_OPTIONS.map((method) => (
            <button key={method.id} type="button" onClick={() => togglePayment(method.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                payments.includes(method.id)
                  ? 'bg-forest text-white border-forest'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-forest/30'
              }`}>
              <span>{method.icon}</span>
              {method.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bilder */}
      <div className="bg-white rounded-2xl border border-cream-deep p-6">
        <h2 className="font-serif text-lg font-bold text-stone-900 mb-3">Bilder</h2>
        <p className="text-xs text-stone-400 mb-4">Zeige deine Räumlichkeiten, dein Team oder deine Arbeit. Max. 6 Bilder.</p>
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
              className="aspect-square rounded-xl border-2 border-dashed border-stone-200 flex items-center justify-center text-stone-400 hover:border-forest/40 hover:text-forest transition-colors text-2xl">
              {uploading ? '...' : '+'}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
          const file = e.target.files?.[0]
          if (!file) return
          setUploading(true)
          try {
            const data = await uploadImage(file, 'gallery')
            if (data.url) setImages((prev) => [...prev, { id: data.id, url: data.url }])
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
