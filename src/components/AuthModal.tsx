import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

type Mode = 'login' | 'signup' | 'forgot'

type AuthModalProps = {
  open: boolean
  onClose: () => void
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) {
      setMessage(null)
      setError(null)
      setPassword('')
      setMode('login')
    }
  }, [open])

  if (!open) return null

  const title =
    mode === 'login' ? 'Log in' : mode === 'signup' ? 'Sign up' : 'Forgot password'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setMessage(null)

    let err: string | null = null
    if (mode === 'login') err = await signIn(email, password)
    else if (mode === 'signup') err = await signUp(email, password)
    else err = await resetPassword(email)

    setBusy(false)

    if (err) {
      setError(err)
      return
    }

    if (mode === 'forgot') {
      setMessage('Password reset email sent. Check your inbox.')
      return
    }

    if (mode === 'signup') {
      setMessage('Account created. You may need to confirm your email.')
    }
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="auth-title">{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          {mode !== 'forgot' && (
            <label>
              Password
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </label>
          )}

          {error && <p className="form-error">{error}</p>}
          {message && <p className="form-success">{message}</p>}

          <button type="submit" className="primary-btn" disabled={busy}>
            {busy ? 'Please wait…' : title}
          </button>
        </form>

        <div className="auth-links">
          {mode !== 'login' && (
            <button type="button" className="link-btn" onClick={() => setMode('login')}>
              Log in
            </button>
          )}
          {mode !== 'signup' && (
            <button type="button" className="link-btn" onClick={() => setMode('signup')}>
              Sign up
            </button>
          )}
          {mode !== 'forgot' && (
            <button type="button" className="link-btn" onClick={() => setMode('forgot')}>
              Forgot password
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
