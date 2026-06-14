'use client'

import { useState } from 'react'
import Link from 'next/link'

type NavLink = { href: string; label: string }

export default function MobileNav({
  links,
  extra,
}: {
  links: NavLink[]
  extra?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Menü schließen' : 'Menü öffnen'}
        className="p-2 -mr-2 text-stone-600 hover:text-forest transition-colors"
      >
        {open ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-cream-deep shadow-lg z-40">
          <nav className="flex flex-col px-4 py-2">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-3 text-sm font-medium text-stone-600 hover:text-forest transition-colors border-b border-cream-deep last:border-b-0"
              >
                {item.label}
              </Link>
            ))}
            {extra && (
              <div className="flex flex-col py-2 [&>*]:py-2 [&>*]:text-sm">
                {extra}
              </div>
            )}
          </nav>
        </div>
      )}
    </div>
  )
}
