export type PlaceResult = {
  id: string
  name: string
  address: string
  lat: number
  lng: number
}

type NominatimPlace = {
  place_id: number
  lat: string
  lon: string
  name?: string
  display_name: string
}

/**
 * Searches places with OpenStreetMap Nominatim. Its usage policy forbids
 * search-as-you-type, so only call this on an explicit user action.
 */
export async function searchPlaces(
  query: string,
  near: { lat: number; lng: number } | null,
  signal?: AbortSignal,
): Promise<PlaceResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    limit: '6',
    addressdetails: '0',
  })
  if (near) {
    const d = 0.5
    params.set('viewbox', `${near.lng - d},${near.lat + d},${near.lng + d},${near.lat - d}`)
  }

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Place search failed (${res.status})`)

  const places = (await res.json()) as NominatimPlace[]
  return places.map((p) => {
    const [first, ...rest] = p.display_name.split(', ')
    return {
      id: String(p.place_id),
      name: p.name || first,
      address: (p.name ? p.display_name : rest.join(', ')) || p.display_name,
      lat: Number(p.lat),
      lng: Number(p.lon),
    }
  })
}
