'use client'

import { useState, useRef, useEffect } from 'react'

type Breed = { id: number | string; nameDe: string; slug: string }

type Props = {
  breeds: Breed[]
  value: string
  onChange: (value: string) => void
  valueKey?: 'slug' | 'id'
  placeholder?: string
  className?: string
}

export default function BreedSearch({ breeds, value, onChange, valueKey = 'slug', placeholder = 'Rasse suchen...', className = '' }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const getKey = (b: Breed) => String(valueKey === 'id' ? b.id : b.slug)

  // Angezeigter Name basierend auf aktuellem Value
  const selectedBreed = breeds.find((b) => getKey(b) === value)

  const filtered = query.trim()
    ? breeds.filter((b) => b.nameDe.toLowerCase().includes(query.toLowerCase()))
    : breeds

  // Klick außerhalb schließt Dropdown
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(breed: Breed) {
    onChange(getKey(breed))
    setQuery('')
    setOpen(false)
  }

  function handleClear() {
    onChange('')
    setQuery('')
    setOpen(false)
  }

  const baseClass = `w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm
    text-stone-700 focus:outline-none focus:ring-2 focus:ring-forest/30
    focus:border-forest shadow-sm`

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Wenn eine Rasse gewählt ist: Anzeige mit X-Button */}
      {selectedBreed && !open ? (
        <div className={`${baseClass} flex items-center justify-between cursor-pointer`} onClick={() => setOpen(true)}>
          <span>{selectedBreed.nameDe}</span>
          <button type="button" onClick={(e) => { e.stopPropagation(); handleClear() }}
            className="text-stone-400 hover:text-stone-600 ml-2 text-xs">✕</button>
        </div>
      ) : (
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={selectedBreed ? selectedBreed.nameDe : placeholder}
          className={baseClass}
        />
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {/* "Alle Rassen" Option */}
          <button type="button" onClick={handleClear}
            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-cream transition-colors ${!value ? 'font-semibold text-forest' : 'text-stone-500'}`}>
            Alle Rassen
          </button>

          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-stone-400">Keine Rasse gefunden</p>
          ) : (
            filtered.map((b) => (
              <button key={b.id} type="button" onClick={() => handleSelect(b)}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-cream transition-colors ${getKey(b) === value ? 'font-semibold text-forest bg-green-50' : 'text-stone-700'}`}>
                {b.nameDe}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
