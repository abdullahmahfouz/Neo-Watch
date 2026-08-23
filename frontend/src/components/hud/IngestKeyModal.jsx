import { useState } from 'react'
import { Lock } from '@phosphor-icons/react'

export function IngestKeyModal({ error, onSubmit, onCancel }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!value.trim()) return
    onSubmit(value.trim())
  }

  return (
    <div className="pointer-events-auto fixed inset-0 z-[60] flex items-center justify-center bg-[var(--color-void)]/70 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="flex w-[320px] flex-col gap-4 border border-[var(--color-line-strong)] bg-[var(--color-panel)] p-6"
      >
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-[var(--color-amber)]" />
          <h2 className="text-sm font-semibold text-[var(--color-bone)]">
            Ingest key required
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-[var(--color-signal)]">
          This deployment requires a key to trigger ingestion. Kept for this
          browser tab only.
        </p>
        <label className="flex flex-col gap-[var(--spacing-stack)]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-signal)]">
            Key
          </span>
          <input
            type="password"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full border border-[var(--color-line-strong)] bg-transparent px-3 py-2 text-sm text-[var(--color-bone)] outline-none focus:border-[var(--color-amber)] focus:ring-1 focus:ring-[var(--color-amber)]"
          />
        </label>
        {error && <p className="text-xs text-[var(--color-amber)]">{error}</p>}
        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-[var(--color-signal)] transition-colors hover:text-[var(--color-bone)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-[var(--color-amber)] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[#241705] transition-transform active:translate-y-px"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  )
}
