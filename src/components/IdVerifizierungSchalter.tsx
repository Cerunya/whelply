'use client'

import { useState } from 'react'

// Schalter für /admin/einstellungen — ID-Verifizierung: Didit (Online) oder manuell.
// Speichert über PATCH /api/admin/einstellungen in platform_settings (Key: id_verification_mode).
export default function IdVerifizierungSchalter({ initialMode }: { initialMode: 'didit' | 'manual' }) {
  const [mode, setMode] = useState<'didit' | 'manual'>(initialMode)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function switchMode(next: 'didit' | 'manual') {
    if (next === mode || saving) return
    setSaving(true)
    setError(null)
    setSaved(false)
    const res = await fetch('/api/admin/einstellungen', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idVerificationMode: next }),
    })
    setSaving(false)
    if (res.ok) {
      setMode(next)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Fehler beim Speichern.')
    }
  }

  const btnBase = 'px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40'
  const btnActive = 'bg-forest text-white'
  const btnInactive = 'border border-stone-200 text-stone-600 hover:border-forest hover:text-forest'

  return (
    <div className="bg-white rounded-2xl border border-cream-deep p-6">
      <h2 className="font-semibold text-stone-900 mb-1">Anbieter der ID-Prüfung</h2>
      <p className="text-xs text-stone-400 mb-4">
        <strong className="text-stone-600">Online (Didit):</strong> Züchter prüfen ihre Identität automatisch
        per Ausweis + Selfie — kostenpflichtig pro Check.{' '}
        <strong className="text-stone-600">Manuell:</strong> Züchter laden Ausweis (Vorder-/Rückseite) und ein
        Selfie mit Ausweis hoch — du prüfst unter „Verifizierungen". Die Umschaltung gilt sofort für alle Züchter.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => switchMode('didit')}
          disabled={saving}
          className={`${btnBase} ${mode === 'didit' ? btnActive : btnInactive}`}
        >
          🪪 Online (Didit)
        </button>
        <button
          onClick={() => switchMode('manual')}
          disabled={saving}
          className={`${btnBase} ${mode === 'manual' ? btnActive : btnInactive}`}
        >
          ✋ Manuell prüfen
        </button>
        {saved && (
          <span className="text-sm text-green-700 font-medium">✓ Gespeichert — gilt sofort</span>
        )}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
      <p className="text-xs text-stone-400 mt-3">
        Bereits laufende oder abgeschlossene Prüfungen bleiben unverändert gültig — egal welcher Modus aktiv ist.
      </p>
    </div>
  )
}
