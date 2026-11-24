'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DashboardHeader from './DashboardHeader'
import NewsImageUploader from './NewsImageUploader'
import RichEditor from './RichEditor'
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
      <DashboardHeader title={isEdit ? "Beitrag bearbeiten" : "Neuer Beitrag"} backHref="/dashboard/news" backLabel="Aktuelles" />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 font-serif text-2xl font-bold text-stone-900">{isEdit ? 'Beitrag bearbeiten' : 'Neuer Beitrag'}</h1>
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
            <RichEditor
              value={form.content}
              onChange={(val) => setForm({ ...form, content: val })}
              rows={10}
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

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={loading || !form.title || !form.content}
              className="min-h-11 w-full flex-1 rounded-xl bg-forest px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-forest-light disabled:opacity-40"
            >
              {loading ? 'Wird gespeichert...' : isEdit ? 'Änderungen speichern' : 'Veröffentlichen'}
            </button>
            <Link
              href="/dashboard/news"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-50"
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
