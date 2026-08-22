const STATUS_OPTIONS = ['All', 'Reported', 'In Progress', 'Resolved']

const CATEGORY_OPTIONS = [
  { label: 'All categories', value: 'All' },
  { label: 'Pothole', value: 'pothole' },
  { label: 'Garbage', value: 'garbage' },
  { label: 'Street Light', value: 'streetlight' },
  { label: 'Other', value: 'other' },
]

export default function IssueFilters({ filters, onChange }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value })
  }

  return (
    <div className="filters-bar">
      <input
        type="text"
        placeholder="Search by title or description…"
        value={filters.search}
        onChange={(e) => update('search', e.target.value)}
        aria-label="Search issues"
      />

      <select
        value={filters.status}
        onChange={(e) => update('status', e.target.value)}
        aria-label="Filter by status"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s === 'All' ? 'All statuses' : s}
          </option>
        ))}
      </select>

      <select
        value={filters.category}
        onChange={(e) => update('category', e.target.value)}
        aria-label="Filter by category"
      >
        {CATEGORY_OPTIONS.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export { CATEGORY_OPTIONS }