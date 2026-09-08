import { displayRecord } from './displayCopy'
import { useEffect, useState } from 'react'
import type { CareerEvidence } from '../types'

const cache = new Map<string, Promise<CareerEvidence>>()
export function useCareerEvidence(code: string) {
  const [result, setResult] = useState<{ code: string; data?: CareerEvidence; error?: boolean }>({ code })
  useEffect(() => {
    let active = true
    let request = cache.get(code)
    if (!request) {
      request = fetch(`/data/evidence/${code}.json`).then(response => {
        if (!response.ok) throw new Error('Evidence unavailable')
        return response.json() as Promise<CareerEvidence>
      }).then(data => { if (data.noc !== code) throw new Error('Mismatched evidence'); return displayRecord(data) })
      cache.set(code, request)
    }
    request.then(data => { if (active) setResult({ code, data }) }).catch(() => { cache.delete(code); if (active) setResult({ code, error: true }) })
    return () => { active = false }
  }, [code])
  return result.code === code ? result : { code }
}
