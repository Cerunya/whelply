'use client'

import { useState } from 'react'

export default function NutzerNameForm({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setLoading(true)
    await fetch('/api/user-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: name }),
    })
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Dein Name"
        maxLength={80}
        className="flex-1 border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest"
      />
      <button
        onClick={save}
        disabled={loading}
        className="px-4 py-2.5 bg-forest text-white text-sm font-semibold rounded-xl hover:bg-forest-light transition-colors disabled:opacity-40"
      >
        {saved ? '✓' : loading ? '...' : 'Speichern'}
      </button>
    </div>
  )
}
