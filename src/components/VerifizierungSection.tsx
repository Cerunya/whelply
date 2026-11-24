'use client'

import { useState, useRef, useEffect } from 'react'

type Props = {
  verificationLevel: string
  verifiedAt: string | null
  rejectReason: string | null
  diditStatus: string | null
  idDocPending?: boolean
  idDocRejectReason?: string | null
}

export default function VerifizierungSection({ verificationLevel, verifiedAt, rejectReason, diditStatus: initialDiditStatus, idDocPending = false, idDocRejectReason = null }: Props) {
  const [diditStatus, setDiditStatus] = useState(initialDiditStatus)
  const [diditLoading, setDiditLoading] = useState(false)
  const [diditAvailable, setDiditAvailable] = useState<boolean | null>(null)
  const [uploading, setUploading] = useState(false)
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState('')
  const [docSuccess, setDocSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  // Manuelle ID-Prüfung (Ausweis-Upload)
  const [idManualPending, setIdManualPending] = useState(idDocPending)
  const [idUploading, setIdUploading] = useState(false)
  const [idConsent, setIdConsent] = useState(false)
  const [idFileNames, setIdFileNames] = useState({ front: '', back: '', selfie: '' })
  const frontRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)
  const selfieRef = useRef<HTMLInputElement>(null)

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

  async function handleIdUpload() {
    const front = frontRef.current?.files?.[0]
    const back = backRef.current?.files?.[0]
    const selfie = selfieRef.current?.files?.[0]
    if (!front) return setError('Bitte lade mindestens die Vorderseite deines Ausweises hoch.')
    if (!selfie) return setError('Bitte lade ein Selfie hoch, auf dem du deinen Ausweis in der Hand hältst.')
    if (!idConsent) return setError('Bitte bestätige die Einwilligung.')
    setError('')
    setIdUploading(true)
    try {
      const formData = new FormData()
      formData.append('front', front)
      if (back) formData.append('back', back)
      formData.append('selfie', selfie)
      formData.append('consent', 'true')
      const res = await fetch('/api/verifizierung/id', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Fehler beim Hochladen')
      }
      setIdManualPending(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIdUploading(false)
    }
  }

  const idDone = diditStatus === 'approved'
  const idDeclined = diditStatus === 'declined'
  const idPending = diditStatus === 'pending'

  function renderIdUploadField(label: string, field: 'front' | 'back' | 'selfie', inputRef: { current: HTMLInputElement | null }, optional = false) {
    const fileName = idFileNames[field]
    const selfie = field === 'selfie'
    return (
      <div>
        <input
          ref={(node) => { inputRef.current = node }}
          type="file"
          accept={selfie ? 'image/jpeg,image/png,image/webp' : 'image/jpeg,image/png,image/webp,application/pdf'}
          className="sr-only"
          aria-label={label}
          onChange={(e) => setIdFileNames((current) => ({ ...current, [field]: e.target.files?.[0]?.name ?? '' }))}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`flex min-h-[76px] w-full items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-forest/30 ${fileName ? 'border-forest/40 bg-forest/5' : 'border-stone-300 bg-[#fcfbf7] hover:border-forest/50 hover:bg-forest/5'}`}
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-forest/10 text-forest" aria-hidden="true">
            {fileName ? '✓' : selfie ? '📷' : '↑'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-forest">{label}{optional && <span className="ml-2 text-[10px] font-normal text-stone-500">Optional</span>}</span>
            <span className="mt-1 block truncate text-xs text-stone-500">{fileName || (selfie ? 'Foto aufnehmen oder auswählen' : 'Bild oder PDF auswählen')}</span>
          </span>
          <span className="hidden text-xs font-bold text-forest sm:inline">{fileName ? 'Ändern' : 'Auswählen'}</span>
        </button>
      </div>
    )
  }

  function renderManualIdUpload() {
    return (
      <div className="mt-5 overflow-hidden rounded-2xl border border-cream-deep bg-white">
        <div className="grid lg:grid-cols-[minmax(230px,0.72fr)_1.5fr]">
          <aside className="bg-[#f2f4ed] p-5 sm:p-6">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-forest/10 text-xl text-forest" aria-hidden="true">🪪</span>
            <span className="mb-3 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800">ID-Prüfung ausstehend</span>
            <h4 className="font-serif text-xl font-bold text-forest">Noch ein letzter Schritt.</h4>
            <p className="mt-2 text-xs leading-relaxed text-stone-600">Dein Züchterstatus ist bereits bestätigt. Für die vollständige Verifizierung fehlt nur noch die Prüfung deiner Identität.</p>
            <ul className="mt-5 space-y-2.5 text-xs text-stone-600">
              <li className="flex items-center gap-2"><span className="text-forest">✓</span>Persönliche Prüfung durch unser Team</li>
              <li className="flex items-center gap-2"><span className="text-forest">✓</span>Maximale Dateigröße: 10 MB</li>
              <li className="flex items-center gap-2"><span className="text-forest">✓</span>Automatische Löschung nach der Prüfung</li>
            </ul>
            <div className="mt-5 flex items-start gap-2 border-t border-stone-200 pt-4 text-xs leading-relaxed text-stone-600">
              <span aria-hidden="true">🔒</span><p><strong className="text-forest">Deine Dokumente sind geschützt.</strong> Sie werden nur zur Prüfung verwendet und anschließend automatisch gelöscht.</p>
            </div>
          </aside>
          <div className="space-y-3 p-5 sm:p-6">
            {idDeclined && <p className="text-sm text-red-600">Die automatische ID-Prüfung ist fehlgeschlagen.</p>}
            {idDocRejectReason && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p className="mb-0.5 font-semibold">ID-Prüfung abgelehnt</p>
                <p>{idDocRejectReason}</p>
              </div>
            )}
            {renderIdUploadField('Ausweis Vorderseite', 'front', frontRef)}
            {renderIdUploadField('Ausweis Rückseite', 'back', backRef, true)}
            {renderIdUploadField('Selfie mit Ausweis', 'selfie', selfieRef)}
            <label className="flex cursor-pointer items-start gap-2.5 pt-1">
              <input type="checkbox" checked={idConsent} onChange={(e) => setIdConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-stone-300 text-forest focus:ring-forest" />
              <span className="text-xs leading-relaxed text-stone-600">Ich willige ein, dass diese Dateien ausschließlich zur Prüfung meiner Identität verwendet und nach der Entscheidung automatisch gelöscht werden.</span>
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="button" onClick={handleIdUpload} disabled={idUploading}
              className="min-h-11 rounded-xl bg-forest px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-forest-light disabled:opacity-40">
              {idUploading ? 'Wird hochgeladen...' : 'Dokumente zur Prüfung einreichen'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Vollständig verifiziert ──
  if (verificationLevel === 'doc_verified') {
    return (
      <div className="overflow-hidden rounded-2xl border border-green-200 bg-white">
        <div className="bg-green-50 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-500 text-lg text-white">✓</div>
            <div>
              <p className="font-semibold text-green-800">Verifizierter Züchter</p>
              <p className="text-sm text-green-600">
                {verifiedAt ? `Züchterstatus bestätigt am ${new Date(verifiedAt).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Dein Züchterstatus ist bestätigt.'}
              </p>
            </div>
            <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-green-200 px-2.5 py-1 text-[10px] font-bold text-green-700 sm:inline-flex">✓ Zucht bestätigt</span>
          </div>
        </div>
        {diditStatus === 'approved' && <p className="px-5 py-4 text-xs text-green-700 sm:px-6">🪪 ID bestätigt</p>}
        {diditStatus !== 'approved' && diditAvailable === true && !idManualPending && (
          <div className="m-5 rounded-xl border border-green-200 bg-green-50 p-4 sm:m-6">
            <p className="mb-2 text-xs text-green-700">Möchtest du zusätzlich deine Identität per Ausweischeck bestätigen?</p>
            <button onClick={startDiditCheck} disabled={diditLoading}
              className="rounded-lg border border-green-300 px-4 py-2 text-xs font-bold text-green-700 hover:bg-green-100 disabled:opacity-40">
              {diditLoading ? 'Wird gestartet...' : 'ID-Prüfung nachholen'}
            </button>
          </div>
        )}
        {diditStatus !== 'approved' && diditAvailable === false && !idManualPending && <div className="p-5 pt-0 sm:p-6 sm:pt-0">{renderManualIdUpload()}</div>}
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
        {diditStatus !== 'approved' && diditAvailable === true && !idManualPending && (
          <div className="mt-4 pt-4 border-t border-amber-200">
            <p className="text-xs text-amber-700 mb-2">Du kannst in der Zwischenzeit deine Identität per Ausweischeck bestätigen.</p>
            <button onClick={startDiditCheck} disabled={diditLoading}
              className="text-xs font-bold text-amber-700 border border-amber-300 px-4 py-2 rounded-lg hover:bg-amber-100 disabled:opacity-40">
              {diditLoading ? 'Wird gestartet...' : 'ID-Prüfung nachholen'}
            </button>
          </div>
        )}
        {diditStatus !== 'approved' && diditAvailable === false && !idManualPending && renderManualIdUpload()}
      </div>
    )
  }

  // ── Zwei-Schritt-Verifizierung ──

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
          ) : idManualPending ? (
            <div className="ml-10">
              <p className="text-sm text-amber-600">Dein Ausweis wird manuell geprüft. Das dauert in der Regel 1–2 Werktage.</p>
            </div>
          ) : idPending ? (
            <div className="ml-10">
              <p className="text-sm text-amber-600 mb-2">Deine ID wird geprüft.</p>
              <button onClick={async () => {
                setError('')
                setDiditLoading(true)
                try {
                  const res = await fetch('/api/verifizierung/didit', { method: 'PATCH' })
                  const data = await res.json()
                  if (data.status === 'approved') {
                    setDiditStatus('approved')
                  } else if (data.status === 'declined') {
                    setDiditStatus('declined')
                  } else {
                    setError('Prüfung läuft noch. Versuche es in ein paar Minuten erneut.')
                  }
                } catch { setError('Fehler beim Abrufen.') }
                setDiditLoading(false)
              }} disabled={diditLoading}
                className="text-xs font-bold text-amber-700 border border-amber-300 px-4 py-2 rounded-lg hover:bg-amber-100 disabled:opacity-40">
                {diditLoading ? 'Wird geprüft...' : 'Status aktualisieren'}
              </button>
            </div>
          ) : diditAvailable === false ? (
            renderManualIdUpload()
          ) : diditAvailable === null ? (
            <p className="text-xs text-stone-400 ml-10">Prüfmöglichkeiten werden geladen...</p>
          ) : idDeclined ? (
            <div className="ml-10">
              <p className="text-sm text-red-600 mb-2">ID-Prüfung fehlgeschlagen. Bitte versuche es erneut.</p>
              <button onClick={startDiditCheck} disabled={diditLoading}
                className="bg-forest text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-forest-light disabled:opacity-40">
                {diditLoading ? 'Wird gestartet...' : 'Erneut versuchen'}
              </button>
            </div>
          ) : (
            <div className="ml-10">
              <p className="text-xs text-stone-500 mb-3">
                Verifiziere deine Identität mit einem gültigen Ausweisdokument und einem kurzen Selfie. Dauert ca. 30 Sekunden.
              </p>
              <button onClick={startDiditCheck} disabled={diditLoading}
                className="bg-forest text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-forest-light disabled:opacity-40">
                {diditLoading ? 'Wird gestartet...' : 'ID-Prüfung starten'}
              </button>
            </div>
          )}
        </div>

        {/* ── Schritt 2: Dokument-Upload ── */}
        <div className={`rounded-xl border p-5 ${!idDone && !idManualPending && diditAvailable === true ? 'border-cream-deep opacity-50' : 'border-cream-deep'}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-7 h-7 rounded-full bg-stone-300 flex items-center justify-center text-white text-xs font-bold">2</div>
            <p className="font-semibold text-stone-900 text-sm">Züchterstatus belegen</p>
          </div>

          {(!idDone && !idManualPending && diditAvailable === true) ? (
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
