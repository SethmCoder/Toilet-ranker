import { useEffect, useRef, useState } from 'react'

const SESSION_DISPLAY_MS = 30 * 60 * 1000

/** Session countdown; once it hits zero the page stays expired until reloaded. */
export function usePageTimeout(timeoutMs = SESSION_DISPLAY_MS) {
  const startedAt = useRef(Date.now())
  const [remainingMs, setRemainingMs] = useState(timeoutMs)
  const expired = remainingMs <= 0

  useEffect(() => {
    if (expired) return

    const tick = () => {
      const remaining = Math.max(0, timeoutMs - (Date.now() - startedAt.current))
      setRemainingMs(remaining)
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [timeoutMs, expired])

  return { remainingMs, timeoutMs, expired }
}

export function formatCountdown(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
