/**
 * Geocoding via OpenStreetMap Nominatim (kostenlos, kein API-Key nötig).
 * Konvertiert PLZ/Stadt/Adresse zu Lat/Lng Koordinaten.
 * Nutzungsbedingungen: max 1 Request/Sekunde, User-Agent setzen.
 */

type GeoResult = { lat: number; lng: number } | null

export async function geocodeAddress(params: {
  zip?: string | null
  city?: string | null
  state?: string | null
  street?: string | null
  country?: string
}): Promise<GeoResult> {
  const parts = [params.street, params.zip, params.city, params.state, params.country ?? 'Deutschland']
    .filter(Boolean)
    .join(', ')

  if (!parts || parts === 'Deutschland') return null

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
        q: parts,
        format: 'json',
        limit: '1',
        countrycodes: 'de,at,ch',
      })}`,
      {
        headers: { 'User-Agent': 'Whelply.de/1.0 (info@whelply.com)' },
        signal: AbortSignal.timeout(5000),
      }
    )

    if (!res.ok) return null
    const data = await res.json()
    if (!data?.[0]) return null

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    }
  } catch {
    return null
  }
}

/** Berechnet Entfernung in km zwischen zwei Koordinaten (Haversine) */
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
