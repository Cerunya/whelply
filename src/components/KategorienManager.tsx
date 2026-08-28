'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Category = { id: string; slug: string; name: string; description: string | null; sortOrder: number }

export default function KategorienManager({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [newName, setNewName] = useState('')
  const [newSlug, setNewSlug] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function generateSlug(name: string) {
    return name.toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  async function handleAdd() {
    if (!newName.trim()) return setError('Name erforderlich')
    const slug = newSlug.trim() || generateSlug(newName)
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/kategorien', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), slug }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Fehler')
      }
      setNewName('')
      setNewSlug('')
      router.refresh()
      const data = await res.json()
      setCategories((prev) => [...prev, data])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Kategorie "${name}" wirklich löschen? Artikel behalten ihre Kategorie, werden aber keinem Tab mehr zugeordnet.`)) return
    const res = await fetch(`/api/admin/kategorien?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id))
    }
  }

  const inputClass = 'border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30'

  return (
    <div>
      {/* Bestehende Kategorien */}
      <div className="space-y-2 mb-8">
        {categories.length === 0 ? (
          <p className="text-stone-400 text-sm text-center py-8">Noch keine Kategorien angelegt.</p>
        ) : (
          categories.map((cat, i) => (
            <div key={cat.id} className="flex items-center justify-between bg-white rounded-xl border border-cream-deep px-4 py-3">
              <div>
                <span className="text-sm font-medium text-stone-800">{cat.name}</span>
                <span className="text-xs text-stone-400 ml-2">/{cat.slug}</span>
              </div>
              <button
                onClick={() => handleDelete(cat.id, cat.name)}
                className="text-xs text-stone-400 hover:text-red-500 transition-colors"
              >
                Löschen
              </button>
            </div>
          ))
        )}
      </div>

      {/* Neue Kategorie */}
      <div className="bg-white rounded-2xl border border-cream-deep p-5">
        <h3 className="text-sm font-semibold text-stone-800 mb-3">Neue Kategorie</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setNewSlug(generateSlug(e.target.value)) }}
            placeholder="Name (z.B. Gesundheit)"
            className={inputClass + ' flex-1'}
          />
          <input
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            placeholder="Slug (auto)"
            className={inputClass + ' w-40'}
          />
          <button
            onClick={handleAdd}
            disabled={saving}
            className="bg-forest text-white text-sm font-bold px-5 py-2 rounded-lg hover:bg-forest-light disabled:opacity-40"
          >
            {saving ? '...' : 'Hinzufügen'}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  )
}
