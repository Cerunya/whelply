'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type Props = {
  initialQuery: string
  activeGroup?: number
  resultCount: number
}

export default function RassenSuche({ initialQuery, activeGroup, resultCount }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setQuery(initialQuery)
  }, [initialQuery])

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  function navigate(value: string) {
    const params = new URLSearchParams()
    if (value.trim()) params.set('suche', value.trim())
    if (activeGroup) params.set('gruppe', String(activeGroup))
    const search = params.toString()
    router.replace(search ? `/rassen?${search}` : '/rassen', { scroll: false })
  }

  function handleChange(value: string) {
    setQuery(value)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => navigate(value), 250)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (timer.current) clearTimeout(timer.current)
    navigate(query)
  }

  function handleClear() {
    if (timer.current) clearTimeout(timer.current)
    setQuery('')
    router.replace('/rassen', { scroll: false })
  }

  return (
    <form action="/rassen" method="get" onSubmit={handleSubmit} className="flex min-h-11 items-center gap-3" role="search">
      {activeGroup && <input type="hidden" name="gruppe" value={activeGroup} />}
      <svg className="h-5 w-5 flex-shrink-0 text-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path strokeLinecap="round" d="m20 20-4-4" />
      </svg>
      <label htmlFor="rassen-suche" className="sr-only">Rasse suchen</label>
      <input
        id="rassen-suche"
        name="suche"
        type="search"
        value={query}
        onChange={(event) => handleChange(event.target.value)}
        placeholder="Welche Rasse suchst du?"
        autoComplete="off"
        className="min-h-11 min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-stone-800 outline-none placeholder:text-stone-500 focus:ring-0"
      />
      {query ? (
        <button type="button" onClick={handleClear} aria-label="Suche zurücksetzen" className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      ) : (
        <span className="hidden whitespace-nowrap text-xs text-stone-400 sm:inline">Name eingeben</span>
      )}
      <span className="whitespace-nowrap border-l border-cream-deep pl-3 text-xs font-semibold text-stone-500 sm:pl-4" aria-live="polite">
        {resultCount} {resultCount === 1 ? 'Treffer' : 'Treffer'}
      </span>
    </form>
  )
}
