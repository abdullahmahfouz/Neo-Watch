export function EmptyState({ message = 'No asteroids to display.', hint }) {
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
      <div className="flex flex-col gap-1">
        <p className="text-sm text-[var(--color-bone)]">{message}</p>
        {hint && <p className="text-xs text-[var(--color-signal)]">{hint}</p>}
      </div>
    </div>
  )
}
