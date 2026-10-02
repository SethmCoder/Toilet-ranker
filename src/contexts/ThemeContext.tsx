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

function applyCustomization(c: Customization, theme: ThemeMode) {
  const root = document.documentElement
  const lightness = clamp(c.brightness + (theme === 'dark' ? 6 : 0), 15, 85)
  const accentHue = (c.hue - 30 + 360) % 360
  const accentLightness = clamp(lightness - (theme === 'dark' ? 8 : 14), 12, 80)

  root.style.setProperty('--primary', `hsl(${c.hue} 100% ${lightness}%)`)
  root.style.setProperty('--accent', `hsl(${accentHue} 100% ${accentLightness}%)`)
  root.style.setProperty('--primary-fg', lightness > 68 ? '#0a0f18' : '#ffffff')
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
