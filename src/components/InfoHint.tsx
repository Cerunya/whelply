'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function InfoHint({ label }: { label: string }) {
  const [open, setOpen] = useState(false)

  return (
    <span className="group relative inline-flex flex-shrink-0">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onBlur={() => setOpen(false)}
        className="flex h-5 w-5 items-center justify-center rounded-full border border-stone-300 text-xs font-bold text-stone-400 transition-colors hover:border-forest hover:text-forest focus:outline-none focus:ring-2 focus:ring-forest/30"
      >
        i
      </button>
      <span
        role="tooltip"
        className={`absolute left-1/2 top-full z-30 mt-2 w-64 -translate-x-1/2 rounded-xl border border-cream-deep bg-white p-3 text-xs font-normal leading-relaxed text-stone-600 shadow-lg group-focus-within:block group-hover:block ${open ? 'block' : 'hidden'}`}
      >
        Um eine Mutterhündin/einen Deckrüden anzulegen, gehe in deinem Dashboard auf{' '}
        <Link href="/dashboard/hund-eintragen" className="font-semibold text-forest underline underline-offset-2">
          + Zuchthund eintragen
        </Link>
        . Danach kannst du sie hier eintragen.
      </span>
    </span>
  )
}
