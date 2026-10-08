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

type IdPendingItem = {
  id: string
  kennelName: string
  fullName: string | null
  email: string
  docKey: string
  backKey: string | null
  selfieKey: string | null
  requestedAt: string
}

function DocPreview({ docKey, label }: { docKey: string; label: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-cream-deep bg-cream">
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide px-3 pt-3">{label}</p>
      {docKey.endsWith('.pdf') ? (
        <div className="p-8 text-center">
          <p className="text-stone-500 text-sm mb-2">PDF-Dokument</p>
          <a
            href={`/api/media/${docKey}/view`}
            target="_blank"
            rel="noopener"
            className="text-forest text-sm font-medium hover:underline"
          >
            PDF öffnen →
          </a>
        </div>
      ) : (
        <img
          src={`/api/media/${docKey}/view`}
          alt={label}
          className="w-full max-h-96 object-contain"
        />
      )}
    </div>
  )
}

function ActionButtons({ apiPath, itemId }: { apiPath: string; itemId: string }) {
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  async function handleAction(action: 'approve' | 'reject', reason?: string) {
    setProcessing(true)
    try {
      const res = await fetch(`${apiPath}/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })
      if (res.ok) {
        router.refresh()
      }
    } finally {
      setProcessing(false)
      setRejecting(false)
      setRejectReason('')
    }
  }

  if (rejecting) {
    return (
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
            onClick={() => handleAction('reject', rejectReason)}
            disabled={processing}
            className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-40"
          >
            {processing ? '...' : 'Ablehnen'}
          </button>
          <button
            onClick={() => { setRejecting(false); setRejectReason('') }}
            className="text-sm text-stone-500 hover:text-stone-700 px-3"
          >
            Abbrechen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handleAction('approve')}
        disabled={processing}
        className="bg-green-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-green-700 disabled:opacity-40"
      >
        {processing ? 'Wird verarbeitet...' : '✓ Verifizieren'}
      </button>
      <button
        onClick={() => setRejecting(true)}
        className="border border-red-300 text-red-600 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-red-50"
      >
        ✕ Ablehnen
      </button>
    </div>
  )
}

export default function VerifizierungAdmin({ pending, idPending }: { pending: PendingItem[]; idPending: IdPendingItem[] }) {
  return (
    <div className="space-y-10">
      {/* ── Manuelle ID-Prüfungen ── */}
      {idPending.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-stone-900">ID-Prüfungen ({idPending.length})</h2>
            <p className="text-xs text-stone-500 mt-1">
              Prüfe, ob der Name auf dem Ausweis zum Profilnamen passt und ob das Selfie zur Person auf dem Ausweis passt. Die Dokumente werden nach deiner Entscheidung sofort gelöscht.
            </p>
          </div>
          {idPending.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-cream-deep p-6">
              <div className="mb-4">
                <p className="font-serif font-bold text-stone-900 text-lg">{item.kennelName}</p>
                <p className="text-sm text-stone-500">{item.email}</p>
                <div className="flex gap-4 mt-2 text-xs text-stone-400">
                  {item.fullName && (
                    <span>Name im Profil: <span className="text-stone-700 font-medium">{item.fullName}</span></span>
                  )}
                  <span>Eingereicht: {new Date(item.requestedAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>

              <div className="grid gap-4 mb-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <DocPreview docKey={item.docKey} label="Ausweis Vorderseite" />
                {item.backKey && <DocPreview docKey={item.backKey} label="Ausweis Rückseite" />}
                {item.selfieKey && <DocPreview docKey={item.selfieKey} label="Selfie mit Ausweis" />}
              </div>

              <ActionButtons apiPath="/api/admin/id-verifizierung" itemId={item.id} />
            </div>
          ))}
        </section>
      )}

      {/* ── Züchterstatus-Verifizierungen ── */}
      {pending.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-serif text-lg font-bold text-stone-900">Züchterstatus ({pending.length})</h2>
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

              <div className="mb-4">
                <DocPreview docKey={item.docKey} label="Verifizierungsdokument" />
              </div>

              <ActionButtons apiPath="/api/admin/verifizierung" itemId={item.id} />
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
