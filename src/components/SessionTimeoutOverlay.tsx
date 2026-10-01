import { formatCountdown } from '../hooks/usePageTimeout'

export function SessionTimerBadge({ remainingMs }: { remainingMs: number }) {
  return (
    <span className="guest-timer" title="Session timer">
      Session {formatCountdown(remainingMs)}
    </span>
  )
}
