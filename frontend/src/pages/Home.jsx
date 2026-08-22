import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Home() {
  const { isAuthenticated, isAdmin } = useAuth()
  const primaryHref = isAuthenticated ? (isAdmin ? '/admin' : '/dashboard') : '/register'

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="hero-eyebrow">Municipal issue reporting</div>
            <h1>Every pothole, on the record.</h1>
            <p className="hero-lede">
              Report a civic problem in under a minute. Track it from "Reported" to
              "Resolved," and see exactly what your local administrators are doing
              about it — no phone calls, no guesswork.
            </p>
            <div className="hero-actions">
              <Link to={primaryHref} className="btn btn-primary">
                {isAuthenticated ? 'Go to dashboard' : 'Report an issue'}
              </Link>
              {!isAuthenticated && (
                <Link to="/login" className="btn btn-secondary">Log in</Link>
              )}
            </div>
          </div>

          <div className="hero-panel">
            <div className="hero-panel-label">Recent activity — sample</div>
            <div className="hero-ticket">
              <div className="t-title">Broken street light — 4th Cross Street</div>
              <div className="t-status">STATUS: IN PROGRESS</div>
            </div>
            <div className="hero-ticket">
              <div className="t-title">Pothole near community park</div>
              <div className="t-status">STATUS: RESOLVED</div>
            </div>
            <div className="hero-ticket">
              <div className="t-title">Overflowing drain, Ward 12</div>
              <div className="t-status">STATUS: REPORTED</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-inner">
          <div className="section-head">
            <h2>How it works</h2>
            <p>Three steps between a problem on your street and a record your city has to answer to.</p>
          </div>
          <div className="steps-grid">
            <div className="step-item">
              <div className="step-num">01</div>
              <h3>Report</h3>
              <p>Describe the issue, add a location and photo. It's logged with a timestamp immediately.</p>
            </div>
            <div className="step-item">
              <div className="step-num">02</div>
              <h3>Track</h3>
              <p>Search and filter every open issue in your area by status or category.</p>
            </div>
            <div className="step-item">
              <div className="step-num">03</div>
              <h3>Resolve</h3>
              <p>Administrators update the status and leave a comment when the work is done.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-inner">
          <div className="section-head">
            <h2>Built for accountability</h2>
            <p>A public, searchable record beats a call center queue.</p>
          </div>
          <div className="steps-grid">
            <div className="step-item">
              <h3>Transparent status</h3>
              <p>Every issue shows exactly where it stands — Reported, In Progress, or Resolved.</p>
            </div>
            <div className="step-item">
              <h3>Real administrator response</h3>
              <p>Admins can leave comments explaining what was done and when.</p>
            </div>
            <div className="step-item">
              <h3>Searchable history</h3>
              <p>Filter by category or status to see patterns across your neighborhood.</p>
            </div>
          </div>
        </div>
      </section>

      {!isAuthenticated && (
        <div className="cta-band">
          <h2>Ready to report your first issue?</h2>
          <p>Create a free account and have it logged in under a minute.</p>
          <Link to="/register" className="btn btn-primary">Create an account</Link>
        </div>
      )}

      <footer>Civic Issue Tracker — a local reporting tool for your community.</footer>
    </>
  )
}
