import { useEffect, useRef, type PointerEvent } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import type { Customization } from '../types'

type CustomizePanelProps = {
  onClose: () => void
}

type OmbreKey = 'buttonOmbre' | 'appOmbre' | 'lightingOmbre'

const OMBRE_TOGGLES: { key: OmbreKey; label: string; hint: string }[] = [
  { key: 'buttonOmbre', label: 'Button ombre', hint: 'Submit rating, log in, score badges' },
  { key: 'appOmbre', label: 'App ombre', hint: 'Background, title, panel blend' },
  { key: 'lightingOmbre', label: 'Lighting ombre', hint: 'Panel light and light-mode panel color' },
]

function HueRing({ hue, onChange }: { hue: number; onChange: (hue: number) => void }) {
  const ringRef = useRef<HTMLDivElement>(null)

  function pickFromPointer(event: PointerEvent<HTMLDivElement>) {
    const rect = ringRef.current?.getBoundingClientRect()
    if (!rect) return
    const dx = event.clientX - (rect.left + rect.width / 2)
    const dy = event.clientY - (rect.top + rect.height / 2)
    const degrees = (Math.atan2(dx, -dy) * 180) / Math.PI
    onChange(Math.round((degrees + 360) % 360))
  }

  const radians = (hue * Math.PI) / 180
  const handleX = 50 + 39 * Math.sin(radians)
  const handleY = 50 - 39 * Math.cos(radians)

  return (
    <div
      ref={ringRef}
      className="hue-ring"
      role="slider"
      tabIndex={0}
      aria-label="Color"
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={hue}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        pickFromPointer(e)
      }}
      onPointerMove={(e) => {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) pickFromPointer(e)
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange((hue + 5) % 360)
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange((hue + 355) % 360)
      }}
    >
      <div className="hue-ring-track" />
      <div className="hue-ring-center" />
      <span
        className="hue-ring-handle"
        style={{ left: `${handleX}%`, top: `${handleY}%`, background: `hsl(${hue} 100% 50%)` }}
      />
    </div>
  )
}

export function CustomizePanel({ onClose }: CustomizePanelProps) {
  const { customization, updateCustomization, resetCustomization } = useTheme()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="customize-panel" role="dialog" aria-label="Customize">
      <div className="customize-header">
        <h3>Customize</h3>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close customize">
          ×
        </button>
      </div>

      <HueRing hue={customization.hue} onChange={(hue) => updateCustomization({ hue })} />

      <label className="customize-row">
        <span>Brightness</span>
        <input
          type="range"
          className="brightness-slider"
          min={25}
          max={80}
          value={customization.brightness}
          style={{
            background: `linear-gradient(90deg, hsl(${customization.hue} 100% 20%), hsl(${customization.hue} 100% 50%), hsl(${customization.hue} 100% 85%))`,
          }}
          onChange={(e) => updateCustomization({ brightness: Number(e.target.value) })}
        />
      </label>

      <div className="customize-section-title">Ombre</div>
      {OMBRE_TOGGLES.map(({ key, label, hint }) => (
        <label key={key} className="toggle-row">
          <span>
            {label}
            <small>{hint}</small>
          </span>
          <input
            type="checkbox"
            className="toggle-switch"
            checked={customization[key]}
            onChange={(e) =>
              updateCustomization({ [key]: e.target.checked } as Partial<Customization>)
            }
          />
        </label>
      ))}

      <button type="button" className="secondary-btn customize-reset" onClick={resetCustomization}>
        Reset to default
      </button>
    </div>
  )
}
