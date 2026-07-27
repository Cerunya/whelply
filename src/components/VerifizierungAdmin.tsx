'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type PendingItem = {
  id: string
  kennelName: string
  email: string
  verband: string | null
  mitgliedsnummer: string | null
  docKey: string
  requestedAt: string
}

export default function VerifizierungAdmin({ pending }: { pending: PendingItem[] }) {
  const router = useRouter()
  const [processing, setProcessing] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  async function handleAction(id: string, action: 'approve' | 'reject', reason?: string) {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/verifizierung/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setProcessing(null)
      setRejectId(null)
      setRejectReason('')
    }
  }

  return (
    <div className="space-y-4">
      {pending.map((item) => (
        <div key={item.id} className="bg-white rounded-2xl border border-cream-deep p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="font-serif font-bold text-stone-900 text-lg">{item.kennelName}</p>
              <p className="text-sm text-stone-500">{item.email}</p>
              <div className="flex gap-4 mt-2 text-xs text-stone-400">
                {item.verband && <span>Verband: <span className="text-stone-700 font-medium">{item.verband}</span></span>}
                {item.mitgliedsnummer && <span>Nr: <span className="text-stone-700 font-medium">{item.mitgliedsnummer}</span></span>}
                <span>Eingereicht: {new Date(item.requestedAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>

          {/* Dokument-Vorschau */}
          <div className="mb-4 rounded-xl overflow-hidden border border-cream-deep bg-cream">
            {item.docKey.endsWith('.pdf') ? (
              <div className="p-8 text-center">
                <p className="text-stone-500 text-sm mb-2">PDF-Dokument</p>
                <a
                  href={`/api/media/${item.docKey}/view`}
                  target="_blank"
                  rel="noopener"
                  className="text-forest text-sm font-medium hover:underline"
                >
                  PDF öffnen →
                </a>
              </div>
            ) : (
              <img
                src={`/api/media/${item.docKey}/view`}
                alt="Verifizierungsdokument"
                className="w-full max-h-96 object-contain"
              />
            )}
          </div>

          {/* Ablehnung mit Grund */}
          {rejectId === item.id ? (
            <div className="space-y-3">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ablehnungsgrund (wird dem Züchter angezeigt)..."
                className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(item.id, 'reject', rejectReason)}
                  disabled={processing === item.id}
                  className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-40"
                >
                  {processing === item.id ? '...' : 'Ablehnen'}
                </button>
                <button
                  onClick={() => { setRejectId(null); setRejectReason('') }}
                  className="text-sm text-stone-500 hover:text-stone-700 px-3"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => handleAction(item.id, 'approve')}
                disabled={processing === item.id}
                className="bg-green-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-green-700 disabled:opacity-40"
              >
                {processing === item.id ? 'Wird verarbeitet...' : '✓ Verifizieren'}
              </button>
              <button
                onClick={() => setRejectId(item.id)}
                className="border border-red-300 text-red-600 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-red-50"
              >
                ✕ Ablehnen
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
