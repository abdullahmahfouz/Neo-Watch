import { buildApiUrl } from './config'

// Thin fetch wrapper over the Spring Boot backend using VITE_API_BASE_URL.

async function request(path, options = {}) {
  const res = await fetch(buildApiUrl(path), options)
  if (!res.ok) {
    const err = new Error(`${path} failed: ${res.status} ${res.statusText}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

export const api = {
  // One call for everything the dashboard needs (asteroid + next approach +
  // impact energy estimate per row) instead of upcoming() + hazardous() + a
  // history()/impactEnergy() round trip per asteroid.
  dashboard: () => request('/api/neo/dashboard'),
  upcoming: () => request('/api/neo/upcoming'),
  hazardous: () => request('/api/neo/hazardous'),
  history: (asteroidId) => request(`/api/neo/${asteroidId}/history`),
  impactEnergy: (asteroidId) => request(`/api/neo/${asteroidId}/impact-energy`),
  impactEnergyHistory: (asteroidId) => request(`/api/neo/${asteroidId}/impact-energy-history`),
}
