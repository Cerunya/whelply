'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const CATEGORY_LABELS: Record<string, string> = {
  vet: 'Tierärzte',
  groomer: 'Hundefriseure & Groomer',
  pension: 'Tierpensionen',
  trainer: 'Hundetrainer',
  other: 'Sonstige Dienstleister',
}

type Provider = {
  id: string
  name: string
  category: string
  description: string | null
  city: string | null
  state: string | null
  lat: number | null
  lng: number | null
  logoUrl: string | null
  isPremium: boolean
}

function ProviderLogo({ provider, size = 'normal' }: { provider: Provider; size?: 'normal' | 'large' }) {
  const dimensions = size === 'large' ? 'h-14 w-14 rounded-2xl' : 'h-11 w-11 rounded-xl'
  return (
    <span className={`flex ${dimensions} flex-shrink-0 items-center justify-center overflow-hidden border border-cream-deep bg-white`}>
      {provider.logoUrl ? (
        <img src={provider.logoUrl} alt={`Logo von ${provider.name}`} className="h-full w-full object-contain p-1" />
      ) : (
        <span className="font-serif text-lg font-bold text-forest">{provider.name.charAt(0)}</span>
      )}
    </span>
  )
}

export default function DiensteMapView({ providers }: { providers: Provider[] }) {
  const firstWithLocation = providers.find((provider) => provider.lat !== null && provider.lng !== null) ?? providers[0]
  const [activeId, setActiveId] = useState(firstWithLocation?.id ?? '')
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markerLayer = useRef<L.LayerGroup | null>(null)
  const active = providers.find((provider) => provider.id === activeId) ?? firstWithLocation
  const mappable = providers.filter((provider) => provider.lat !== null && provider.lng !== null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current || mappable.length === 0) return
    const map = L.map(mapRef.current, { scrollWheelZoom: false, dragging: true, zoomControl: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map)
    markerLayer.current = L.layerGroup().addTo(map)
    mapInstance.current = map
    return () => {
      map.remove()
      mapInstance.current = null
      markerLayer.current = null
    }
  }, [mappable.length])

  useEffect(() => {
    const map = mapInstance.current
    const layer = markerLayer.current
    if (!map || !layer || mappable.length === 0) return
    layer.clearLayers()
    const bounds: L.LatLngBoundsExpression = []
    mappable.forEach((provider) => {
      const position: L.LatLngExpression = [provider.lat!, provider.lng!]
      bounds.push(position)
      const selected = provider.id === active?.id
      const marker = L.circleMarker(position, {
        radius: selected ? 12 : 9,
        color: '#FDFAF4',
        weight: 3,
        fillColor: selected ? '#C8861A' : '#1B3A2D',
        fillOpacity: 1,
      })
      marker.on('click', () => setActiveId(provider.id))
      marker.bindTooltip(provider.name, { direction: 'top', offset: [0, -8] })
      marker.addTo(layer)
    })
    if (bounds.length === 1) map.setView(bounds[0], 12)
    else map.fitBounds(bounds, { padding: [55, 55], maxZoom: 12 })
    setTimeout(() => map.invalidateSize(), 0)
  }, [providers, active?.id])

  return (
    <div className="overflow-hidden rounded-3xl border border-cream-deep bg-white shadow-[7px_7px_0_#EDE4CE] lg:grid lg:grid-cols-[390px_minmax(0,1fr)]">
      <div className="order-2 max-h-none overflow-y-auto border-t border-cream-deep p-4 lg:order-1 lg:max-h-[590px] lg:border-r lg:border-t-0">
        <p className="flex items-center gap-2 px-1 pb-4 text-xs font-bold text-forest">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m3 11 18-8-8 18-2-8-8-2Z" /></svg>
          Dienstleister im Suchgebiet
        </p>
        <div className="space-y-2">
          {providers.map((provider) => (
            <button
              key={provider.id}
              type="button"
              onClick={() => setActiveId(provider.id)}
              aria-pressed={active?.id === provider.id}
              className={`flex min-h-[96px] w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${active?.id === provider.id ? 'border-[#D9CBAF] bg-[#F5EFE0]' : 'border-transparent hover:bg-[#F5EFE0]'}`}
            >
              <ProviderLogo provider={provider} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <strong className="font-serif text-[15px] leading-snug text-stone-800">{provider.name}</strong>
                  {provider.isPremium && <span className="text-honey" title="Empfohlener Dienstleister">★</span>}
                </span>
                <span className="mt-1 block text-[11px] text-stone-500">{CATEGORY_LABELS[provider.category]} · {provider.city || provider.state}</span>
                {provider.description && <span className="mt-1 line-clamp-1 block text-[11px] text-stone-400">{provider.description}</span>}
              </span>
              <svg className="h-4 w-4 flex-shrink-0 text-honey" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" /></svg>
            </button>
          ))}
        </div>
      </div>

      <div className="relative order-1 min-h-[390px] bg-[#E8E5D8] lg:order-2 lg:min-h-[590px]">
        {mappable.length > 0 ? <div ref={mapRef} className="absolute inset-0" aria-label="Karte der Dienstleister" /> : (
          <div className="flex h-full min-h-[390px] items-center justify-center p-8 text-center text-sm text-stone-500">Für diese Einträge sind noch keine Kartenpositionen hinterlegt.</div>
        )}
        {active && (
          <Link href={`/dienste/${active.id}`} className="absolute inset-x-4 bottom-4 z-[500] flex items-center gap-4 rounded-2xl border border-cream-deep bg-white p-4 shadow-[5px_5px_0_rgba(18,38,25,0.12)] transition-transform hover:-translate-y-0.5 sm:inset-x-6 sm:bottom-6">
            <ProviderLogo provider={active} size="large" />
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-honey">{CATEGORY_LABELS[active.category]}</span>
              <strong className="mt-1 block font-serif text-lg text-forest">{active.name}</strong>
              <span className="mt-1 block text-xs text-stone-500">{active.city || active.state} · Profil ansehen →</span>
            </span>
          </Link>
        )}
      </div>
    </div>
  )
}
