'use client'

import { useState } from 'react'
import RichEditor from './RichEditor'
import SaveToast from './SaveToast'
import Link from 'next/link'

export default function UeberUnsForm({
  initialBio,
}: {
  initialBio: string
}) {
  const [bio, setBio] = useState(initialBio)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const inputClass = 'w-full border border-stone-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest bg-white'

  async function handleSave() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/profil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio }),
    })
    setLoading(false)
    if (res.ok) setSuccess(true)
    else setError('Fehler beim Speichern.')
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="text-stone-400 hover:text-stone-600 text-sm">
            ← Dashboard
          </Link>
        </div>

        <h1 className="font-serif text-2xl font-bold text-stone-900 mb-6">Über uns & Karten-Bild</h1>

        <div className="space-y-5">
          {/* Bio */}
          <div className="bg-white rounded-2xl border border-cream-deep p-7 space-y-4">
            <div>
              <h2 className="font-semibold text-stone-800 text-sm uppercase tracking-wide mb-1">Über dich / deine Zucht</h2>
              <p className="text-xs text-stone-400 mb-3">
                Dieser Text erscheint auf deiner öffentlichen Züchterseite.
              </p>
              <RichEditor
                value={bio}
                onChange={setBio}
                rows={8}
                placeholder={'Erzähl etwas über deine Zucht, Philosophie, Erfahrung...\n\nDu kannst auch Bilder und YouTube-Videos einfügen.'}
                className={inputClass + ' resize-y'}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
            )}

            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-forest text-white py-3 rounded-xl text-sm font-bold hover:bg-forest-light transition-colors disabled:opacity-40"
            >
              {loading ? 'Wird gespeichert...' : 'Text speichern'}
            </button>
          </div>
        </div>
      </div>
      <SaveToast show={success} />
    </div>
  )
}
