'use client'

import { useState, useRef, useEffect } from 'react'

type Props = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function LocationSearch({ value, onChange, placeholder = 'PLZ oder Ort...', className = '' }: Props) {
  const [query, setQuery] = useState(value)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  function handleChange(val: string) {
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onChange(val.trim())
    }, 400)
  }

  function handleClear() {
    setQuery('')
    onChange('')
  }

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest shadow-sm pr-8"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-xs"
        >
          ✕
        </button>
      )}
    </div>
  )
}
