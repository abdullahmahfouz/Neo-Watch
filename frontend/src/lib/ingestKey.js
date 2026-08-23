// Session-only (not localStorage): the ingest key is never baked into the
// build, only entered by hand and kept in memory for this browser tab.
const KEY = 'neowatch.ingestKey'

export function getStoredIngestKey() {
  try {
    return sessionStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function setStoredIngestKey(value) {
  try {
    sessionStorage.setItem(KEY, value)
  } catch {
    // Ignore — private browsing / storage blocked. Key just won't persist
    // across the two ingest calls within this tab.
  }
}

export function clearStoredIngestKey() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
