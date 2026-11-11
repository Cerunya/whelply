'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ArticleOption = { id: string; title: string }

export default function RatgeberHighlights({ articles, initialIds }: { articles: ArticleOption[]; initialIds: string[] }) {
  const router = useRouter()
  const [ids, setIds] = useState(Array.from({ length: 5 }, (_, index) => initialIds[index] ?? ''))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function update(index: number, id: string) {
    setIds((current) => current.map((value, itemIndex) => itemIndex === index ? id : value === id ? '' : value))
    setMessage('')
    setError('')
  }

  async function save() {
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const response = await fetch('/api/artikel/highlights', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: ids.filter(Boolean) }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Highlights konnten nicht gespeichert werden.')
      }
      setMessage('Highlights gespeichert.')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {message && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{message}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {ids.map((id, index) => (
        <label key={index} className="block rounded-xl border border-cream-deep bg-white p-4">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Position {index + 1}{index === 0 ? ' · Hauptartikel' : ''}</span>
          <select value={id} onChange={(event) => update(index, event.target.value)} className="min-h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30">
            <option value="">Automatisch neuesten Artikel verwenden</option>
            {articles.map((article) => <option key={article.id} value={article.id}>{article.title}</option>)}
          </select>
        </label>
      ))}
      <button type="button" onClick={save} disabled={saving} className="min-h-11 rounded-xl bg-forest px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest-light disabled:opacity-50">
        {saving ? 'Speichert…' : 'Highlights speichern'}
      </button>
    </div>
  )
}
