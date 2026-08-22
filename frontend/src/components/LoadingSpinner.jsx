export default function LoadingSpinner({ size = 'md', label }) {
  return (
    <div className="spinner-center" role="status" aria-live="polite">
      <span className={`spinner ${size === 'lg' ? 'spinner-lg' : ''}`} />
      {label && <span style={{ marginLeft: 12, color: 'var(--ink-soft)' }}>{label}</span>}
    </div>
  )
}
