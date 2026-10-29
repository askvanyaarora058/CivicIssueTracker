
import { useState } from 'react'
import { setupMfa, verifyMfaSetup } from '../services/api.js'

export default function MfaSetup() {
  const [qrCode, setQrCode] = useState('')
  const [otp, setOtp] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [enabled, setEnabled] = useState(false)

  async function handleSetup() {
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const data = await setupMfa()
      setQrCode(data.qrCode)
      setMessage(data.message || 'Scan the QR code with your authenticator app.')
    } catch (err) {
      setError(err.message || 'Could not generate QR code.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const data = await verifyMfaSetup(otp.trim())
      setEnabled(true)
      setMessage(data.message || 'MFA enabled successfully.')
    } catch (err) {
      setError(err.message || 'Verification failed. Check your code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="section" style={{ maxWidth: 600, margin: '0 auto', width: '100%' }}>
      <h1>Set Up Multi-Factor Authentication</h1>

      <p>
        Add an extra layer of security to your Civic Tracker account
        using Google Authenticator or Microsoft Authenticator.
      </p>

      {!qrCode && !enabled && (
        <button type="button" onClick={handleSetup} disabled={loading}>
          {loading ? 'Generating QR code...' : 'Generate QR Code'}
        </button>
      )}

      {qrCode && !enabled && (
        <>
          <h3>1. Scan this QR code</h3>
          <p>Open your authenticator app and scan the image below.</p>

          <img
            src={qrCode}
            alt="Authenticator setup QR code"
            style={{ width: 240, height: 240, display: 'block', margin: '20px auto' }}
          />

          <h3>2. Verify your authenticator</h3>

          <form onSubmit={handleVerify}>
            <label htmlFor="otp">Six-digit verification code</label>

            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              required
              style={{ display: 'block', width: '100%', margin: '10px 0', padding: 12 }}
            />

            <button type="submit" disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify and Enable MFA'}
            </button>
          </form>
        </>
      )}

      {enabled && <h3>MFA is enabled for your account.</h3>}

      {message && <p role="status">{message}</p>}
      {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
    </section>
  )
}
