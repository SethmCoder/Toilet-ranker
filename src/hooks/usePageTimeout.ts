import { useEffect, useRef, useState } from 'react'

const SESSION_DISPLAY_MS = 30 * 60 * 1000

/** Session countdown display only — does not lock or force a reload. */
export function usePageTimeout(timeoutMs = SESSION_DISPLAY_MS) {
  const startedAt = useRef(Date.now())
  const [remainingMs, setRemainingMs] = useState(timeoutMs)

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, timeoutMs - (Date.now() - startedAt.current))
      setRemainingMs(remaining)
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [timeoutMs])

  return { remainingMs, timeoutMs }
}

export function formatCountdown(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
