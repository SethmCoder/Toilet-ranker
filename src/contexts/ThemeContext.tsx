import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Customization, ThemeMode } from '../types'

const THEME_KEY = 'bathroom-ranker-theme'
const CUSTOM_KEY = 'bathroom-ranker-customization'

export const DEFAULT_CUSTOMIZATION: Customization = {
  hue: 218,
  brightness: 56,
  buttonOmbre: true,
  appOmbre: true,
  lightingOmbre: true,
}

type ThemeContextValue = {
  theme: ThemeMode
  toggleTheme: () => void
  customization: Customization
  updateCustomization: (patch: Partial<Customization>) => void
  resetCustomization: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function loadCustomization(): Customization {
  try {
    const stored = JSON.parse(localStorage.getItem(CUSTOM_KEY) ?? 'null')
    return { ...DEFAULT_CUSTOMIZATION, ...stored }
  } catch {
    return DEFAULT_CUSTOMIZATION
  }
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

const DARK_TEXT = '#0a0f18'
const LIGHT_TEXT = '#ffffff'
const PANEL_VARS = ['--panel', '--panel-solid', '--fg', '--muted', '--panel-border', '--input-bg', '--input-border']

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  return [f(0), f(8), f(4)]
}

function luminance([r, g, b]: [number, number, number]) {
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(a: number, b: number) {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}

/** Picks dark or white text, whichever stays most readable across every given background. */
function readableText(backgrounds: [number, number, number][]) {
  const lums = backgrounds.map(luminance)
  const darkLum = luminance([10 / 255, 15 / 255, 24 / 255])
  const worstDark = Math.min(...lums.map((l) => contrast(l, darkLum)))
  const worstLight = Math.min(...lums.map((l) => contrast(l, 1)))
  return worstDark >= worstLight ? DARK_TEXT : LIGHT_TEXT
}

function applyLightPanels(root: HTMLElement, c: Customization, accentHue: number) {
  const panelLightness = clamp(c.brightness + 22, 35, 92)
  const startRgb = hslToRgb(c.hue, 85, panelLightness)
  const endRgb = hslToRgb(accentHue, 85, panelLightness)
  const start = `hsl(${c.hue} 85% ${panelLightness}%)`
  const end = `hsl(${accentHue} 85% ${panelLightness}%)`
  const text = readableText(c.appOmbre ? [startRgb, endRgb] : [startRgb])
  const darkText = text === DARK_TEXT

  root.style.setProperty(
    '--panel',
    c.appOmbre
      ? `linear-gradient(150deg, color-mix(in srgb, ${start} 92%, transparent), color-mix(in srgb, ${end} 92%, transparent))`
      : `color-mix(in srgb, ${start} 92%, transparent)`,
  )
  root.style.setProperty('--panel-solid', start)
  root.style.setProperty('--fg', text)
  root.style.setProperty('--muted', darkText ? 'rgba(10, 15, 24, 0.7)' : 'rgba(255, 255, 255, 0.8)')
  root.style.setProperty('--panel-border', darkText ? 'rgba(10, 15, 24, 0.14)' : 'rgba(255, 255, 255, 0.24)')
  root.style.setProperty('--input-bg', darkText ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.2)')
  root.style.setProperty('--input-border', darkText ? 'rgba(10, 15, 24, 0.2)' : 'rgba(255, 255, 255, 0.3)')
}

function applyCustomization(c: Customization, theme: ThemeMode) {
  const root = document.documentElement
  const lightness = clamp(c.brightness + (theme === 'dark' ? 6 : 0), 15, 85)
  const accentHue = (c.hue - 30 + 360) % 360
  const accentLightness = clamp(lightness - (theme === 'dark' ? 8 : 14), 12, 80)

  root.style.setProperty('--primary', `hsl(${c.hue} 100% ${lightness}%)`)
  root.style.setProperty('--accent', `hsl(${accentHue} 100% ${accentLightness}%)`)
  root.style.setProperty(
    '--primary-fg',
    readableText(
      c.buttonOmbre
        ? [hslToRgb(c.hue, 100, lightness), hslToRgb(accentHue, 100, accentLightness)]
        : [hslToRgb(c.hue, 100, lightness)],
    ),
  )

  if (theme === 'light') {
    applyLightPanels(root, c, accentHue)
  } else {
    PANEL_VARS.forEach((name) => root.style.removeProperty(name))
  }

  root.dataset.buttonOmbre = c.buttonOmbre ? 'on' : 'off'
  root.dataset.appOmbre = c.appOmbre ? 'on' : 'off'
  root.dataset.lightingOmbre = c.lightingOmbre ? 'on' : 'off'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem(THEME_KEY)
    return stored === 'dark' ? 'dark' : 'light'
  })
  const [customization, setCustomization] = useState<Customization>(loadCustomization)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    applyCustomization(customization, theme)
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(customization))
  }, [customization, theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  const updateCustomization = useCallback((patch: Partial<Customization>) => {
    setCustomization((prev) => ({ ...prev, ...patch }))
  }, [])

  const resetCustomization = useCallback(() => {
    setCustomization(DEFAULT_CUSTOMIZATION)
  }, [])

  const value = useMemo(
    () => ({ theme, toggleTheme, customization, updateCustomization, resetCustomization }),
    [theme, toggleTheme, customization, updateCustomization, resetCustomization],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
