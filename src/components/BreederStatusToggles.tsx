'use client'

import { useState } from 'react'

type Props = {
  initialPublished: boolean
  initialActive: boolean
  onDark?: boolean
}

export default function BreederStatusToggles({ initialPublished, initialActive, onDark = false }: Props) {
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

  const rowClass = onDark
    ? 'flex w-full cursor-pointer items-center justify-between gap-4 rounded-xl bg-white/10 px-3 py-2.5'
    : 'group flex cursor-pointer items-center gap-2'
  const switchClass = 'relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full border transition-colors disabled:opacity-60'

  return (
    <div className={`flex flex-shrink-0 flex-col gap-2 ${onDark ? 'w-full' : 'items-end'}`}>
      {/* Seite sichtbar Toggle */}
      <label className={rowClass}>
        <span className={`text-xs font-medium transition-colors ${onDark ? 'text-white' : published ? 'text-forest' : 'text-stone-400'}`}>
          {published ? 'Seite öffentlich' : 'Seite versteckt'}
        </span>
        <button
          type="button"
          aria-label={published ? 'Seite verstecken' : 'Seite veröffentlichen'}
          aria-pressed={published}
          disabled={saving}
          onClick={() => toggle('isPublished', !published)}
          className={`${switchClass} ${onDark ? 'border-white/30' : 'border-transparent'} ${
            published ? onDark ? 'bg-honey' : 'bg-forest' : onDark ? 'bg-white/25' : 'bg-stone-300'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            published ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      </label>

      {/* Profil aktiv Toggle */}
      <label className={rowClass}>
        <span className={`text-xs font-medium transition-colors ${onDark ? 'text-white' : active ? 'text-forest' : 'text-amber-600'}`}>
          {active ? 'Profil aktiv' : 'Profil inaktiv'}
        </span>
        <button
          type="button"
          aria-label={active ? 'Profil deaktivieren' : 'Profil aktivieren'}
          aria-pressed={active}
          disabled={saving}
          onClick={() => toggle('isActive', !active)}
          className={`${switchClass} ${onDark ? 'border-white/30' : 'border-transparent'} ${
            active ? onDark ? 'bg-honey' : 'bg-forest' : onDark ? 'bg-white/25' : 'bg-amber-400'
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
