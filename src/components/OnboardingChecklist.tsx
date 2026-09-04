'use client'

import { useState } from 'react'
import Link from 'next/link'

export type OnboardingItem = {
  key: string
  label: string
  href: string
  done: boolean
}

export default function OnboardingChecklist({
  title,
  subtitle,
  items,
}: {
  title: string
  subtitle?: string
  items: OnboardingItem[]
}) {
  const [hidden, setHidden] = useState(false)
  const [saving, setSaving] = useState(false)

  if (hidden) return null

  const doneCount = items.filter((i) => i.done).length
  const allDone = doneCount === items.length
  const pct = Math.round((doneCount / items.length) * 100)

  async function dismiss() {
    setSaving(true)
    try {
      const res = await fetch('/api/onboarding', { method: 'PATCH' })
      if (res.ok) setHidden(true)
    } catch {
      // Netzwerkfehler — Liste bleibt sichtbar
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-cream-deep p-6 mb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-lg font-bold text-stone-900">{title}</h2>
          {subtitle && <p className="text-xs text-stone-400 mt-0.5">{subtitle}</p>}
        </div>
        <button
          onClick={dismiss}
          disabled={saving}
          className="text-xs text-stone-400 hover:text-stone-600 transition-colors whitespace-nowrap disabled:opacity-50"
        >
          {saving ? '…' : 'Ausblenden'}
        </button>
      </div>

      {/* Fortschritt */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-2 bg-cream-deep rounded-full overflow-hidden">
          <div
            className="h-full bg-forest rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-stone-400 whitespace-nowrap">
          {doneCount} von {items.length}
        </span>
      </div>

      {allDone && (
        <p className="text-sm text-green-700 font-medium mb-2">
          Alles erledigt — dein Profil ist startklar! 🎉
        </p>
      )}

      <ul className="divide-y divide-cream-deep">
        {items.map((item) => (
          <li key={item.key}>
            <Link href={item.href} className="flex items-center gap-3 py-3 group">
              <span
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  item.done ? 'bg-forest border-forest' : 'border-stone-300'
                }`}
              >
                {item.done && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              <span
                className={`flex-1 text-sm ${
                  item.done
                    ? 'text-stone-400'
                    : 'text-stone-700 font-medium group-hover:text-forest'
                } transition-colors`}
              >
                {item.label}
              </span>
              <span className="text-stone-300 group-hover:text-forest text-sm transition-colors">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
