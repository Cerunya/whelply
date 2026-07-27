'use client'

import { useState, useRef } from 'react'

type Props = {
  verificationLevel: string
  verifiedAt: string | null
  rejectReason: string | null
}

export default function VerifizierungSection({ verificationLevel, verifiedAt, rejectReason }: Props) {
  const [uploading, setUploading] = useState(false)
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) return setError('Bitte wähle eine Datei aus.')
    if (!consent) return setError('Bitte bestätige die Einwilligung.')

    setError('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('consent', 'true')
      const res = await fetch('/api/verifizierung', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Fehler beim Hochladen')
      }
      setSuccess(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  // Bereits verifiziert
  if (verificationLevel === 'doc_verified') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-lg">✓</div>
          <div>
            <p className="font-semibold text-green-800">Verifizierter Züchter</p>
            <p className="text-sm text-green-600">
              {verifiedAt ? `Verifiziert am ${new Date(verifiedAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Dein Profil ist verifiziert.'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Warte auf Prüfung
  if (verificationLevel === 'kennel_verified' && !success) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center text-white text-lg">⏳</div>
          <div>
            <p className="font-semibold text-amber-800">Verifizierung in Prüfung</p>
            <p className="text-sm text-amber-600">Dein Dokument wird von unserem Team geprüft. Das dauert in der Regel 1–2 Werktage.</p>
          </div>
        </div>
      </div>
    )
  }

  // Erfolgreich hochgeladen (gerade eben)
  if (success) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center text-white text-lg">⏳</div>
          <div>
            <p className="font-semibold text-amber-800">Dokument eingereicht</p>
            <p className="text-sm text-amber-600">Dein Dokument wird von unserem Team geprüft. Das dauert in der Regel 1–2 Werktage.</p>
          </div>
        </div>
      </div>
    )
  }

  // Upload-Formular
  return (
    <div className="bg-white border border-cream-deep rounded-2xl p-6">
      <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">Züchter-Verifizierung</h3>
      <p className="text-sm text-stone-500 mb-5">
        Verifizierte Züchter erhalten ein Badge auf ihrem Profil und werden bevorzugt angezeigt.
        Lade ein Dokument hoch, das deinen Züchterstatus belegt.
      </p>

      {rejectReason && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          <p className="font-semibold mb-0.5">Verifizierung abgelehnt</p>
          <p>{rejectReason}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Akzeptierte Dokumente</p>
          <ul className="text-sm text-stone-600 space-y-1">
            <li>• Zuchtzulassung deines Vereins</li>
            <li>• Mitgliedsausweis des Rassezuchtvereins</li>
            <li>• Ahnentafel eines eigenen Wurfes</li>
            <li>• Zwingerschutz-Urkunde (FCI/VDH)</li>
          </ul>
        </div>

        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-forest/10 file:text-forest hover:file:bg-forest/20 file:cursor-pointer"
          />
          <p className="text-xs text-stone-400 mt-1">JPG, PNG, WebP oder PDF · max. 10 MB</p>
        </div>

        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="w-4 h-4 mt-0.5 rounded border-stone-300 text-forest focus:ring-forest"
          />
          <span className="text-xs text-stone-500 leading-relaxed">
            Ich willige ein, dass dieses Dokument ausschließlich zur Verifizierung meines Züchterstatus
            verwendet und nach Prüfung automatisch gelöscht wird.
          </span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-forest text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-forest-light transition-colors disabled:opacity-40"
        >
          {uploading ? 'Wird hochgeladen...' : 'Dokument einreichen'}
        </button>
      </div>
    </div>
  )
}
