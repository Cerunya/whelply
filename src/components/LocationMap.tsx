'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type Props = {
  lat: number
  lng: number
  label?: string
  zoom?: number
  className?: string
}

export default function LocationMap({ lat, lng, label, zoom = 11, className = '' }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      dragging: true,
      zoomControl: true,
    }).setView([lat, lng], zoom)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map)

    // Kreis statt exakter Marker (Datenschutz — zeigt ungefähren Standort)
    L.circle([lat, lng], {
      radius: 2000,
      color: '#2d5016',
      fillColor: '#2d5016',
      fillOpacity: 0.15,
      weight: 2,
    }).addTo(map)

    if (label) {
      L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'bg-transparent',
          html: `<div style="background:#2d5016;color:white;padding:4px 10px;border-radius:8px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.2)">${label}</div>`,
          iconSize: [0, 0],
          iconAnchor: [0, -20],
        }),
      }).addTo(map)
    }

    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [lat, lng, label, zoom])

  return <div ref={mapRef} className={`rounded-xl overflow-hidden ${className}`} style={{ minHeight: '250px' }} />
}
