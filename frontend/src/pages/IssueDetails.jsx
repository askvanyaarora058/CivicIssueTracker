import MapPicker from '../components/MapPicker.jsx'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getIssueById, ApiError } from '../services/api.js'
import StatusBadge from '../components/StatusBadge.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function IssueDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [issue, setIssue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    setNotFound(false)

    getIssueById(id)
      .then((data) => {
        if (!active) return
        setIssue(data.issue || data)
      })
      .catch((err) => {
        if (!active) return
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true)
        } else {
          setError(err instanceof ApiError ? err.message : 'Could not load this issue.')
        }
      })
      .finally(() => active && setLoading(false))

    return () => { active = false }
  }, [id])

  if (loading) {
    return (
      <div className="section"><div className="section-inner"><LoadingSpinner label="Loading issue…" /></div></div>
    )
  }

  if (notFound) {
    return (
      <div className="section"><div className="section-inner">
        <EmptyState
          title="Issue not found"
          message="This issue may have been removed or the link is incorrect."
          action={<Link to="/dashboard" className="btn btn-primary btn-sm">Back to dashboard</Link>}
        />
      </div></div>
    )
  }

  if (error) {
    return (
      <div className="section"><div className="section-inner">
        <EmptyState title="Couldn't load issue" message={error} />
      </div></div>
    )
  }

  if (!issue) return null

  return (
    <div className="section">
      <div className="section-inner" style={{ maxWidth: 900 }}>
        <button className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate(-1)}>
          ← Back
        </button>

        <div className="surface" style={{ padding: 28 }}>
          <div className="details-header">
            <div>
              <span className="issue-category-tag">{issue.category}</span>
              <h2 style={{ marginTop: 10 }}>{issue.title}</h2>
            </div>
            <StatusBadge status={issue.status} />
          </div>

          <div className="details-grid">
            <div>
              {issue.photo_url && (
                <img src={issue.photo_url} alt={issue.title} className="details-photo" style={{ marginBottom: 18 }} />
              )}
              <h3>Description</h3>
              <p style={{ color: 'var(--ink-soft)' }}>{issue.description}</p>
              {issue.latitude !== null &&
 issue.latitude !== undefined &&
 issue.longitude !== null &&
 issue.longitude !== undefined &&
 issue.latitude !== '' &&
 issue.longitude !== '' && (
  <div style={{ marginTop: 28 }}>
    <h3>Issue location</h3>

    <p
      style={{
        color: 'var(--ink-soft)',
        fontSize: '0.9rem',
        marginBottom: 10,
      }}
    >
      Location where this issue was reported.
    </p>

    <MapPicker
      latitude={issue.latitude}
      longitude={issue.longitude}
      readOnly={true}
    />
  </div>
)}

              {issue.admin_comment && (
                <>
                  <h3>Administrator comment</h3>
                  <div className="admin-comment-box">{issue.admin_comment}</div>
                </>
              )}
            </div>

            <div>
              <div className="detail-row">
                <span className="k">Address</span>
                <span className="v">{issue.address || '—'}</span>
              </div>
              <div className="detail-row">
                <span className="k">Coordinates</span>
                <span className="v">
                  {issue.latitude && issue.longitude ? `${issue.latitude}, ${issue.longitude}` : '—'}
                </span>
              </div>
              <div className="detail-row">
                <span className="k">Reported</span>
                <span className="v">{formatDate(issue.created_at)}</span>
              </div>
              <div className="detail-row">
                <span className="k">Last updated</span>
                <span className="v">{formatDate(issue.updated_at)}</span>
              </div>
              {issue.reported_by && (
                <div className="detail-row">
                  <span className="k">Reported by</span>
                  <span className="v">{issue.reported_by}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
