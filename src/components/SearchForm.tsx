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

  const selectClass = `
    flex-1 bg-white border border-stone-200 rounded-xl px-4 py-3.5 text-sm
    text-stone-700 focus:outline-none focus:ring-2 focus:ring-forest/30
    focus:border-forest appearance-none shadow-sm
  `

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 w-full max-w-2xl">
      <select value={breed} onChange={(e) => setBreed(e.target.value)} className={selectClass}>
        <option value="">Alle Rassen</option>
        {breeds.map((b) => (
          <option key={b.id} value={b.slug}>{b.nameDe}</option>
        ))}
      </select>

      <select value={region} onChange={(e) => setRegion(e.target.value)} className={selectClass}>
        <option value="">Alle Bundesländer</option>
        {BUNDESLAENDER.map((bl) => (
          <option key={bl} value={bl}>{bl}</option>
        ))}
      </select>

      <button
        type="submit"
        className="bg-honey text-white px-8 py-3.5 rounded-xl text-sm font-bold hover:bg-honey-light transition-colors whitespace-nowrap shadow-sm"
      >
        Suchen
      </button>
    </form>
  )
}
