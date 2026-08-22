const STATUS_CLASS = {
  Reported: 'status-reported',
  'In Progress': 'status-in-progress',
  Resolved: 'status-resolved',
}

export default function StatusBadge({ status }) {
  const cls = STATUS_CLASS[status] || 'status-reported'
  return <span className={`status-badge ${cls}`}>{status}</span>
}
