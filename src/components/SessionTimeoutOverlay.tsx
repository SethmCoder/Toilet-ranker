import { formatCountdown } from '../hooks/usePageTimeout'

export function SessionTimerBadge({ remainingMs }: { remainingMs: number }) {
  return (
    <span className="guest-timer" title="Session timer">
      Session {formatCountdown(remainingMs)}
    </span>
  )
}

export function SessionTimeoutOverlay() {
  return (
    <div className="session-timeout-overlay" role="alertdialog" aria-modal="true" aria-labelledby="session-timeout-title">
      <div className="session-timeout-card">
        <h2 id="session-timeout-title">Session timed out</h2>
        <p>Your 30-minute session has ended. Refresh the page to continue.</p>
        <button type="button" className="session-timeout-btn" onClick={() => window.location.reload()}>
          Refresh page
        </button>
      </div>
    </div>
  )
}
