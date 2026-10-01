import type { Bathroom, FilterState } from '../types'

type BathroomListProps = {
  bathrooms: Bathroom[]
  filters: FilterState
  onFiltersChange: (next: FilterState) => void
  selectedId: string | null
  onSelect: (id: string) => void
  currentUserId: string | null
  onDelete: (id: string) => void
}

export function BathroomList({
  bathrooms,
  filters,
  onFiltersChange,
  selectedId,
  onSelect,
  currentUserId,
  onDelete,
}: BathroomListProps) {
  return (
    <section className="bathroom-list-panel">
      <div className="list-header">
        <h3>Bathrooms nearby</h3>
        <span className="muted">{bathrooms.length} shown</span>
      </div>

      <div className="filters">
        <label>
          Min rating
          <input
            type="number"
            min={1}
            max={10}
            step={0.5}
            value={filters.minRating}
            onChange={(e) =>
              onFiltersChange({ ...filters, minRating: Number(e.target.value) || 1 })
            }
          />
        </label>
        <label>
          Max rating
          <input
            type="number"
            min={1}
            max={10}
            step={0.5}
            value={filters.maxRating}
            onChange={(e) =>
              onFiltersChange({ ...filters, maxRating: Number(e.target.value) || 10 })
            }
          />
        </label>
      </div>

      <ul className="bathroom-list">
        {bathrooms.length === 0 && (
          <li className="empty-list muted">No bathrooms match your filters.</li>
        )}
        {bathrooms.map((bathroom) => {
          const isMine = Boolean(currentUserId && bathroom.user_id === currentUserId)
          return (
            <li key={bathroom.id}>
              <div
                className={`bathroom-list-item ${selectedId === bathroom.id ? 'active' : ''}`}
              >
                <button
                  type="button"
                  className="bathroom-list-select"
                  onClick={() => onSelect(bathroom.id)}
                >
                  <div className="list-item-top">
                    <strong>{bathroom.location_name}</strong>
                    <span className="list-score">{bathroom.overall_rating.toFixed(1)}</span>
                  </div>
                  <div className="list-item-meta muted">
                    T {bathroom.toilet_rating.toFixed(1)} · S {bathroom.sink_rating.toFixed(1)} · F{' '}
                    {bathroom.floor_rating.toFixed(1)}
                  </div>
                  {bathroom.notes && <p className="list-notes">{bathroom.notes}</p>}
                </button>
                {isMine && (
                  <button
                    type="button"
                    className="delete-btn list-delete"
                    onClick={() => {
                      if (window.confirm('Delete this rating?')) onDelete(bathroom.id)
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
