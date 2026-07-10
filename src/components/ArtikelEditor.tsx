'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Breed = { id: string; nameDe: string; slug: string }
type Article = {
  id?: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  coverImageUrl: string
  metaTitle: string
  metaDescription: string
  breedId: string
  authorName: string
  isPublished: boolean
}

export default function ArtikelEditor({ article, breeds }: { article?: Article & { id: string }; breeds: Breed[] }) {
  const router = useRouter()
  const [form, setForm] = useState<Article>({
    slug: article?.slug ?? '',
    title: article?.title ?? '',
    excerpt: article?.excerpt ?? '',
    content: article?.content ?? '',
    category: article?.category ?? 'ratgeber',
    coverImageUrl: article?.coverImageUrl ?? '',
    metaTitle: article?.metaTitle ?? '',
    metaDescription: article?.metaDescription ?? '',
    breedId: article?.breedId ?? '',
    authorName: article?.authorName ?? 'Whelply Redaktion',
    isPublished: article?.isPublished ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!article && form.title && !form.slug) {
      setForm((f) => ({ ...f, slug: slugify(form.title) }))
    }
  }, [form.title])

  function slugify(text: string) {
    return text.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value })
  }

  async function handleSubmit() {
    setError('')
    setSaving(true)
    try {
      const url = article ? `/api/artikel/${article.id}` : '/api/artikel'
      const method = article ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          breedId: form.breedId ? parseInt(form.breedId) : null,
          coverImageUrl: form.coverImageUrl || null,
          metaTitle: form.metaTitle || null,
          metaDescription: form.metaDescription || null,
          excerpt: form.excerpt || null,
          authorName: form.authorName || null,
        }),
      })
      if (!res.ok) throw new Error('Fehler beim Speichern')
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      if (!article) {
        const data = await res.json()
        router.push(`/admin/artikel/${data.id}`)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30'
  const labelClass = 'block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1'

  return (
    <div className="space-y-5">
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">✓ Gespeichert</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Titel</label>
          <input name="title" value={form.title} onChange={handleChange} className={inputClass} placeholder="Artikeltitel" />
        </div>
        <div>
          <label className={labelClass}>Slug (URL)</label>
          <input name="slug" value={form.slug} onChange={handleChange} className={inputClass} placeholder="mein-artikel" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Kategorie</label>
          <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
            <option value="ratgeber">Ratgeber</option>
            <option value="rassen">Rassen-Portrait</option>
            <option value="news">News</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Rasse (optional)</label>
          <select name="breedId" value={form.breedId} onChange={handleChange} className={inputClass}>
            <option value="">— Keine —</option>
            {breeds.map((b) => <option key={b.id} value={b.id}>{b.nameDe}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Autor</label>
          <input name="authorName" value={form.authorName} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Teaser / Auszug</label>
        <textarea name="excerpt" value={form.excerpt} onChange={handleChange} className={inputClass} rows={2} placeholder="Kurze Beschreibung für Vorschaukarten und SEO..." />
      </div>

      <div>
        <label className={labelClass}>Inhalt (Markdown)</label>
        <textarea name="content" value={form.content} onChange={handleChange} className={`${inputClass} font-mono text-xs`} rows={20} placeholder={'# Überschrift\n\nText hier...'} />
      </div>

      <div>
        <label className={labelClass}>Titelbild-URL (optional)</label>
        <input name="coverImageUrl" value={form.coverImageUrl} onChange={handleChange} className={inputClass} placeholder="https://... oder /api/media/..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Meta-Titel (SEO)</label>
          <input name="metaTitle" value={form.metaTitle} onChange={handleChange} className={inputClass} placeholder="Wird in Google-Ergebnissen angezeigt" />
        </div>
        <div>
          <label className={labelClass}>Meta-Beschreibung (SEO)</label>
          <input name="metaDescription" value={form.metaDescription} onChange={handleChange} className={inputClass} placeholder="155 Zeichen max." />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-cream-deep">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={handleChange}
            className="w-4 h-4 rounded border-stone-300 text-forest focus:ring-forest" />
          <span className="text-sm font-medium text-stone-700">Veröffentlicht</span>
        </label>
        <div className="flex gap-3">
          {article && (
            <a href={form.category === 'rassen' ? `/rassen/${form.slug}` : `/ratgeber/${form.slug}`} target="_blank" className="text-sm text-forest hover:underline">
              Vorschau →
            </a>
          )}
          <button onClick={handleSubmit} disabled={saving}
            className="bg-forest text-white text-sm font-semibold px-6 py-2.5 rounded-xl hover:bg-forest-light transition-colors disabled:opacity-50">
            {saving ? 'Speichert...' : article ? 'Aktualisieren' : 'Erstellen'}
          </button>
        </div>
      </div>
    </div>
  )
}
