'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const BUNDESLAENDER = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
  'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen',
  'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen',
  'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
]

type Breed = { id: number; nameDe: string; slug: string }

export default function SearchForm({ breeds }: { breeds: Breed[] }) {
  const router = useRouter()
  const [breed, setBreed] = useState('')
  const [region, setRegion] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (breed) params.set('rasse', breed)
    if (region) params.set('region', region)
    router.push(`/welpen?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
      <select
        value={breed}
        onChange={(e) => setBreed(e.target.value)}
        className="flex-1 border border-stone-300 rounded-xl px-4 py-3 text-sm bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent appearance-none"
      >
        <option value="">Alle Rassen</option>
        {breeds.map((b) => (
          <option key={b.id} value={b.slug}>
            {b.nameDe}
          </option>
        ))}
      </select>

      <select
        value={region}
        onChange={(e) => setRegion(e.target.value)}
        className="flex-1 border border-stone-300 rounded-xl px-4 py-3 text-sm bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent appearance-none"
      >
        <option value="">Alle Bundesländer</option>
        {BUNDESLAENDER.map((bl) => (
          <option key={bl} value={bl}>
            {bl}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="bg-stone-900 text-white px-8 py-3 rounded-xl text-sm font-medium hover:bg-stone-700 transition-colors whitespace-nowrap"
      >
        Welpen suchen
      </button>
    </form>
  )
}
