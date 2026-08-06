'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import BreedSearch from './BreedSearch'
import LocationSearch from './LocationSearch'

type FilterOption = { value: string; label: string }
type Filter = { key: string; placeholder: string; options: FilterOption[] }

export default function ListingFilter({
  filters,
  basePath,
}: {
  filters: Filter[]
  basePath: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    params.delete('seite')
    router.push(`${basePath}?${params.toString()}`)
  }

  const hasAnyFilter = filters.some((f) => searchParams.get(f.key)) || !!searchParams.get('ort') || !!searchParams.get('radius')

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {filters.map((f) => {
        if (f.key === 'rasse') {
          const breeds = f.options.map((o) => ({ id: o.value, nameDe: o.label, slug: o.value }))
          return (
            <BreedSearch
              key={f.key}
              breeds={breeds}
              value={searchParams.get(f.key) ?? ''}
              onChange={(slug) => update(f.key, slug)}
              placeholder={f.placeholder}
              className="w-56"
            />
          )
        }
        return (
          <select
            key={f.key}
            value={searchParams.get(f.key) ?? ''}
            onChange={(e) => update(f.key, e.target.value)}
            className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white text-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-900"
          >
            <option value="">{f.placeholder}</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )
      })}
      <LocationSearch
        value={searchParams.get('ort') ?? ''}
        onChange={(val) => update('ort', val)}
        radius={searchParams.get('radius') ?? ''}
        onRadiusChange={(val) => update('radius', val)}
        placeholder="PLZ oder Ort..."
        className="w-56"
      />
      {hasAnyFilter && (
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
