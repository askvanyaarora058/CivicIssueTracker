
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [mfaRequired, setMfaRequired] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await login(
        email.trim(),
        password,
        mfaRequired ? otp : undefined
      )

      // The backend requires an authenticator code.
      // Do not navigate or create a session at this point.
      if (result?.mfaRequired) {
        setMfaRequired(true)
        setOtp('')
        setError(result.message || 'Enter your six-digit authenticator code.')
        return
      }

      if (!result?.id || !result?.role) {
        setError('Login failed. Please try again.')
        return
      }

      const destination =
        location.state?.from?.pathname ||
        (result.role === 'admin' ? '/admin' : '/dashboard')

      navigate(destination, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      className="section"
      style={{ maxWidth: 520, width: '100%', margin: '0 auto' }}
    >
      <h1>Log in</h1>

      <p>
        {mfaRequired
          ? 'Enter the six-digit code from your authenticator app.'
          : 'Log in to your Civic Tracker account.'}
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 18 }}>
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={loading || mfaRequired}
            style={{
              display: 'block',
              boxSizing: 'border-box',
              width: '100%',
              padding: 12,
              marginTop: 8
            }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={loading || mfaRequired}
            style={{
              display: 'block',
              boxSizing: 'border-box',
              width: '100%',
              padding: 12,
              marginTop: 8
            }}
          />
        </div>

        {/* Always render the OTP input once MFA is required. */}
        {mfaRequired && (
          <div style={{ marginBottom: 18 }}>
            <label htmlFor="otp">Six-digit authenticator code</label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="Enter 6-digit code"
              value={otp}
              onChange={(event) => {
                setOtp(
                  event.target.value.replace(/\D/g, '').slice(0, 6)
                )
              }}
              required
              autoFocus
              style={{
                display: 'block',
                boxSizing: 'border-box',
                width: '100%',
                padding: 12,
                marginTop: 8
              }}
            />
          </div>
        )}

        {error && (
          <p role="alert" style={{ color: 'red', marginBottom: 16 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || (mfaRequired && otp.length !== 6)}
        >
          {loading
            ? 'Please wait...'
            : mfaRequired
              ? 'Verify code and log in'
              : 'Log in'}
        </button>
      </form>

      {!mfaRequired && (
        <p style={{ marginTop: 18 }}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      )}
    </section>
  )
}
