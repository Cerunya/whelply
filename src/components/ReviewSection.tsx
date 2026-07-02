'use client'

import { useState, useEffect } from 'react'

type Review = { id: string; rating: number; title: string | null; content: string | null; createdAt: string; user: { email: string } }

function Stars({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <button key={n} type="button" onClick={() => onChange?.(n)}
          className={`text-2xl transition-colors ${n <= value ? 'text-honey' : 'text-stone-200'} ${onChange ? 'hover:text-honey cursor-pointer' : 'cursor-default'}`}>
          ★
        </button>
      ))}
    </div>
  )
}

export default function ReviewSection({ breederId, isLoggedIn }: { breederId: string; isLoggedIn: boolean }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [avg, setAvg] = useState<number | null>(null)
  const [count, setCount] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ rating: 5, title: '', content: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch(`/api/reviews?breederId=${breederId}`)
      .then((r) => r.json())
      .then((d) => { setReviews(d.reviews ?? []); setAvg(d.avg); setCount(d.count ?? 0) })
  }, [breederId, success])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ breederId, ...form }),
    })
    setLoading(false)
    setSuccess(true)
    setShowForm(false)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="bg-white rounded-2xl border border-cream-deep p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-serif text-xl font-bold text-stone-900">Bewertungen</h2>
          {avg !== null && (
            <p className="text-stone-400 text-sm mt-0.5">
              {avg.toFixed(1)} / 5 · {count} {count === 1 ? 'Bewertung' : 'Bewertungen'}
            </p>
          )}
        </div>
        {isLoggedIn && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="text-sm font-semibold text-forest border border-forest/30 px-4 py-2 rounded-xl hover:bg-forest/5 transition-colors">
            Bewertung schreiben
          </button>
        )}
      </div>

      {success && <p className="text-green-700 text-sm bg-green-50 rounded-xl px-4 py-3 mb-4">✓ Bewertung gespeichert!</p>}

      {showForm && (
        <form onSubmit={submit} className="bg-cream rounded-xl p-4 mb-5 space-y-3">
          <div>
            <label className="text-xs font-semibold text-stone-600 mb-1 block">Bewertung</label>
            <Stars value={form.rating} onChange={(n) => setForm({ ...form, rating: n })} />
          </div>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Titel (optional)" className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30" />
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Deine Erfahrung..." rows={3} className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-forest/30" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50">Abbrechen</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm font-semibold text-white bg-forest rounded-lg hover:bg-forest-light disabled:opacity-50">
              {loading ? '...' : 'Speichern'}
            </button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-stone-400 text-sm">Noch keine Bewertungen.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border-b border-cream-deep pb-4 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <Stars value={r.rating} />
                <span className="text-xs text-stone-400">{new Date(r.createdAt).toLocaleDateString('de-DE')}</span>
              </div>
              {r.title && <p className="font-semibold text-stone-800 text-sm">{r.title}</p>}
              {r.content && <p className="text-stone-600 text-sm mt-1">{r.content}</p>}
              <p className="text-xs text-stone-300 mt-1">{r.user.email.replace(/(.{2}).+(@.+)/, '$1***$2')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
