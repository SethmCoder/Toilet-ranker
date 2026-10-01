import { useMemo, useState, type FormEvent } from 'react'
import type { RatingForm } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'

type SidebarProps = {
  open: boolean
  form: RatingForm
  onChange: (next: RatingForm) => void
  onSubmit: (form: RatingForm) => Promise<string | null>
  onOpenAuth: () => void
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <label className="slider-field">
      <div className="slider-label-row">
        <span>{label}</span>
        <strong>{value.toFixed(1)}</strong>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        step={0.5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

export function Sidebar({ open, form, onChange, onSubmit }: SidebarProps) {
  const { user } = useAuth()
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const overall = useMemo(
    () => Math.round(((form.toilet + form.sink + form.floor) / 3) * 10) / 10,
    [form.toilet, form.sink, form.floor],
  )

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setStatus(null)

    setBusy(true)
    const err = await onSubmit(form)
    setBusy(false)

    if (err) {
      setError(err)
      return
    }

    setStatus(isSupabaseConfigured ? 'Rating saved to Supabase.' : 'Rating saved on this device.')
    onChange({
      ...form,
      toilet: 5,
      sink: 5,
      floor: 5,
      notes: '',
      locationName: '',
      latitude: null,
      longitude: null,
    })
  }

  return (
    <aside className={`sidebar ${open ? 'open' : 'closed'}`} aria-hidden={!open}>
      <form className="sidebar-form" onSubmit={handleSubmit}>
        <h2>Rate a bathroom</h2>

        <div className="sliders">
          <Slider
            label="Urinal / Toilet"
            value={form.toilet}
            onChange={(toilet) => onChange({ ...form, toilet })}
          />
          <Slider
            label="Sink"
            value={form.sink}
            onChange={(sink) => onChange({ ...form, sink })}
          />
          <Slider
            label="Floor"
            value={form.floor}
            onChange={(floor) => onChange({ ...form, floor })}
          />
        </div>

        <div className="overall-notes-row">
          <div className="overall-box">
            <span className="muted">Overall ranking</span>
            <strong className="overall-score">{overall.toFixed(1)}</strong>
            <span className="muted">Average of all three</span>
          </div>
          <label className="notes-field">
            Notes & tips
            <textarea
              rows={4}
              placeholder="Cleanliness tips, stalls, soap, etc."
              value={form.notes}
              onChange={(e) => onChange({ ...form, notes: e.target.value })}
            />
          </label>
        </div>

        <label className="location-field">
          Location
          <input
            type="text"
            placeholder="Building, floor, or landmark"
            value={form.locationName}
            onChange={(e) => onChange({ ...form, locationName: e.target.value })}
            required
          />
          <span className="muted coords">
            {form.latitude != null && form.longitude != null
              ? `${form.latitude.toFixed(5)}, ${form.longitude.toFixed(5)} — click map to update`
              : 'Click the map to drop a pin for this bathroom'}
          </span>
        </label>

        {error && <p className="form-error">{error}</p>}
        {status && <p className="form-success">{status}</p>}

        <button type="submit" className="primary-btn submit-btn" disabled={busy}>
          {busy ? 'Submitting…' : 'Submit Rating'}
        </button>

        {user && <p className="muted signed-in">Signed in as {user.email}</p>}
      </form>
    </aside>
  )
}
