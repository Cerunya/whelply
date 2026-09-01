'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import LocationSearch from './LocationSearch'

const BUNDESLAENDER = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
  'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen',
  'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen',
  'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
]

export default function DiensteSuche() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentOrt = searchParams.get('ort') ?? ''
  const currentRadius = searchParams.get('radius') ?? ''
  const currentRegion = searchParams.get('region') ?? ''

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/dienste?${params.toString()}`)
  }

  return (
    <>
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

      {(currentOrt || currentRegion || currentRadius) && (
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.delete('ort')
            params.delete('radius')
            params.delete('region')
            router.push(`/dienste?${params.toString()}`)
          }}
          className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
        >
          Filter zurücksetzen ×
        </button>
      )}
    </>
  )
}
