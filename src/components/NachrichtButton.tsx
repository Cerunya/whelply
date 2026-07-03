'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NachrichtButton({
  breederId,
  kennelName,
  isLoggedIn,
  isOwnProfile,
}: {
  breederId: string
  kennelName: string
  isLoggedIn: boolean
  isOwnProfile: boolean
}) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  if (isOwnProfile) return null

  async function send() {
    if (!isLoggedIn) { router.push('/login'); return }
    if (!content.trim()) return
    setLoading(true)
    setError('')
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ breederId, content }),
    })
    const data = await res.json()
    setLoading(false)
    if (res.ok) {
      setDone(true)
    } else {
      setError(data.error ?? 'Fehler beim Senden.')
    }
  }

  return (
    <>
      <button
        onClick={() => isLoggedIn ? setOpen(true) : router.push('/login')}
        className="flex items-center gap-2 text-sm font-semibold text-forest border-2 border-forest/30 px-4 py-2.5 rounded-xl hover:bg-forest/5 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
        Nachricht schreiben
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            {done ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-3">✓</p>
                <p className="font-semibold text-stone-900 mb-1">Nachricht gesendet!</p>
                <p className="text-stone-400 text-sm mb-6">{kennelName} wird dich so bald wie möglich kontaktieren.</p>
                <button onClick={() => { setOpen(false); setDone(false); setContent('') }}
                  className="text-sm text-forest font-semibold hover:underline">Schließen</button>
              </div>
            ) : (
              <>
                <h2 className="font-serif text-xl font-bold text-stone-900 mb-1">Nachricht an {kennelName}</h2>
                <p className="text-stone-400 text-sm mb-5">Stelle deine Fragen direkt an den Züchter.</p>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Deine Nachricht..."
                  rows={5}
                  maxLength={2000}
                  className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-forest/30 mb-1"
                />
                <p className="text-xs text-stone-300 text-right mb-4">{content.length}/2000</p>
                {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={() => setOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50">
                    Abbrechen
                  </button>
                  <button onClick={send} disabled={loading || !content.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-forest text-white text-sm font-bold hover:bg-forest-light disabled:opacity-40">
                    {loading ? '...' : 'Senden'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
