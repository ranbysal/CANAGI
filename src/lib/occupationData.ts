import type { Occupation } from '../types'

let pending: Promise<Occupation[]> | null = null

/** One request shared by the explorer and the launch stage. A failure can be retried. */
export function loadOccupations() {
  if (!pending) {
    pending = fetch('/data/occupations.json')
      .then(response => {
        if (!response.ok) throw new Error('Occupation data could not be loaded')
        return response.json() as Promise<Occupation[]>
      })
    pending.catch(() => { pending = null })
  }
  return pending
}
