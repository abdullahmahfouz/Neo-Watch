import { useEffect, useState } from 'react'
import { api } from '../api/client'

// Backs the Impact view: pulls full approach history and the impact-energy
// trend for one asteroid on demand. Both endpoints exist on the backend
// (NeoController) but had no UI consumer until now.
export function useAsteroidDetail(asteroidId) {
  const [history, setHistory] = useState([])
  const [impactEnergyHistory, setImpactEnergyHistory] = useState([])
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    if (asteroidId == null) {
      setHistory([])
      setImpactEnergyHistory([])
      setStatus('idle')
      return
    }
    let cancelled = false
    setStatus('loading')
    Promise.all([api.history(asteroidId), api.impactEnergyHistory(asteroidId)])
      .then(([h, eh]) => {
        if (cancelled) return
        setHistory(h)
        setImpactEnergyHistory(eh)
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [asteroidId])

  return { history, impactEnergyHistory, status }
}
