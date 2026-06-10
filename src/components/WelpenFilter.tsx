'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const BUNDESLAENDER = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
  'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen',
  'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen',
  'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
]

type Breed = { id: number; nameDe: string; slug: string }

export default function WelpenFilter({ breeds }: { breeds: Breed[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentRasse = searchParams.get('rasse') ?? ''
  const currentRegion = searchParams.get('region') ?? ''

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('seite')
    router.push(`/welpen?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        value={currentRasse}
        onChange={(e) => update('rasse', e.target.value)}
        className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
      >
        <option value="">Alle Rassen</option>
        {breeds.map((b) => (
          <option key={b.id} value={b.slug}>{b.nameDe}</option>
        ))}
      </select>

      <select
        value={currentRegion}
        onChange={(e) => update('region', e.target.value)}
        className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
      >
        <option value="">Alle Bundesländer</option>
        {BUNDESLAENDER.map((bl) => (
          <option key={bl} value={bl}>{bl}</option>
        ))}
      </select>

      {(currentRasse || currentRegion) && (
        <button
          onClick={() => router.push('/welpen')}
          className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          Filter zurücksetzen ×
        </button>
      )}
    </div>
  )
}
