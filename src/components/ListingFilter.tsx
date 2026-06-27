'use client'

import { useRouter, useSearchParams } from 'next/navigation'

type FilterOption = { value: string; label: string }

export default function ListingFilter({
  filters,
  basePath,
}: {
  filters: { key: string; placeholder: string; options: FilterOption[] }[]
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

  const hasAnyFilter = filters.some((f) => searchParams.get(f.key))

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {filters.map((f) => (
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
      ))}
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
