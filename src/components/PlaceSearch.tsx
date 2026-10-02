import { useEffect, useRef, useState } from 'react'
import { searchPlaces, type PlaceResult } from '../lib/geocode'

type PlaceSearchProps = {
  near: { lat: number; lng: number } | null
  onPick: (place: PlaceResult) => void
}

export function PlaceSearch({ near, onPick }: PlaceSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PlaceResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  async function runSearch() {
    const q = query.trim()
    if (!q || busy) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setBusy(true)
    setError(null)
    try {
      setResults(await searchPlaces(q, near, controller.signal))
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Place search failed')
        setResults(null)
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  return (
    <div className="place-search">
      <span>Find a place</span>
      <div className="place-search-row">
        <input
          type="search"
          placeholder="Search an address or place name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void runSearch()
            }
          }}
          aria-label="Search for a place"
        />
        <button
          type="button"
          className="secondary-btn"
          onClick={() => void runSearch()}
          disabled={busy || !query.trim()}
        >
          {busy ? '…' : 'Search'}
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {results && (
        <ul className="place-results" role="listbox">
          {results.length === 0 ? (
            <li className="muted place-empty">No places found</li>
          ) : (
            results.map((place) => (
              <li key={place.id}>
                <button
                  type="button"
                  role="option"
                  className="place-result"
                  onClick={() => {
                    onPick(place)
                    setResults(null)
                    setQuery(place.name)
                  }}
                >
                  <strong>{place.name}</strong>
                  <span className="muted">{place.address}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}

      <span className="muted place-credit">Search by OpenStreetMap</span>
    </div>
  )
}
