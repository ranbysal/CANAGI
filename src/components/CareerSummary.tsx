import { useMemo } from 'react'
import type { Occupation } from '../types'
import { aggregateField, annualPay } from '../lib/careers'
import { formatCompact } from '../lib/format'

export function CareerSummary({ data }: { data: Occupation[] }) {
  const stats = useMemo(() => aggregateField(data), [data])
  return <dl className="research-summary" aria-label="Summary of matching occupations">
    <div><dt>Covered employment</dt><dd>{stats.jobs == null ? 'N/A' : formatCompact(stats.jobs)}</dd><small>2023 · {stats.employmentCount}/{data.length} occupations</small></div>
    <div><dt>Middle occupation pay</dt><dd>{annualPay(stats.payMedian)}</dd><small>Annualized CAD · {stats.payCount} wage records</small></div>
    <div><dt>Relative AI exposure</dt><dd>{stats.exposureMean?.toFixed(1) ?? 'N/A'}<span> / 10</span></dd><small>Employment weighted · experimental</small></div>
    <div><dt>Employment in shortage roles</dt><dd>{stats.shortageShare == null ? 'N/A' : `${Math.round(stats.shortageShare * 100)}%`}</dd><small>Of assessed jobs · outlook 2024 to 2033</small></div>
  </dl>
}
