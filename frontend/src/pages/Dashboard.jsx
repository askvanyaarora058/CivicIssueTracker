import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getIssues, ApiError } from '../services/api.js'
import IssueCard from '../components/IssueCard.jsx'
import IssueFilters from '../components/IssueFilters.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Dashboard() {
  const { user } = useAuth()
  const [issues, setIssues] = useState([])
  const [allIssues, setAllIssues] = useState([]) // unfiltered, for stats
  const [filters, setFilters] = useState({ search: '', status: 'All', category: 'All' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadIssues = useCallback(async (currentFilters) => {
    setLoading(true)
    setError('')
    try {
      const data = await getIssues(currentFilters)
      setIssues(data.issues || [])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load issues.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Load full unfiltered set once, for the stats row.
  useEffect(() => {
    getIssues({}).then((data) => setAllIssues(data.issues || [])).catch(() => {})
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => loadIssues(filters), filters.search ? 350 : 0)
    return () => clearTimeout(timeout)
  }, [filters, loadIssues])

  const stats = {
    total: allIssues.length,
    reported: allIssues.filter((i) => i.status === 'Reported').length,
    inProgress: allIssues.filter((i) => i.status === 'In Progress').length,
    resolved: allIssues.filter((i) => i.status === 'Resolved').length,
  }

  return (
    <div className="section">
      <div className="section-inner">
        <div className="details-header" style={{ marginBottom: 24 }}>
          <div>
            <h2 className="mb-0">Welcome back, {user?.name?.split(' ')[0] || 'citizen'}</h2>
            <p style={{ color: 'var(--ink-soft)' }}>Here's what's happening in your community.</p>
          </div>
          <Link to="/report" className="btn btn-primary">Report an issue</Link>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-num">{stats.total}</div>
            <div className="stat-label">Total issues</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{stats.reported}</div>
            <div className="stat-label">Reported</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{stats.inProgress}</div>
            <div className="stat-label">In progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-num">{stats.resolved}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>

        <IssueFilters filters={filters} onChange={setFilters} />

        {loading && <LoadingSpinner label="Loading issues…" />}

        {!loading && error && (
          <EmptyState title="Couldn't load issues" message={error} />
        )}

        {!loading && !error && issues.length === 0 && (
          <EmptyState
            title="No issues found"
            message="Try adjusting your search or filters, or be the first to report one."
            action={<Link to="/report" className="btn btn-primary btn-sm">Report an issue</Link>}
          />
        )}

        {!loading && !error && issues.length > 0 && (
          <div className="issues-grid">
            {issues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
