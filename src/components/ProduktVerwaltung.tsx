'use client'

import { useState } from 'react'

type Product = {
  id: string
  asin: string
  name: string
  imageUrl: string | null
  category: string
  description: string | null
  affiliateTag: string
  priceCents: number | null
  isAvailable: boolean
}

const CATEGORIES = [
  { value: 'zubehoer', label: 'Zubehör' },
  { value: 'futter', label: 'Futter' },
  { value: 'pflege', label: 'Pflege' },
  { value: 'gesundheit', label: 'Gesundheit' },
  { value: 'training', label: 'Training' },
  { value: 'buch', label: 'Bücher' },
]

function emptyForm() {
  return { asin: '', name: '', imageUrl: '', category: 'zubehoer', description: '', affiliateTag: 'whelply-21' }
}

export default function ProduktVerwaltung({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [form, setForm] = useState(emptyForm())
  const [editId, setEditId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('purpose', 'product')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) setForm((f) => ({ ...f, imageUrl: data.url }))
    } catch { /* ignore */ }
    finally { setUploading(false) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      if (editId) {
        const res = await fetch(`/api/produkte/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) { setError('Fehler beim Speichern'); return }
        const updated = await res.json()
        setProducts((p) => p.map((x) => (x.id === editId ? { ...x, ...updated } : x)))
        setEditId(null)
      } else {
        const res = await fetch('/api/produkte', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error || 'Fehler'); return
        }
        const created = await res.json()
        setProducts((p) => [created, ...p])
      }
      setForm(emptyForm())
    } catch { setError('Netzwerkfehler') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm('Produkt wirklich löschen?')) return
    const res = await fetch(`/api/produkte/${id}`, { method: 'DELETE' })
    if (res.ok) setProducts((p) => p.filter((x) => x.id !== id))
  }

  function startEdit(p: Product) {
    setEditId(p.id)
    setForm({
      asin: p.asin,
      name: p.name,
      imageUrl: p.imageUrl || '',
      category: p.category,
      description: p.description || '',
      affiliateTag: p.affiliateTag,
    })
  }

  const inputClass = 'w-full px-3 py-2 rounded-xl border border-cream-deep bg-cream/30 focus:outline-none focus:ring-2 focus:ring-forest/30 text-sm'

  return (
    <div className="space-y-8">
      {/* Formular */}
      <div className="bg-white rounded-2xl border border-cream-deep p-6">
        <h2 className="font-semibold text-stone-800 mb-4">{editId ? 'Produkt bearbeiten' : 'Neues Produkt'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone-500 mb-1">ASIN *</label>
              <input value={form.asin} onChange={(e) => setForm((f) => ({ ...f, asin: e.target.value }))}
                className={inputClass} required placeholder="B0CDR..." />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Produktname *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className={inputClass} required placeholder="Hundebett Ortho XL" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Kategorie</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className={inputClass}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Affiliate-Tag</label>
              <input value={form.affiliateTag} onChange={(e) => setForm((f) => ({ ...f, affiliateTag: e.target.value }))}
                className={inputClass} placeholder="whelply-21" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Produktbild</label>
            <div className="flex items-center gap-3">
              {form.imageUrl && (
                <img src={form.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
              )}
              <label className="cursor-pointer text-sm text-forest hover:underline">
                {uploading ? 'Lädt...' : 'Bild hochladen'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
              {form.imageUrl && (
                <button type="button" onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                  className="text-xs text-red-400 hover:text-red-600">Entfernen</button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Kurzbeschreibung</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={inputClass + ' resize-none'} rows={2} placeholder="Warum empfehlen wir dieses Produkt?" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="bg-forest text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-forest-light transition-colors disabled:opacity-50">
              {saving ? 'Speichert...' : editId ? 'Speichern' : 'Produkt anlegen'}
            </button>
            {editId && (
              <button type="button" onClick={() => { setEditId(null); setForm(emptyForm()) }}
                className="text-sm text-stone-400 hover:text-stone-600 px-4 py-2.5">Abbrechen</button>
            )}
          </div>
        </form>
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {products.length === 0 && (
          <p className="text-stone-400 text-sm text-center py-8">Noch keine Produkte angelegt.</p>
        )}
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-cream-deep p-4 flex items-center gap-4">
            {p.imageUrl ? (
              <img src={p.imageUrl} alt={p.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-cream flex items-center justify-center text-stone-300 flex-shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-stone-900 truncate">{p.name}</p>
              <p className="text-xs text-stone-400">ASIN: {p.asin} · {CATEGORIES.find((c) => c.value === p.category)?.label ?? p.category}</p>
              <p className="text-xs text-stone-400 font-mono mt-0.5">:::produkt[{p.asin}]</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => startEdit(p)} className="text-xs text-forest hover:underline">Bearbeiten</button>
              <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:text-red-600">Löschen</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
