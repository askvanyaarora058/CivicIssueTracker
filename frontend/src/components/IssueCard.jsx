import { Link } from 'react-router-dom'
import StatusBadge from './StatusBadge.jsx'

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function IssueCard({ issue }) {
  return (
    <div className="issue-card">
      <div className="issue-card-top">
        <div>
          <span className="issue-category-tag">{issue.category}</span>
          <h3 style={{ marginTop: 8 }}>{issue.title}</h3>
        </div>
        <StatusBadge status={issue.status} />
      </div>

      <p className="issue-desc">{issue.description}</p>

      <div className="issue-meta">
        <span>{issue.address || 'No address given'}</span>
        <span>{formatDate(issue.created_at)}</span>
      </div>

      <div>
        <Link to={`/issues/${issue.id}`} className="btn btn-secondary btn-sm">
          View details
        </Link>
      </div>
    </div>
  )
}
