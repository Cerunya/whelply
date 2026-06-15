'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NewsImageUploader from './NewsImageUploader'
import SaveToast from './SaveToast'

type Post = {
  id: string
  title: string
  content: string
  imageUrl: string | null
  mediaId: string | null
}

const labelClass = 'block text-sm font-medium text-stone-700 mb-1.5'
const inputClass = 'w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest bg-white'

export default function NewsPostForm({ post }: { post?: Post }) {
  const router = useRouter()
  const isEdit = !!post

  const [form, setForm] = useState({
    title: post?.title ?? '',
    content: post?.content ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const url = isEdit ? `/api/news/${post!.id}` : '/api/news'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Fehler beim Speichern.')
      setLoading(false)
      return
    }

    if (isEdit) {
      setSuccess(true)
      setLoading(false)
    } else {
      router.push(`/dashboard/news/${data.id}`)
      router.refresh()
    }
  }

  async function handleDelete() {
    if (!confirm('Diesen Beitrag wirklich löschen?')) return
    setDeleting(true)
    const res = await fetch(`/api/news/${post!.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/dashboard/news')
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Fehler beim Löschen.')
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream font-sans">
      <header className="bg-white border-b border-cream-deep sticky top-0 z-50 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/dashboard/news" className="text-stone-400 hover:text-stone-700 transition-colors text-sm">
            ← Aktuelles
          </Link>
          <span className="text-stone-300">|</span>
          <h1 className="font-semibold text-stone-800 text-sm">
            {isEdit ? 'Beitrag bearbeiten' : 'Neuer Beitrag'}
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <form onSubmit={handleSubmit} className="space-y-5">
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
            <label className={labelClass}>Titel <span className="text-red-400">*</span></label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              maxLength={120}
              placeholder="z.B. Neuer Wurf angekommen!"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Text <span className="text-red-400">*</span></label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              required
              rows={10}
              maxLength={5000}
              placeholder="Was gibt's Neues aus deinem Zwinger?"
              className={inputClass}
            />
          </div>

          {isEdit && (
            <div>
              <label className={labelClass}>Bild (optional)</label>
              <NewsImageUploader newsPostId={post!.id} initialUrl={post!.imageUrl} initialMediaId={post!.mediaId} />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || !form.title || !form.content}
              className="flex-1 bg-forest text-white py-3 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors disabled:opacity-40"
            >
              {loading ? 'Wird gespeichert...' : isEdit ? 'Änderungen speichern' : 'Veröffentlichen'}
            </button>
            <Link
              href="/dashboard/news"
              className="px-6 py-3 border border-stone-200 rounded-xl text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Abbrechen
            </Link>
          </div>

          {isEdit && (
            <div className="pt-2 border-t border-cream-deep">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
              >
                {deleting ? 'Wird gelöscht...' : 'Beitrag löschen'}
              </button>
            </div>
          )}
        </form>
      </main>
      <SaveToast show={success} />
    </div>
  )
}
