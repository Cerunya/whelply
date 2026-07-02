'use client'

import { useState } from 'react'

type Props = {
  initialPublished: boolean
  initialActive: boolean
}

export default function BreederStatusToggles({ initialPublished, initialActive }: Props) {
  const [published, setPublished] = useState(initialPublished)
  const [active, setActive] = useState(initialActive)
  const [saving, setSaving] = useState(false)

  async function toggle(field: 'isPublished' | 'isActive', value: boolean) {
    setSaving(true)
    try {
      await fetch('/api/profil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (field === 'isPublished') {
        setPublished(value)
      } else {
        setActive(value)
        // Seite wird automatisch ausgeschaltet wenn Profil inaktiv
        if (!value) setPublished(false)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 items-end flex-shrink-0">
      {/* Seite sichtbar Toggle */}
      <label className="flex items-center gap-2 cursor-pointer group">
        <span className={`text-xs font-medium transition-colors ${published ? 'text-forest' : 'text-stone-400'}`}>
          {published ? 'Seite öffentlich' : 'Seite versteckt'}
        </span>
        <button
          type="button"
          disabled={saving}
          onClick={() => toggle('isPublished', !published)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60 ${
            published ? 'bg-forest' : 'bg-stone-300'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            published ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </label>

      {/* Profil aktiv Toggle */}
      <label className="flex items-center gap-2 cursor-pointer group">
        <span className={`text-xs font-medium transition-colors ${active ? 'text-forest' : 'text-amber-600'}`}>
          {active ? 'Profil aktiv' : 'Profil inaktiv'}
        </span>
        <button
          type="button"
          disabled={saving}
          onClick={() => toggle('isActive', !active)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-60 ${
            active ? 'bg-forest' : 'bg-amber-400'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            active ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </label>
    </div>
  )
}
