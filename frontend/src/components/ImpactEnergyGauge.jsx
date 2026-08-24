import { useEffect, useState } from 'react'
import { motion, useReducedMotion, animate } from 'motion/react'
import { formatImpactEnergy, formatEnergyComparison } from '../lib/format'

// Bars are scaled proportionally against the highest impact energy estimate currently loaded,
// not a fixed 0-100 ceiling. The backend's kinetic-energy formula (megatons of TNT equivalent)
// has no fixed max, so a relative scale is the honest one. This is a magnitude bar, not a
// probability meter — it never implies "X% chance of impact."
export function ImpactEnergyGauge({ score, maxScore, delay = 0, size = 'md', showComparison = false }) {
  const reduceMotion = useReducedMotion()
  const ratio = maxScore > 0 ? Math.min(score / maxScore, 1) : 0
  const [displayScore, setDisplayScore] = useState(reduceMotion ? score : 0)
  const height = size === 'lg' ? 'h-2' : 'h-1.5'
  const comparison = showComparison ? formatEnergyComparison(score) : null

  useEffect(() => {
    if (reduceMotion) {
      setDisplayScore(score)
      return
    }
    const controls = animate(0, score, {
      duration: 0.9,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplayScore(v),
    })
    return () => controls.stop()
  }, [score, delay, reduceMotion])

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <div className={`relative w-full ${height} bg-[var(--color-line)]`}>
          <motion.div
            className={`absolute inset-y-0 left-0 bg-[var(--color-amber)] ${height}`}
            initial={{ width: reduceMotion ? `${ratio * 100}%` : 0 }}
            animate={{ width: `${ratio * 100}%` }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] }
            }
          />
        </div>
        <span
          className={`tabular shrink-0 text-[var(--color-amber)] ${
            size === 'lg' ? 'text-2xl font-medium' : 'text-sm font-medium'
          }`}
        >
          {formatImpactEnergy(displayScore)}
        </span>
      </div>
      {comparison && (
        <span className="text-[10px] text-[var(--color-signal)]">{comparison}</span>
      )}
    </div>
  )
}
