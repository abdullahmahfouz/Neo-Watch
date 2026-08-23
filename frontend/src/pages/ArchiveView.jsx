import { RiskSummaryCard } from '../components/RiskSummaryCard'
import { FeaturedAsteroid } from '../components/FeaturedAsteroid'
import { AsteroidTable } from '../components/AsteroidTable'
import { EmptyState } from '../components/EmptyState'
import { formatRiskScore } from '../lib/format'

export function ArchiveView({ rows, maxScore }) {
  const featured = rows[0] ?? null
  const rest = rows.slice(1)
  const hazardousCount = rows.filter((r) => r.asteroid.isPotentiallyHazardous).length

  return (
    <div className="flex-1 overflow-y-auto px-8 py-6">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-8">
        <RiskSummaryCard
          total={rows.length}
          hazardousCount={hazardousCount}
          highestRisk={featured ? formatRiskScore(featured.riskScore) : null}
        />

        {rows.length === 0 && <EmptyState />}

        {rows.length > 0 && (
          <>
            <FeaturedAsteroid row={featured} maxScore={maxScore} />
            {rest.length > 0 && (
              <div className="overflow-x-auto">
                <AsteroidTable rows={rest} maxScore={maxScore} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
