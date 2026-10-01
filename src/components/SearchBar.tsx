import { useEffect, useMemo, useRef, useState } from 'react'
import type { Bathroom } from '../types'

type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  results: Bathroom[]
  onSelectResult: (id: string) => void
}

export function SearchBar({ value, onChange, results, onSelectResult }: SearchBarProps) {
  const [expanded, setExpanded] = useState(Boolean(value))
  const [openResults, setOpenResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  const q = value.trim()
  const showDropdown = expanded && openResults && q.length > 0

  const preview = useMemo(() => results.slice(0, 8), [results])

  useEffect(() => {
    if (expanded) inputRef.current?.focus()
  }, [expanded])

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenResults(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div ref={rootRef} className={`search-bar ${expanded ? 'expanded' : ''}`}>
      <button
        type="button"
        className="icon-btn search-toggle"
        aria-label="Search bathrooms"
        onClick={() => {
          setExpanded((prev) => {
            if (prev) {
              onChange('')
              setOpenResults(false)
              return false
            }
            return true
          })
        }}
      >
        {expanded ? '×' : '⌕'}
      </button>

      {expanded && (
        <div className="search-field-wrap">
          <input
            ref={inputRef}
            type="search"
            placeholder="Search location, notes, rating…"
            value={value}
            onChange={(e) => {
              onChange(e.target.value)
              setOpenResults(true)
            }}
            onFocus={() => setOpenResults(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && preview[0]) {
                e.preventDefault()
                onSelectResult(preview[0].id)
                setOpenResults(false)
              }
              if (e.key === 'Escape') {
                setOpenResults(false)
              }
            }}
            aria-label="Search bathroom ratings"
            aria-autocomplete="list"
            aria-expanded={showDropdown}
          />

          {showDropdown && (
            <ul className="search-results bubble-panel" role="listbox">
              {preview.length === 0 ? (
                <li className="search-empty muted">No matching bathrooms</li>
              ) : (
                preview.map((bathroom) => (
                  <li key={bathroom.id}>
                    <button
                      type="button"
                      className="search-result-item"
                      role="option"
                      onClick={() => {
                        onSelectResult(bathroom.id)
                        onChange(bathroom.location_name)
                        setOpenResults(false)
                      }}
                    >
                      <span className="search-result-name">{bathroom.location_name}</span>
                      <span className="list-score">{bathroom.overall_rating.toFixed(1)}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
