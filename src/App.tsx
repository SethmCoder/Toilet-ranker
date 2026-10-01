import { useMemo, useState } from 'react'
import { isSupabaseConfigured } from './lib/supabase'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { useBathrooms } from './hooks/useBathrooms'
import { useUserLocation } from './hooks/useUserLocation'
import { usePageTimeout } from './hooks/usePageTimeout'
import { TopBar } from './components/TopBar'
import { Sidebar } from './components/Sidebar'
import { MapView } from './components/MapView'
import { BathroomList } from './components/BathroomList'
import { AuthModal } from './components/AuthModal'
import { SessionTimeoutOverlay } from './components/SessionTimeoutOverlay'
import type { FilterState, RatingForm } from './types'
import './App.css'

const defaultForm: RatingForm = {
  toilet: 5,
  sink: 5,
  floor: 5,
  notes: '',
  locationName: '',
  latitude: null,
  longitude: null,
}

function matchesQuery(
  bathroom: {
    location_name: string
    notes: string | null
    overall_rating: number
    toilet_rating: number
    sink_rating: number
    floor_rating: number
  },
  query: string,
) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const notes = (bathroom.notes ?? '').toLowerCase()
  return (
    bathroom.location_name.toLowerCase().includes(q) ||
    notes.includes(q) ||
    String(bathroom.overall_rating).includes(q) ||
    String(bathroom.toilet_rating).includes(q) ||
    String(bathroom.sink_rating).includes(q) ||
    String(bathroom.floor_rating).includes(q)
  )
}

function SessionGate() {
  const { remainingMs, expired } = usePageTimeout()
  if (expired) return <SessionTimeoutOverlay />
  return <AppShell remainingMs={remainingMs} />
}

function AppShell({ remainingMs }: { remainingMs: number }) {
  const { user } = useAuth()
  const { bathrooms, submitRating, deleteRating, error: loadError } = useBathrooms()
  const { userLocation, error: gpsError, locating, requestLocation } = useUserLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [authOpen, setAuthOpen] = useState(false)
  const [form, setForm] = useState<RatingForm>(defaultForm)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [locateRequestId, setLocateRequestId] = useState(0)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    minRating: 1,
    maxRating: 10,
    query: '',
  })

  const filtered = useMemo(() => {
    return bathrooms.filter((b) => {
      const inRange =
        b.overall_rating >= filters.minRating && b.overall_rating <= filters.maxRating
      if (!inRange) return false
      return matchesQuery(b, filters.query)
    })
  }, [bathrooms, filters])

  function handleLocateMe() {
    requestLocation()
    setLocateRequestId((n) => n + 1)
  }

  async function handleDelete(id: string) {
    setDeleteError(null)
    const err = await deleteRating(id, user?.id ?? null)
    if (err) {
      setDeleteError(err)
      return
    }
    setSelectedId((prev) => (prev === id ? null : prev))
  }

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <TopBar
        search={filters.query}
        onSearchChange={(query) => setFilters((f) => ({ ...f, query }))}
        searchResults={filtered}
        onSelectSearchResult={setSelectedId}
        onOpenAuth={() => setAuthOpen(true)}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onLocateMe={handleLocateMe}
        locating={locating}
        hasLocation={Boolean(userLocation)}
        sessionRemainingMs={remainingMs}
        supabaseConnected={isSupabaseConfigured}
      />

      <div className="main-layout">
        <Sidebar
          open={sidebarOpen}
          form={form}
          onChange={setForm}
          onOpenAuth={() => setAuthOpen(true)}
          onSubmit={async (ratingForm) => submitRating(ratingForm, user?.id ?? null)}
        />

        <div className="content-area">
          <div
            className={`banner bubble-chip supabase-banner ${isSupabaseConfigured ? 'ok' : 'warn'}`}
            role="status"
          >
            {isSupabaseConfigured
              ? 'Supabase: Connected — ratings save to the cloud.'
              : 'Supabase: Not connected — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel env vars (or local .env), then redeploy / restart.'}
          </div>
          {loadError && <div className="banner error bubble-chip">{loadError}</div>}
          {deleteError && <div className="banner error bubble-chip">{deleteError}</div>}
          {gpsError && (
            <div className="banner warn bubble-chip">
              GPS: {gpsError}{' '}
              <button type="button" className="link-btn" onClick={handleLocateMe}>
                Retry GPS
              </button>
            </div>
          )}

          <MapView
            bathrooms={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
            draftLat={form.latitude}
            draftLng={form.longitude}
            userLocation={userLocation}
            locateRequestId={locateRequestId}
            dashboardOpen={sidebarOpen}
            currentUserId={user?.id ?? null}
            onDelete={(id) => void handleDelete(id)}
            onMapClick={(lat, lng) =>
              setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }))
            }
          />

          <BathroomList
            bathrooms={filtered}
            filters={filters}
            onFiltersChange={setFilters}
            selectedId={selectedId}
            onSelect={setSelectedId}
            currentUserId={user?.id ?? null}
            onDelete={(id) => void handleDelete(id)}
          />
        </div>
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SessionGate />
      </AuthProvider>
    </ThemeProvider>
  )
}
