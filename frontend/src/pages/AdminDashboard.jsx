import { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getIssues, updateIssue, deleteIssue, ApiError } from '../services/api.js'
import IssueFilters from '../components/IssueFilters.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { useToast } from '../components/Toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const STATUS_OPTIONS = ['Reported', 'In Progress', 'Resolved']

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function AdminDashboard() {
  const toast = useToast()
  const navigate = useNavigate()
  const { handleSessionExpired } = useAuth()

  const [issues, setIssues] = useState([])
  const [allIssues, setAllIssues] = useState([])
  const [filters, setFilters] = useState({ search: '', status: 'All', category: 'All' })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editing, setEditing] = useState({}) // { [id]: { status, admin_comment, saving } }
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async (currentFilters) => {
    setLoading(true)
    setError('')
    try {
      const data = await getIssues(currentFilters)
      setIssues(data.issues || [])
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleApiError(err) {
    if (err instanceof ApiError && err.status === 401) {
      handleSessionExpired()
      toast.error('Your session expired. Please log in again.')
      navigate('/login')
    } else if (err instanceof ApiError && err.status === 403) {
      toast.error("You don't have permission to do that.")
    } else {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    }
  }

  useEffect(() => {
    getIssues({}).then((data) => setAllIssues(data.issues || [])).catch(() => {})
  }, [])

  useEffect(() => {
    const timeout = setTimeout(() => load(filters), filters.search ? 350 : 0)
    return () => clearTimeout(timeout)
  }, [filters, load])

  function startEdit(issue) {
    setEditing((prev) => ({
      ...prev,
      [issue.id]: { status: issue.status, admin_comment: issue.admin_comment || '', saving: false },
    }))
  }

  function updateEditField(id, field, value) {
    setEditing((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  async function saveEdit(id) {
    const draft = editing[id]
    if (!draft) return
    setEditing((prev) => ({ ...prev, [id]: { ...prev[id], saving: true } }))
    try {
      await updateIssue(id, { status: draft.status, admin_comment: draft.admin_comment })
      toast.success('Issue updated.')
      setEditing((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      load(filters)
      getIssues({}).then((data) => setAllIssues(data.issues || [])).catch(() => {})
    } catch (err) {
      setEditing((prev) => ({ ...prev, [id]: { ...prev[id], saving: false } }))
      handleApiError(err)
    }
  }

  function cancelEdit(id) {
    setEditing((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  async function confirmDelete() {
    if (!confirmDeleteId) return
    setDeleting(true)
    try {
      await deleteIssue(confirmDeleteId)
      toast.success('Issue deleted.')
      setConfirmDeleteId(null)
      load(filters)
      getIssues({}).then((data) => setAllIssues(data.issues || [])).catch(() => {})
    } catch (err) {
      handleApiError(err)
    } finally {
      setDeleting(false)
    }
  }

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
            <h2 className="mb-0">Admin dashboard</h2>
            <p style={{ color: 'var(--ink-soft)' }}>Manage every reported issue across the city.</p>
          </div>
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

        {!loading && error && <EmptyState title="Couldn't load issues" message={error} />}

        {!loading && !error && issues.length === 0 && (
          <EmptyState title="No issues found" message="Try adjusting your search or filters." />
        )}

        {!loading && !error && issues.length > 0 && (
          <div className="surface ledger-wrap">
            <table className="ledger">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Reported</th>
                  <th>Manage</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue) => {
                  const draft = editing[issue.id]
                  return (
                    <tr key={issue.id}>
                      <td className="id-cell">#{issue.id}</td>
                      <td>
                        <Link to={`/issues/${issue.id}`}>{issue.title}</Link>
                      </td>
                      <td>{issue.category}</td>
                      <td>
                        {draft ? (
                          <select
                            value={draft.status}
                            onChange={(e) => updateEditField(issue.id, 'status', e.target.value)}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <StatusBadge status={issue.status} />
                        )}
                      </td>
                      <td>{formatDate(issue.created_at)}</td>
                      <td style={{ minWidth: 220 }}>
                        {draft ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <textarea
                              placeholder="Admin comment…"
                              value={draft.admin_comment}
                              onChange={(e) => updateEditField(issue.id, 'admin_comment', e.target.value)}
                              style={{ minHeight: 60, fontSize: '0.85rem' }}
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                className="btn btn-primary btn-sm"
                                disabled={draft.saving}
                                onClick={() => saveEdit(issue.id)}
                              >
                                {draft.saving ? <span className="spinner" /> : 'Update issue'}
                              </button>
                              <button className="btn btn-secondary btn-sm" onClick={() => cancelEdit(issue.id)}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => startEdit(issue)}>
                              Manage
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => setConfirmDeleteId(issue.id)}>
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete this issue?"
        message="Are you sure you want to delete this issue? This cannot be undone."
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}
