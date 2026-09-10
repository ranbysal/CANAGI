import type { Layer, MetricCardData, MetricRow, Occupation } from '../types'
import { aggregateField, isKnown, OUTLOOK_DEFINITIONS, outlookOf, TEER_DEFINITIONS, teerOf } from './careers'
import { EXPOSURE_TIERS, formatCompact, formatPay, MAP_PALETTE, PAY_COLORS, OUTLOOK_COLORS, PAY_TIERS, TEER_COLORS } from './format'

const colors = MAP_PALETTE
const percent = (n: number, total: number) => total > 0 ? `${Math.round(n / total * 100)}%` : 'N/A'
const average = (data: Occupation[]) => {
  const a = aggregateField(data)
  return a.exposureMean == null ? 'N/A' : a.exposureMean.toFixed(1)
}
function bins(data: Occupation[], field: 'pay' | 'exposure'): MetricRow[] {
  const known = data.filter(d => isKnown(d[field]) && isKnown(d.jobs))
  const total = known.reduce((s, d) => s + d.jobs!, 0)
  const tiers = field === 'pay' ? PAY_TIERS : EXPOSURE_TIERS
  return tiers.map((t, i) => {
    const jobs = data.filter(d => isKnown(d[field]) && d[field]! >= t.min && d[field]! < t.max).reduce((s, d) => s + (d.jobs ?? 0), 0)
    return { label: t.label, value: known.length ? formatCompact(jobs) : 'N/A', share: percent(jobs, total), bar: total ? jobs / total * 100 : 0, color: (field === 'pay' ? PAY_COLORS : colors)[i] }
  })
}
export function getMetricCards(layer: Layer, data: Occupation[]): MetricCardData[] {
  const a = aggregateField(data)
  const jobs: MetricCardData = { title: 'Covered employment', value: a.jobs == null ? 'N/A' : formatCompact(a.jobs), note: `2023 · ${a.employmentCount} of ${a.count} occupations. Not vacancies.` }
  const coverage: MetricCardData = { title: 'Matching occupations', value: String(a.count), note: `${a.count - a.employmentCount} without employment sizes; available in List.` }
  const shortage: MetricCardData = { title: 'Shortage employment', value: a.shortageShare == null ? 'N/A' : `${Math.round(a.shortageShare * 100)}%`, note: `Of ${formatCompact(a.assessedJobs)} covered jobs with a COPS assessment. 2024 to 2033.` }
  const educationRows: MetricRow[] = TEER_DEFINITIONS.map((t, i) => { const count = data.filter(d => teerOf(d)?.id === t.id).length; return { label: `TEER ${t.id}`, value: String(count), bar: a.count ? count / a.count * 100 : 0, color: TEER_COLORS[i] } })
  const exposure: MetricCardData = { title: 'Avg. exposure index', value: a.exposureMean?.toFixed(1) ?? 'N/A', note: `Relative 0 to 10 index, weighted by ${formatCompact(a.exposureJobs)} covered 2023 jobs.`, accent: 'var(--blue)' }
  const outlookRows: MetricRow[] = OUTLOOK_DEFINITIONS.slice(0, 5).map((o, index) => {
    const jobs = data.filter(d => outlookOf(d).id === o.id).reduce((s, d) => s + (d.jobs ?? 0), 0)
    return { label: o.label.replace(' risk of', ''), value: a.assessedCount ? formatCompact(jobs) : 'N/A', bar: a.assessedJobs ? jobs / a.assessedJobs * 100 : 0, color: OUTLOOK_COLORS[index] }
  })
  const rows = layer === 'exposure' ? bins(data, 'exposure') : layer === 'pay' ? bins(data, 'pay') : layer === 'education' ? educationRows : outlookRows
  const distribution = { title: layer === 'education' ? 'Occupations by TEER' : `Employment by ${layer === 'pay' ? 'pay estimate' : layer}`, chart: rows.map(r => ({ label: r.label, value: r.bar ?? 0, display: r.value, color: r.color ?? '#777' })) }
  const pay: MetricCardData = { title: 'Middle annualized pay', value: a.payMedian == null ? 'N/A' : formatPay(a.payMedian), note: `${a.payCount} occupation medians. Hourly × 2,080; not observed yearly earnings.`, accent: 'var(--blue)' }
  const byTeer: MetricCardData = { title: 'Exposure by TEER', note: 'Employment weighted, 0 to 10', rows: TEER_DEFINITIONS.map((t, i) => ({ label: `TEER ${t.id}`, value: average(data.filter(d => teerOf(d)?.id === t.id)), color: TEER_COLORS[i] })) }
  return [jobs, layer === 'pay' ? pay : exposure, distribution, { title: layer === 'education' ? 'Pathway mix (occupations)' : 'Outlook employment', rows: layer === 'education' ? educationRows : outlookRows }, byTeer, shortage, coverage]
}
