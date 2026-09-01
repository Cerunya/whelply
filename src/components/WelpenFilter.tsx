'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import BreedSearch from './BreedSearch'
import LocationSearch from './LocationSearch'

const BUNDESLAENDER = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
  'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen',
  'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen',
  'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
]

type Breed = { id: number | string; nameDe: string; slug: string }

export default function WelpenFilter({ breeds, basePath = '/welpen' }: { breeds: Breed[]; basePath?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentRasse = searchParams.get('rasse') ?? ''
  const currentRegion = searchParams.get('region') ?? ''
  const currentOrt = searchParams.get('ort') ?? ''
  const currentRadius = searchParams.get('radius') ?? ''

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('seite')
    router.push(`${basePath}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <BreedSearch
        breeds={breeds}
        value={currentRasse}
        onChange={(slug) => update('rasse', slug)}
        placeholder="Rasse suchen..."
        className="w-56"
      />

      <LocationSearch
        value={currentOrt}
        onChange={(val) => update('ort', val)}
        radius={currentRadius}
        onRadiusChange={(val) => update('radius', val)}
        placeholder="PLZ oder Ort..."
        className="w-56"
      />

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

      {(currentRasse || currentRegion || currentOrt || currentRadius) && (
        <button
          onClick={() => router.push(basePath)}
          className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          Filter zurücksetzen ×
        </button>
      )}
    </div>
  )
}
