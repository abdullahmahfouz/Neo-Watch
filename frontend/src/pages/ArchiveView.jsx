import { ImpactEnergySummaryCard } from '../components/ImpactEnergySummaryCard'
import { FeaturedAsteroid } from '../components/FeaturedAsteroid'
import { AsteroidTable } from '../components/AsteroidTable'
import { EmptyState } from '../components/EmptyState'
import { formatImpactEnergyWithUnit } from '../lib/format'

export function ArchiveView({ rows, maxScore, status, hazardousOnly, onViewDetails }) {
  const featured = rows[0] ?? null
  const rest = rows.slice(1)
  const hazardousCount = rows.filter((r) => r.asteroid.isPotentiallyHazardous).length
  const isLoading = status === 'loading' && rows.length === 0

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 pt-6 sm:px-8 sm:pb-6">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-8">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-bone)] sm:text-xl">
            {hazardousOnly ? 'Hazardous Alerts' : 'Asteroids to Watch'}
          </h1>
          <p className="mt-1 text-xs text-[var(--color-signal)] sm:text-sm">
            {rows.length} object{rows.length === 1 ? '' : 's'} sorted by estimated impact energy
            {hazardousOnly ? ' — potentially hazardous only' : ''}. These are close approaches, not
            confirmed impact threats.
          </p>
        </div>

        <ImpactEnergySummaryCard
          total={rows.length}
          hazardousCount={hazardousCount}
          highestImpactEnergy={featured ? formatImpactEnergyWithUnit(featured.impactEnergyMt) : null}
        />

        {isLoading && (
          <p className="border-t border-[var(--color-line)] pt-8 text-center text-sm text-[var(--color-signal)]">
            Loading asteroid data…
          </p>
        )}

        {!isLoading && rows.length === 0 && (
          <EmptyState
            message="No asteroids to display."
            hint={hazardousOnly ? 'No potentially hazardous objects in the current feed.' : 'Try refreshing the data.'}
          />
        )}

        {!isLoading && rows.length > 0 && (
          <>
            <FeaturedAsteroid
              row={featured}
              maxScore={maxScore}
              onViewDetails={onViewDetails ? () => onViewDetails(featured.asteroid.id) : undefined}
            />
            {rest.length > 0 && (
              <AsteroidTable rows={rest} maxScore={maxScore} onViewDetails={onViewDetails} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
