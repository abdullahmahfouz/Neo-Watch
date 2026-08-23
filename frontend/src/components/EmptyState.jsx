export function EmptyState({ message = 'No close approaches in this window' }) {
  return (
    <div className="flex flex-col items-center gap-4 border-t border-[var(--color-line)] py-20 text-center">
      <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
        <circle cx="36" cy="36" r="2.4" fill="var(--color-signal)" />
        <ellipse
          cx="36"
          cy="36"
          rx="28"
          ry="12"
          stroke="var(--color-line-strong)"
          strokeWidth="1"
        />
        <ellipse
          cx="36"
          cy="36"
          rx="12"
          ry="28"
          stroke="var(--color-line-strong)"
          strokeWidth="1"
          transform="rotate(35 36 36)"
        />
      </svg>
      <p className="text-sm text-[var(--color-signal)]">{message}</p>
    </div>
  )
}
