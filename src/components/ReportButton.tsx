'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const REASONS = [
  { value: 'spam', label: 'Spam oder Werbung' },
  { value: 'falsche_infos', label: 'Falsche Informationen' },
  { value: 'betrug', label: 'Verdacht auf Betrug' },
  { value: 'unangemessen', label: 'Unangemessener Inhalt' },
  { value: 'sonstiges', label: 'Sonstiges' },
]

export default function ReportButton({ listingId, isLoggedIn }: { listingId: string; isLoggedIn: boolean }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('spam')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function submit() {
    if (!isLoggedIn) { router.push('/login'); return }
    setLoading(true)
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, reason, comment }),
    })
    setLoading(false)
    setDone(true)
    setTimeout(() => { setOpen(false); setDone(false) }, 2000)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => isLoggedIn ? setOpen(true) : router.push('/login')}
        className="text-xs text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        Melden
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-stone-900 mb-4">Inserat melden</h3>
            {done ? (
              <p className="text-green-700 text-sm text-center py-4">✓ Meldung eingereicht. Danke!</p>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {REASONS.map((r) => (
                    <label key={r.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="reason" value={r.value} checked={reason === r.value}
                        onChange={() => setReason(r.value)} className="accent-forest" />
                      <span className="text-sm text-stone-700">{r.label}</span>
                    </label>
                  ))}
                </div>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder="Optionale Erläuterung..." rows={3}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2 text-sm resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-forest/30" />
                <div className="flex gap-2">
                  <button onClick={() => setOpen(false)} className="flex-1 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50">
                    Abbrechen
                  </button>
                  <button onClick={submit} disabled={loading}
                    className="flex-1 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50">
                    {loading ? '...' : 'Melden'}
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
