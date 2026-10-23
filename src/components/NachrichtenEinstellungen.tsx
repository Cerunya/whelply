'use client'

import { useState } from 'react'

// Checkbox: E-Mail-Benachrichtigung bei neuen Nachrichten (nur für Züchter)
export default function NachrichtenEinstellungen({ initial }: { initial: boolean }) {
  const [optIn, setOptIn] = useState(initial)
  const [saving, setSaving] = useState(false)

  async function toggle() {
    const next = !optIn
    setOptIn(next) // optimistisch
    setSaving(true)
    try {
      const res = await fetch('/api/nachrichten-einstellungen', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optIn: next }),
      })
      if (!res.ok) setOptIn(!next) // Rollback bei Fehler
    } catch {
      setOptIn(!next)
    }
    setSaving(false)
  }

  return (
    <label className="flex items-start gap-3 bg-white rounded-xl border border-cream-deep p-4 mb-6 cursor-pointer">
      <input
        type="checkbox"
        checked={optIn}
        onChange={toggle}
        disabled={saving}
        className="w-4 h-4 mt-0.5 accent-forest flex-shrink-0"
      />
      <span>
        <span className="block text-sm font-semibold text-stone-900">E-Mail-Benachrichtigung</span>
        <span className="block text-xs text-stone-500 mt-0.5">
          Schick mir eine E-Mail, wenn mir jemand eine neue Nachricht schreibt.
        </span>
      </span>
    </label>
  )
}
