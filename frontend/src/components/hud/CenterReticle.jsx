export function CenterReticle() {
  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-40"
    >
      <path d="M100 20V80" stroke="var(--color-bone)" strokeOpacity="0.5" strokeWidth="0.5" />
      <path d="M100 120V180" stroke="var(--color-bone)" strokeOpacity="0.5" strokeWidth="0.5" />
      <path d="M20 100H80" stroke="var(--color-bone)" strokeOpacity="0.5" strokeWidth="0.5" />
      <path d="M120 100H180" stroke="var(--color-bone)" strokeOpacity="0.5" strokeWidth="0.5" />
      <circle cx="100" cy="100" r="15" stroke="var(--color-bone)" strokeOpacity="0.5" strokeWidth="0.5" />
      <circle cx="100" cy="100" r="2" fill="var(--color-amber)" />
      <path d="M40 40H60M40 40V60" stroke="var(--color-bone)" strokeOpacity="0.5" strokeWidth="0.5" />
      <path d="M160 40H140M160 40V60" stroke="var(--color-bone)" strokeOpacity="0.5" strokeWidth="0.5" />
      <path d="M40 160H60M40 160V140" stroke="var(--color-bone)" strokeOpacity="0.5" strokeWidth="0.5" />
      <path d="M160 160H140M160 160V140" stroke="var(--color-bone)" strokeOpacity="0.5" strokeWidth="0.5" />
    </svg>
  )
}
