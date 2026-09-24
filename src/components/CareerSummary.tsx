import { useMemo } from 'react'
import type { Occupation } from '../types'
import { aggregateField, annualPay } from '../lib/careers'
import { formatCompact } from '../lib/format'
import { CountUp } from './CountUp'

export function CareerSummary({ data }: { data: Occupation[] }) {
  const stats = useMemo(() => aggregateField(data), [data])
  return <dl className="research-summary" aria-label="Summary of matching occupations">
    <div><dt>Covered employment</dt><dd><CountUp value={stats.jobs == null ? 'N/A' : formatCompact(stats.jobs)} delay={120} /></dd><small>2023 · {stats.employmentCount}/{data.length} occupations</small></div>
    <div><dt>Middle occupation pay</dt><dd><CountUp value={annualPay(stats.payMedian)} delay={190} /></dd><small>Annualized CAD · {stats.payCount} wage records</small></div>
    <div><dt>Relative AI exposure</dt><dd><CountUp value={stats.exposureMean?.toFixed(1) ?? 'N/A'} delay={260} /><span> / 10</span></dd><small>Employment weighted · experimental</small></div>
    <div><dt>Employment in shortage roles</dt><dd><CountUp value={stats.shortageShare == null ? 'N/A' : `${Math.round(stats.shortageShare * 100)}%`} delay={330} /></dd><small>Of assessed jobs · outlook 2024 to 2033</small></div>
  </dl>
}
