import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { CustomizePanel } from './CustomizePanel'
import { SearchBar } from './SearchBar'
import { SessionTimerBadge } from './SessionTimeoutOverlay'
import type { Bathroom } from '../types'

type TopBarProps = {
  search: string
  onSearchChange: (value: string) => void
  searchResults: Bathroom[]
  onSelectSearchResult: (id: string) => void
  onOpenAuth: () => void
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onLocateMe: () => void
  locating: boolean
  hasLocation: boolean
  sessionRemainingMs: number | null
  supabaseConnected: boolean
}

export function TopBar({
  search,
  onSearchChange,
  searchResults,
  onSelectSearchResult,
  onOpenAuth,
  sidebarOpen,
  onToggleSidebar,
  onLocateMe,
  locating,
  hasLocation,
  sessionRemainingMs,
  supabaseConnected,
}: TopBarProps) {
  const { user, signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [customizeOpen, setCustomizeOpen] = useState(false)

  return (
    <header className="top-bar bubble-bar">
      <div className="top-bar-left">
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? '‹' : '›'}
        </button>
        <span className="brand">Toilet Ranker</span>
        <span
          className={`supabase-chip ${supabaseConnected ? 'ok' : 'warn'}`}
          title={
            supabaseConnected
              ? 'Supabase is connected'
              : 'Supabase keys missing — set Vercel env vars and redeploy'
          }
        >
          {supabaseConnected ? 'Supabase on' : 'Supabase off'}
        </span>
        <SearchBar
          value={search}
          onChange={onSearchChange}
          results={searchResults}
          onSelectResult={onSelectSearchResult}
        />
      </div>

      <div className="top-bar-right">
        {sessionRemainingMs !== null && <SessionTimerBadge remainingMs={sessionRemainingMs} />}

        <button
          type="button"
          className={`icon-btn locate-btn ${hasLocation ? 'ready' : ''} ${locating ? 'locating' : ''}`}
          onClick={onLocateMe}
          aria-label="Home map to my GPS location"
          title={
            hasLocation
              ? 'Home to my location'
              : locating
                ? 'Getting GPS…'
                : 'Enable / retry GPS and home to me'
          }
        >
          ⌖
        </button>

        <button
          type="button"
          className="icon-btn"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
        >
          {theme === 'light' ? '☾' : '☀'}
        </button>

        <div className="customize-anchor">
          <button
            type="button"
            className={`secondary-btn customize-btn ${customizeOpen ? 'active' : ''}`}
            onClick={() => setCustomizeOpen((v) => !v)}
            aria-expanded={customizeOpen}
          >
            Customize
          </button>
          {customizeOpen && <CustomizePanel onClose={() => setCustomizeOpen(false)} />}
        </div>

        {user ? (
          <button type="button" className="secondary-btn" onClick={() => void signOut()}>
            Sign out
          </button>
        ) : (
          <button type="button" className="primary-btn" onClick={onOpenAuth}>
            Log in / Sign up
          </button>
        )}
      </div>
    </header>
  )
}
