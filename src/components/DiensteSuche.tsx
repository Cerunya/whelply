'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import LocationSearch from './LocationSearch'

const BUNDESLAENDER = [
  'Baden-Württemberg', 'Bayern', 'Berlin', 'Brandenburg', 'Bremen',
  'Hamburg', 'Hessen', 'Mecklenburg-Vorpommern', 'Niedersachsen',
  'Nordrhein-Westfalen', 'Rheinland-Pfalz', 'Saarland', 'Sachsen',
  'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen',
]

const CATEGORY_LABELS: Record<string, string> = {
  vet: 'Tierärzte & Tierkliniken',
  groomer: 'Hundefriseure & Groomer',
  pension: 'Tierpensionen & Hundesitter',
  trainer: 'Hundetrainer & Hundeschulen',
  other: 'Sonstige Dienstleister',
}

export default function DiensteSuche() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentKategorie = searchParams.get('kategorie') ?? ''
  const currentOrt = searchParams.get('ort') ?? ''
  const currentRadius = searchParams.get('radius') ?? ''
  const currentRegion = searchParams.get('region') ?? ''

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/dienste?${params.toString()}`, { scroll: false })
  }

  const hasFilters = currentKategorie || currentOrt || currentRegion || currentRadius

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={currentKategorie}
        onChange={(event) => update('kategorie', event.target.value)}
        aria-label="Dienstleister-Kategorie"
        className="min-h-[46px] min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-forest/30"
      >
        <option value="">Alle Dienstleister</option>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>

      <LocationSearch
        value={currentOrt}
        onChange={(value) => update('ort', value)}
        radius={currentRadius}
        onRadiusChange={(value) => update('radius', value)}
        placeholder="PLZ oder Ort..."
        className="min-w-[240px] flex-1"
      />

      <select
        value={currentRegion}
        onChange={(event) => update('region', event.target.value)}
        aria-label="Bundesland"
        className="min-h-[46px] min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-forest/30"
      >
        <option value="">Alle Bundesländer</option>
        {BUNDESLAENDER.map((state) => <option key={state} value={state}>{state}</option>)}
      </select>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push('/dienste', { scroll: false })}
          className="min-h-11 text-sm text-stone-500 transition-colors hover:text-stone-900"
        >
          Filter zurücksetzen ×
        </button>
      )}
    </div>
  )
}
