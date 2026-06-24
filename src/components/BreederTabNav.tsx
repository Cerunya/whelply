'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'

type NavItem = { id: string; label: string; href: string }

export default function BreederTabNav({
  navItems,
  active,
  themeColor,
  navColor,
  accentColor,
}: {
  navItems: NavItem[]
  active: string
  themeColor: string | null
  navColor: string | null
  accentColor: string | null
}) {
  const [isSticky, setIsSticky] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-40px 0px 0px 0px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const bg = navColor
    ? navColor + 'F5'
    : themeColor
    ? themeColor + 'F5'
    : 'rgba(45,90,61,0.96)'

  const activeHighlight = accentColor || '#e0a72e'

  return (
    <>
      {/* Sentinel — unsichtbares Element das getrackt wird */}
      <div ref={sentinelRef} className="h-0 w-full" />

      <div
        className={`sticky top-10 z-40 transition-all duration-300 ${
          isSticky ? 'w-full' : 'max-w-5xl mx-auto'
        }`}
      >
        <nav
          className={`transition-all duration-300 shadow-md ${
            isSticky ? 'rounded-none' : 'rounded-xl mt-0'
          }`}
          style={{ backgroundColor: bg }}
        >
          <div className={`flex gap-0 overflow-x-auto ${isSticky ? 'max-w-5xl mx-auto px-4' : 'px-3'}`}>
            {navItems.map((item) => {
              const isActive = active === item.id
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                    isActive ? 'opacity-100' : 'border-transparent opacity-55 hover:opacity-85'
                  }`}
                  style={{
                    color: 'white',
                    borderColor: isActive ? activeHighlight : 'transparent',
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </>
  )
}
