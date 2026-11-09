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

export default function DiensteSuche({ resultCount }: { resultCount: number }) {
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
    <div>
      <div className="mb-4 flex items-center gap-2 font-serif text-lg font-bold text-forest">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="m20 20-4-4" /></svg>
        Dienstleister finden
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.25fr_1.3fr_1fr]">
        <label>
          <span className="mb-2 ml-0.5 block text-[11px] font-bold text-stone-600">Was suchst du?</span>
          <select
            value={currentKategorie}
            onChange={(event) => update('kategorie', event.target.value)}
            className="min-h-[46px] w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-forest/30"
          >
            <option value="">Alle Dienstleister</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label>
          <span className="mb-2 ml-0.5 block text-[11px] font-bold text-stone-600">PLZ oder Ort</span>
          <LocationSearch
            value={currentOrt}
            onChange={(value) => update('ort', value)}
            radius={currentRadius}
            onRadiusChange={(value) => update('radius', value)}
            placeholder="z. B. München"
            className="w-full"
          />
        </label>
        <label className="sm:col-span-2 lg:col-span-1">
          <span className="mb-2 ml-0.5 block text-[11px] font-bold text-stone-600">Bundesland</span>
          <select
            value={currentRegion}
            onChange={(event) => update('region', event.target.value)}
            className="min-h-[46px] w-full rounded-xl border border-stone-300 bg-white px-3 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-forest/30"
          >
            <option value="">Alle Bundesländer</option>
            {BUNDESLAENDER.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-3 flex min-h-8 items-center justify-end gap-4">
        {hasFilters && (
          <button type="button" onClick={() => router.push('/dienste', { scroll: false })} className="flex min-h-8 items-center gap-1 text-xs text-stone-500 transition-colors hover:text-stone-900">
            Filter zurücksetzen <span aria-hidden="true">×</span>
          </button>
        )}
        <span className="text-xs font-semibold text-stone-500">{resultCount} {resultCount === 1 ? 'Eintrag' : 'Einträge'}</span>
      </div>
    </div>
  )
}
