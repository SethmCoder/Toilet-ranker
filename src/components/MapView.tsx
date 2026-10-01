import { useEffect, useMemo, useRef, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  CircleMarker,
  useMapEvents,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import type { Bathroom } from '../types'
import type { UserLocation } from '../hooks/useUserLocation'
import 'leaflet/dist/leaflet.css'

function createRatedBlueIcon(rating: number) {
  return L.divIcon({
    className: 'blue-pin-wrapper',
    html: `<div class="blue-pin">
      <span class="pin-rating">${rating.toFixed(1)}</span>
      <svg viewBox="0 0 24 36" width="28" height="42" aria-hidden="true">
        <path fill="#1e6fff" stroke="#0b3d91" stroke-width="1.2"
          d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"/>
        <circle cx="12" cy="12" r="4.5" fill="#fff"/>
      </svg>
    </div>`,
    iconSize: [44, 58],
    iconAnchor: [22, 58],
    popupAnchor: [0, -52],
  })
}

const draftIcon = L.divIcon({
  className: 'blue-pin-wrapper',
  html: `<div class="blue-pin draft">
      <span class="pin-rating">New</span>
      <svg viewBox="0 0 24 36" width="28" height="42" aria-hidden="true">
        <path fill="#1e6fff" stroke="#0b3d91" stroke-width="1.2"
          d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z"/>
        <circle cx="12" cy="12" r="4.5" fill="#fff"/>
      </svg>
    </div>`,
  iconSize: [44, 58],
  iconAnchor: [22, 58],
  popupAnchor: [0, -52],
})

export type { UserLocation } from '../hooks/useUserLocation'

type MapViewProps = {
  bathrooms: Bathroom[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onMapClick: (lat: number, lng: number) => void
  draftLat: number | null
  draftLng: number | null
  userLocation: UserLocation | null
  locateRequestId: number
  dashboardOpen: boolean
  currentUserId: string | null
  onDelete?: (id: string) => void
}

function MapClickHandler({
  onMapClick,
  enabled,
}: {
  onMapClick: (lat: number, lng: number) => void
  enabled: boolean
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return
      onMapClick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

function FitSelected({ bathroom }: { bathroom: Bathroom | null }) {
  const map = useMap()
  useEffect(() => {
    if (bathroom) {
      map.flyTo([bathroom.latitude, bathroom.longitude], Math.max(map.getZoom(), 15), {
        duration: 0.6,
      })
    }
  }, [bathroom, map])
  return null
}

function MapSizeFix({ layoutKey }: { layoutKey: string | number | boolean }) {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    const refresh = () => {
      map.invalidateSize({ pan: false })
    }

    refresh()
    const frames = [0, 50, 150, 300, 600, 1000, 2000].map((ms) =>
      window.setTimeout(refresh, ms),
    )
    const raf = window.requestAnimationFrame(refresh)

    const observer = new ResizeObserver(() => refresh())
    observer.observe(container)
    if (container.parentElement) observer.observe(container.parentElement)

    window.addEventListener('resize', refresh)
    document.addEventListener('visibilitychange', refresh)

    return () => {
      window.cancelAnimationFrame(raf)
      frames.forEach((id) => window.clearTimeout(id))
      observer.disconnect()
      window.removeEventListener('resize', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [map, layoutKey])

  return null
}

function HomeOnUser({
  userLocation,
  locateRequestId,
}: {
  userLocation: UserLocation | null
  locateRequestId: number
}) {
  const map = useMap()
  const lastRequest = useRef(0)
  const didInitialHome = useRef(false)

  useEffect(() => {
    map.setMinZoom(2)
    map.setMaxZoom(19)
  }, [map])

  useEffect(() => {
    if (!userLocation || didInitialHome.current) return
    didInitialHome.current = true
    map.invalidateSize({ pan: false })
    map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 1 })
  }, [userLocation, map])

  useEffect(() => {
    if (!userLocation || locateRequestId === 0 || locateRequestId === lastRequest.current) return
    lastRequest.current = locateRequestId
    map.invalidateSize({ pan: false })
    map.flyTo([userLocation.lat, userLocation.lng], 16, { duration: 0.8 })
  }, [locateRequestId, userLocation, map])

  return null
}

function RatedMarker({
  bathroom,
  selected,
  onSelect,
  canDelete,
  onDelete,
}: {
  bathroom: Bathroom
  selected: boolean
  onSelect: (id: string | null) => void
  canDelete: boolean
  onDelete?: (id: string) => void
}) {
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    const marker = markerRef.current
    if (!marker) return
    if (selected) marker.openPopup()
    else marker.closePopup()
  }, [selected])

  return (
    <Marker
      ref={markerRef}
      position={[bathroom.latitude, bathroom.longitude]}
      icon={createRatedBlueIcon(bathroom.overall_rating)}
      eventHandlers={{
        click: () => onSelect(bathroom.id),
      }}
    >
      <Popup>
        <div className="bathroom-popup">
          <div className="popup-header">
            <strong>{bathroom.location_name}</strong>
            <span className="pin-rating inline">{bathroom.overall_rating.toFixed(1)}</span>
          </div>
          <ul className="popup-ratings">
            <li>Urinal / Toilet: {bathroom.toilet_rating.toFixed(1)}</li>
            <li>Sink: {bathroom.sink_rating.toFixed(1)}</li>
            <li>Floor: {bathroom.floor_rating.toFixed(1)}</li>
          </ul>
          {bathroom.notes ? <p className="popup-notes">{bathroom.notes}</p> : null}
          {canDelete && onDelete && (
            <button
              type="button"
              className="delete-btn"
              onClick={() => {
                if (window.confirm('Delete this rating?')) onDelete(bathroom.id)
              }}
            >
              Delete my post
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  )
}

export function MapView({
  bathrooms,
  selectedId,
  onSelect,
  onMapClick,
  draftLat,
  draftLng,
  userLocation,
  locateRequestId,
  dashboardOpen,
  currentUserId,
  onDelete,
}: MapViewProps) {
  const paneRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  const selected = useMemo(
    () => bathrooms.find((b) => b.id === selectedId) ?? null,
    [bathrooms, selectedId],
  )

  const center: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [39.8283, -98.5795]

  const showDraftPin = dashboardOpen && draftLat != null && draftLng != null

  // Wait until the pane has a real height before mounting Leaflet.
  useEffect(() => {
    const pane = paneRef.current
    if (!pane) return

    const check = () => {
      if (pane.clientHeight > 80 && pane.clientWidth > 80) {
        setReady(true)
      }
    }

    check()
    const observer = new ResizeObserver(check)
    observer.observe(pane)
    const t = window.setTimeout(check, 100)
    return () => {
      observer.disconnect()
      window.clearTimeout(t)
    }
  }, [])

  return (
    <div className="map-pane" ref={paneRef}>
      {ready ? (
        <MapContainer
          center={center}
          zoom={userLocation ? 15 : 4}
          minZoom={2}
          maxZoom={19}
          className="map-container"
          scrollWheelZoom
          worldCopyJump
        >
          <TileLayer
            attribution='Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            noWrap={false}
            maxZoom={19}
            maxNativeZoom={19}
          />
          <TileLayer
            attribution="Labels © Esri"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            opacity={0.9}
            noWrap={false}
            maxZoom={19}
            maxNativeZoom={19}
          />
          <MapSizeFix layoutKey={`${dashboardOpen}-${ready}`} />
          <HomeOnUser userLocation={userLocation} locateRequestId={locateRequestId} />
          <MapClickHandler onMapClick={onMapClick} enabled={dashboardOpen} />
          <FitSelected bathroom={selected} />

          {userLocation && (
            <>
              <CircleMarker
                center={[userLocation.lat, userLocation.lng]}
                radius={Math.min(Math.max(userLocation.accuracy / 4, 18), 60)}
                pathOptions={{
                  color: '#00e5ff',
                  fillColor: '#00e5ff',
                  fillOpacity: 0.12,
                  weight: 1,
                }}
              />
              <CircleMarker
                center={[userLocation.lat, userLocation.lng]}
                radius={8}
                pathOptions={{
                  color: '#ffffff',
                  fillColor: '#00e5ff',
                  fillOpacity: 1,
                  weight: 3,
                }}
              >
                <Popup>You are here</Popup>
              </CircleMarker>
            </>
          )}

          {bathrooms.map((bathroom) => (
            <RatedMarker
              key={bathroom.id}
              bathroom={bathroom}
              selected={selectedId === bathroom.id}
              onSelect={onSelect}
              canDelete={Boolean(currentUserId && bathroom.user_id === currentUserId)}
              onDelete={onDelete}
            />
          ))}

          {showDraftPin && (
            <Marker position={[draftLat!, draftLng!]} icon={draftIcon}>
              <Popup>New rating location</Popup>
            </Marker>
          )}
        </MapContainer>
      ) : (
        <div className="map-loading">Loading map…</div>
      )}

      <div className="map-legend bubble-chip">
        <span className="blue-dot" /> Satellite · Blue pins = bathrooms
        {userLocation && (
          <>
            <span className="legend-sep">·</span>
            <span className="you-dot" /> You
          </>
        )}
      </div>
    </div>
  )
}
