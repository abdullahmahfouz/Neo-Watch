import { ArrowLeft } from '@phosphor-icons/react'
import { FeaturedAsteroid } from '../components/FeaturedAsteroid'
import { EmptyState } from '../components/EmptyState'
import { EnergyExplainer } from '../components/EnergyExplainer'
import { useAsteroidDetail } from '../hooks/useAsteroidDetail'
import {
  formatDate,
  formatDateTime,
  formatDistance,
  formatImpactEnergyWithUnit,
  formatVelocity,
} from '../lib/format'

function Section({ title, children }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--color-signal)]">
        {title}
      </h3>
      {children}
    </div>
  )
}

function SkeletonBlock() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-8 animate-pulse bg-[var(--color-line-strong)]" />
      ))}
    </div>
  )
}

export function ImpactView({ selectedRow, maxScore, onBack }) {
  const asteroidId = selectedRow?.asteroid.id ?? null
  const { history, impactEnergyHistory, status } = useAsteroidDetail(asteroidId)

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 pt-6 sm:px-8 sm:pb-6">
      <div className="mx-auto flex max-w-[900px] flex-col gap-10">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="-ml-2 flex min-h-11 w-fit items-center gap-2 px-2 text-xs font-semibold text-[var(--color-signal)] transition-colors hover:text-[var(--color-amber)]"
          >
            <ArrowLeft size={15} weight="bold" />
            Back
          </button>
        )}

        {!selectedRow && (
          <EmptyState message="No asteroid selected." hint="Pick an asteroid from the watchlist to see its details." />
        )}

        {selectedRow && (
          <>
            <FeaturedAsteroid row={selectedRow} maxScore={maxScore} />

            <Section title="About this estimate">
              <div className="border border-[var(--color-line)] bg-[var(--color-panel)]/60 p-4 text-sm leading-relaxed text-[var(--color-signal)]">
                <EnergyExplainer />
              </div>
            </Section>

            <Section title="Approach history">
              {status === 'loading' && <SkeletonBlock />}
              {status !== 'loading' && history.length === 0 && (
                <p className="text-sm text-[var(--color-signal)]">
                  No recorded approaches for this object.
                </p>
              )}
              {status !== 'loading' && history.length > 0 && (
                <div className="border-t border-[var(--color-line)]">
                  <div className="grid grid-cols-4 gap-4 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-signal)]">
                    <span>Date</span>
                    <span>Distance from Earth</span>
                    <span>Speed</span>
                    <span>Orbits</span>
                  </div>
                  {[...history]
                    .sort((a, b) => a.approachDate.localeCompare(b.approachDate))
                    .map((approach) => (
                      <div
                        key={approach.id}
                        className="grid grid-cols-4 gap-4 border-b border-[var(--color-line)] py-3 text-sm"
                      >
                        <span className="tabular text-[var(--color-bone)]">
                          {formatDate(approach.approachDate)}
                        </span>
                        <span className="tabular text-[var(--color-bone)]">
                          {formatDistance(approach.missDistanceKm)} LD
                        </span>
                        <span className="tabular text-[var(--color-bone)]">
                          {formatVelocity(approach.relativeVelocityKmh)} km/s
                        </span>
                        <span className="text-[var(--color-signal)]">
                          {approach.orbitingBody}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </Section>

            <Section title="Impact energy trend, per data refresh">
              {status === 'loading' && <SkeletonBlock />}
              {status !== 'loading' && impactEnergyHistory.length === 0 && (
                <p className="text-sm text-[var(--color-signal)]">
                  No impact energy snapshots recorded yet. Refresh the data to start a trend.
                </p>
              )}
              {status !== 'loading' && impactEnergyHistory.length > 0 && (
                <div className="border-t border-[var(--color-line)]">
                  {impactEnergyHistory.map((snapshot) => (
                    <div
                      key={snapshot.id}
                      className="flex items-center justify-between border-b border-[var(--color-line)] py-3 text-sm"
                    >
                      <span className="tabular text-[var(--color-signal)]">
                        {formatDateTime(snapshot.calculatedAt)}
                      </span>
                      <span className="tabular text-[var(--color-amber)]">
                        {formatImpactEnergyWithUnit(snapshot.impactEnergyMt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </>
        )}
      </div>
    </div>
  )
}
