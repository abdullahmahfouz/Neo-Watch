import { useEffect, useMemo, useState } from 'react'
import { WarningCircle } from '@phosphor-icons/react'
import { Globe } from '../globe/Globe'
import { TopNav } from '../components/hud/TopNav'
import { SideNav } from '../components/hud/SideNav'
import { CenterReticle } from '../components/hud/CenterReticle'
import { SystemStatusHud } from '../components/hud/SystemStatusHud'
import { ThreatsPanel } from '../components/hud/ThreatsPanel'
import { TelemetryPanel } from '../components/hud/TelemetryPanel'
import { TrajectoriesPanel } from '../components/hud/TrajectoriesPanel'
import { ImpactView } from './ImpactView'
import { ArchiveView } from './ArchiveView'
import { Footer } from '../components/Footer'
import { IngestKeyModal } from '../components/hud/IngestKeyModal'
import { useAsteroidData } from '../hooks/useAsteroidData'
import { getStoredIngestKey, setStoredIngestKey } from '../lib/ingestKey'

export function OrbitView() {
  const { rows, status, error, reload, runIngest } = useAsteroidData()
  const [hazardousOnly, setHazardousOnly] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [activeView, setActiveView] = useState('orbit')
  const [rightPanel, setRightPanel] = useState('threats')
  const [ingestKeyPrompt, setIngestKeyPrompt] = useState(null)

  const filteredRows = useMemo(() => {
    if (!hazardousOnly) return rows
    return rows.filter((r) => r.asteroid.isPotentiallyHazardous)
  }, [rows, hazardousOnly])

  const hazardousRows = useMemo(
    () => rows.filter((r) => r.asteroid.isPotentiallyHazardous),
    [rows],
  )

  useEffect(() => {
    if (filteredRows.length === 0) {
      setSelectedId(null)
      return
    }
    if (!filteredRows.some((r) => r.asteroid.id === selectedId)) {
      setSelectedId(filteredRows[0].asteroid.id)
    }
  }, [filteredRows, selectedId])

  function lockNext() {
    if (filteredRows.length === 0) return
    const idx = filteredRows.findIndex((r) => r.asteroid.id === selectedId)
    const next = filteredRows[(idx + 1) % filteredRows.length]
    setSelectedId(next.asteroid.id)
  }

  function resetFilters() {
    setHazardousOnly(false)
    if (rows.length > 0) setSelectedId(rows[0].asteroid.id)
  }

  function selectFromAlert(id) {
    setSelectedId(id)
    setActiveView('orbit')
  }

  // Shared by the initial "Initiate Scan" click (no key yet, tries the stored
  // one silently) and the key-modal's submit (an explicit retry) — a 401 on
  // the very first attempt just opens the modal, a 401 while it's already
  // open means the key they typed was wrong.
  async function attemptIngest(key) {
    try {
      await runIngest(key)
      if (key) setStoredIngestKey(key)
      setIngestKeyPrompt(null)
    } catch (err) {
      if (err?.status === 401) {
        setIngestKeyPrompt((prev) => ({ error: prev ? 'Incorrect key.' : null }))
      } else {
        setIngestKeyPrompt(null)
      }
    }
  }

  const isLoading = status === 'loading' && rows.length === 0
  const maxScore = useMemo(
    () => Math.max(...filteredRows.map((r) => r.riskScore), 0.0001),
    [filteredRows],
  )
  const selectedRow = filteredRows.find((r) => r.asteroid.id === selectedId) ?? null

  return (
    <div className="flex min-h-dvh w-full flex-col bg-[var(--color-void)]">
      <div className="relative flex h-dvh w-full shrink-0 flex-col overflow-hidden">
        {activeView === 'orbit' && (
          <div className="absolute inset-0">
            <Globe rows={filteredRows} selectedId={selectedId} onSelect={setSelectedId} />
            <CenterReticle />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse at center, transparent 40%, rgb(14 15 18 / 0.6) 100%)',
              }}
            />
          </div>
        )}

        <div className="relative z-10 flex h-full flex-col">
          <TopNav
            activeView={activeView}
            onChangeView={setActiveView}
            hazardousOnly={hazardousOnly}
            onToggleHazardous={() => setHazardousOnly((v) => !v)}
            onReset={resetFilters}
            hazardousRows={hazardousRows}
            onSelectAlert={selectFromAlert}
          />

          <div className="flex flex-1 overflow-hidden">
            <SideNav
              onIngest={() => attemptIngest(getStoredIngestKey())}
              status={status}
              activePanel={rightPanel}
              onChangePanel={setRightPanel}
              panelsDisabled={activeView !== 'orbit'}
            />

            {activeView === 'orbit' && (
              <>
                <div className="flex flex-1 flex-col justify-between overflow-hidden bg-transparent">
                  <div className="flex-1" />

                  {status === 'error' && (
                    <div className="pointer-events-auto mx-auto mb-4 flex items-center gap-3 border border-[var(--color-amber)]/50 bg-[var(--color-panel)]/90 px-4 py-3 backdrop-blur-md">
                      <WarningCircle size={16} className="text-[var(--color-amber)]" />
                      <span className="text-xs text-[var(--color-bone)]">
                        Could not reach the NeoWatch API
                      </span>
                      <button
                        type="button"
                        onClick={reload}
                        className="border border-[var(--color-line-strong)] px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] text-[var(--color-bone)]"
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  <SystemStatusHud status={status} />
                </div>

                {rightPanel === 'threats' && (
                  <ThreatsPanel
                    rows={filteredRows}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onLockNext={lockNext}
                    isLoading={isLoading}
                  />
                )}
                {rightPanel === 'telemetry' && (
                  <TelemetryPanel rows={filteredRows} onLockNext={lockNext} />
                )}
                {rightPanel === 'trajectories' && (
                  <TrajectoriesPanel
                    rows={filteredRows}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onLockNext={lockNext}
                  />
                )}
              </>
            )}

            {activeView === 'impact' && (
              <ImpactView selectedRow={selectedRow} maxScore={maxScore} />
            )}
            {activeView === 'archive' && (
              <ArchiveView rows={filteredRows} maxScore={maxScore} />
            )}
          </div>
        </div>
      </div>

      <Footer />

      {ingestKeyPrompt && (
        <IngestKeyModal
          error={ingestKeyPrompt.error}
          onSubmit={attemptIngest}
          onCancel={() => setIngestKeyPrompt(null)}
        />
      )}
    </div>
  )
}
