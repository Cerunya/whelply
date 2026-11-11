'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function RatgeberSuche({ categories }: { categories: { slug: string; name: string }[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentQuery = searchParams.get('suche') ?? ''
  const currentCategory = searchParams.get('kategorie') ?? ''
  const [query, setQuery] = useState(currentQuery)
  const initialRender = useRef(true)

  useEffect(() => { setQuery(currentQuery) }, [currentQuery])

  useEffect(() => {
    if (initialRender.current) { initialRender.current = false; return }
    if (query === currentQuery) return
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (query.trim()) params.set('suche', query.trim())
      else params.delete('suche')
      router.replace(`/ratgeber${params.size ? `?${params.toString()}` : ''}`, { scroll: false })
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [query, currentQuery, router, searchParams])

  function updateCategory(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set('kategorie', value)
    else params.delete('kategorie')
    router.push(`/ratgeber${params.size ? `?${params.toString()}` : ''}`, { scroll: false })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex min-h-[46px] min-w-[220px] flex-[2] items-center gap-2 rounded-xl border border-stone-300 bg-white px-3.5 text-stone-400 focus-within:ring-2 focus-within:ring-forest/30">
        <svg className="h-[18px] w-[18px] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true"><circle cx="11" cy="11" r="7"/><path strokeLinecap="round" d="m20 20-4-4"/></svg>
        <span className="sr-only">Ratgeber durchsuchen</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Wonach suchst du?" className="min-h-11 w-full min-w-0 border-0 bg-transparent text-sm text-stone-800 outline-none" />
      </label>
      <select value={currentCategory} onChange={(event) => updateCategory(event.target.value)} aria-label="Ratgeber-Kategorie" className="min-h-[46px] min-w-[180px] flex-1 rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-forest/30">
        <option value="">Alle Themen</option>
        {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
      </select>
      {(currentQuery || currentCategory) && <button type="button" onClick={() => { setQuery(''); router.push('/ratgeber', { scroll: false }) }} className="min-h-11 text-sm text-stone-500 transition-colors hover:text-stone-900">Zurücksetzen ×</button>}
    </div>
  )
}
