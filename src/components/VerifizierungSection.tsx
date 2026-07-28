'use client'

import { useState, useRef, useEffect } from 'react'

type Props = {
  verificationLevel: string
  verifiedAt: string | null
  rejectReason: string | null
  diditStatus: string | null
}

export default function VerifizierungSection({ verificationLevel, verifiedAt, rejectReason, diditStatus: initialDiditStatus }: Props) {
  const [diditStatus, setDiditStatus] = useState(initialDiditStatus)
  const [diditLoading, setDiditLoading] = useState(false)
  const [diditAvailable, setDiditAvailable] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [docSuccess, setDocSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Prüfe ob Didit-Checks diesen Monat noch verfügbar sind
  useEffect(() => {
    fetch('/api/verifizierung/didit')
      .then((r) => r.json())
      .then((d) => setDiditAvailable(d.available))
      .catch(() => setDiditAvailable(false))
  }, [])

  async function startDiditCheck() {
    setError('')
    setDiditLoading(true)
    try {
      const res = await fetch('/api/verifizierung/didit', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Fehler')
      // Weiterleitung zur Didit-Verifizierungsseite
      window.location.href = data.url
    } catch (e: any) {
      setError(e.message)
      setDiditLoading(false)
    }
  }

  async function handleDocUpload() {
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
      setDocSuccess(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }

  // ── Vollständig verifiziert ──
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
        {diditStatus !== 'approved' && diditAvailable && (
          <div className="mt-4 pt-4 border-t border-green-200">
            <p className="text-xs text-green-700 mb-2">Möchtest du zusätzlich deine Identität per Ausweischeck bestätigen?</p>
            <button onClick={startDiditCheck} disabled={diditLoading}
              className="text-xs font-bold text-green-700 border border-green-300 px-4 py-2 rounded-lg hover:bg-green-100 disabled:opacity-40">
              {diditLoading ? 'Wird gestartet...' : 'ID-Prüfung nachholen'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Dokument in Prüfung ──
  if (verificationLevel === 'kennel_verified' || docSuccess) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center text-white text-lg">⏳</div>
          <div>
            <p className="font-semibold text-amber-800">Verifizierung in Prüfung</p>
            <p className="text-sm text-amber-600">Dein Dokument wird von unserem Team geprüft. Das dauert in der Regel 1–2 Werktage.</p>
          </div>
        </div>
        {diditStatus !== 'approved' && diditAvailable && (
          <div className="mt-4 pt-4 border-t border-amber-200">
            <p className="text-xs text-amber-700 mb-2">Du kannst in der Zwischenzeit deine Identität per Ausweischeck bestätigen.</p>
            <button onClick={startDiditCheck} disabled={diditLoading}
              className="text-xs font-bold text-amber-700 border border-amber-300 px-4 py-2 rounded-lg hover:bg-amber-100 disabled:opacity-40">
              {diditLoading ? 'Wird gestartet...' : 'ID-Prüfung nachholen'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Zwei-Schritt-Verifizierung ──
  const idDone = diditStatus === 'approved'
  const idDeclined = diditStatus === 'declined'
  const idPending = diditStatus === 'pending'

  return (
    <div className="bg-white border border-cream-deep rounded-2xl p-6">
      <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">Züchter-Verifizierung</h3>
      <p className="text-sm text-stone-500 mb-6">
        Verifizierte Züchter erhalten ein Badge und werden bevorzugt angezeigt. Die Verifizierung besteht aus zwei Schritten.
      </p>

      {rejectReason && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
          <p className="font-semibold mb-0.5">Verifizierung abgelehnt</p>
          <p>{rejectReason}</p>
        </div>
      )}

      <div className="space-y-5">
        {/* ── Schritt 1: ID-Check ── */}
        <div className={`rounded-xl border p-5 ${idDone ? 'border-green-200 bg-green-50' : 'border-cream-deep'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${idDone ? 'bg-green-500' : 'bg-stone-300'}`}>
              {idDone ? '✓' : '1'}
            </div>
            <p className="font-semibold text-stone-900 text-sm">Identitätsprüfung</p>
          </div>

          {idDone ? (
            <p className="text-sm text-green-700 ml-10">Identität bestätigt</p>
          ) : idDeclined ? (
            <div className="ml-10">
              <p className="text-sm text-red-600 mb-2">ID-Prüfung fehlgeschlagen. Bitte versuche es erneut.</p>
              {diditAvailable && (
                <button onClick={startDiditCheck} disabled={diditLoading}
                  className="bg-forest text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-forest-light disabled:opacity-40">
                  {diditLoading ? 'Wird gestartet...' : 'Erneut versuchen'}
                </button>
              )}
            </div>
          ) : idPending ? (
            <p className="text-sm text-amber-600 ml-10">Deine ID wird geprüft. Bitte warte einen Moment und lade die Seite dann neu.</p>
          ) : diditAvailable ? (
            <div className="ml-10">
              <p className="text-xs text-stone-500 mb-3">
                Verifiziere deine Identität mit einem gültigen Ausweisdokument und einem kurzen Selfie. Dauert ca. 30 Sekunden.
              </p>
              <button onClick={startDiditCheck} disabled={diditLoading}
                className="bg-forest text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-forest-light disabled:opacity-40">
                {diditLoading ? 'Wird gestartet...' : 'ID-Prüfung starten'}
              </button>
            </div>
          ) : (
            <p className="text-xs text-stone-400 ml-10">
              Die automatische ID-Prüfung ist diesen Monat nicht verfügbar. Du kannst direkt mit Schritt 2 fortfahren.
            </p>
          )}
        </div>

        {/* ── Schritt 2: Dokument-Upload ── */}
        <div className={`rounded-xl border p-5 ${!idDone && diditAvailable ? 'border-cream-deep opacity-50' : 'border-cream-deep'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-7 h-7 rounded-full bg-stone-300 flex items-center justify-center text-white text-xs font-bold">2</div>
            <p className="font-semibold text-stone-900 text-sm">Züchterstatus belegen</p>
          </div>

          {(!idDone && diditAvailable) ? (
            <p className="text-xs text-stone-400 ml-10">Bitte schließe zuerst die Identitätsprüfung ab.</p>
          ) : (
            <div className="ml-10 space-y-3">
              <div>
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Akzeptierte Dokumente</p>
                <ul className="text-xs text-stone-600 space-y-0.5">
                  <li>• Zuchtzulassung deines Vereins</li>
                  <li>• Mitgliedsausweis des Rassezuchtvereins</li>
                  <li>• Ahnentafel eines eigenen Wurfes</li>
                  <li>• Zwingerschutz-Urkunde (FCI/VDH)</li>
                </ul>
              </div>

              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                className="block w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-forest/10 file:text-forest hover:file:bg-forest/20 file:cursor-pointer" />
              <p className="text-xs text-stone-400">JPG, PNG, WebP oder PDF · max. 10 MB</p>

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-stone-300 text-forest focus:ring-forest" />
                <span className="text-xs text-stone-500 leading-relaxed">
                  Ich willige ein, dass dieses Dokument ausschließlich zur Verifizierung meines Züchterstatus
                  verwendet und nach Prüfung automatisch gelöscht wird.
                </span>
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button onClick={handleDocUpload} disabled={uploading}
                className="bg-forest text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-forest-light disabled:opacity-40">
                {uploading ? 'Wird hochgeladen...' : 'Dokument einreichen'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
