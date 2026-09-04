import type { DistributionDatum, Layer, MetricCardData, Occupation } from '../types'
import {
  EDUCATION_LEVELS,
  EDUCATION_SHORT,
  EXPOSURE_TIERS,
  OUTLOOK_TIERS,
  PAY_TIERS,
  educationIndex,
  formatCompact,
  formatPay,
  formatPercent,
} from './format'

type NumericField = 'pay' | 'outlook' | 'exposure'

function totalJobs(data: Occupation[]) {
  return data.reduce((sum, item) => sum + (item.jobs ?? 0), 0)
}

function weightedAverage(data: Occupation[], field: NumericField) {
  let weighted = 0
  let weight = 0
  data.forEach((item) => {
    const value = item[field]
    if (value != null && item.jobs) {
      weighted += value * item.jobs
      weight += item.jobs
    }
  })
  return weight ? weighted / weight : 0
}

function sumJobs(data: Occupation[], predicate: (item: Occupation) => boolean) {
  return data.reduce((sum, item) => sum + (predicate(item) ? item.jobs ?? 0 : 0), 0)
}

function tierRows(
  data: Occupation[],
  tiers: ReadonlyArray<{ label: string; min: number; max: number }>,
  value: (item: Occupation) => number | null,
  colors: string[],
) {
  const total = totalJobs(data)
  return tiers.map((tier, index) => {
    const jobs = sumJobs(data, (item) => {
      const current = value(item)
      return current != null && current >= tier.min && current < tier.max
    })
    return {
      label: tier.label,
      value: formatCompact(jobs),
      share: `${Math.round((jobs / total) * 100)}%`,
      color: colors[index],
      bar: (jobs / total) * 100,
    }
  })
}

function groupAverage(
  data: Occupation[],
  groups: ReadonlyArray<{ label: string; test: (item: Occupation) => boolean }>,
  field: NumericField,
  formatter: (value: number) => string,
  colors: string[],
) {
  const values = groups.map((group) => weightedAverage(data.filter(group.test), field))
  const max = Math.max(...values, 1)
  return groups.map((group, index) => ({
    label: group.label,
    value: formatter(values[index]),
    color: colors[index % colors.length],
    bar: (values[index] / max) * 100,
  }))
}

function educationGroups() {
  return EDUCATION_LEVELS.map((level, index) => ({
    label: EDUCATION_SHORT[index],
    test: (item: Occupation) => item.education === level,
  }))
}

function payGroups() {
  return PAY_TIERS.map((tier) => ({
    label: tier.label,
    test: (item: Occupation) => item.pay != null && item.pay >= tier.min && item.pay < tier.max,
  }))
}

function outlookGroups() {
  return OUTLOOK_TIERS.map((tier) => ({
    label: tier.label,
    test: (item: Occupation) => item.outlook != null && item.outlook >= tier.min && item.outlook < tier.max,
  }))
}

function distribution(
  rows: ReturnType<typeof tierRows>,
): DistributionDatum[] {
  return rows.map((row) => ({
    label: row.label,
    value: row.bar ?? 0,
    display: row.value,
    color: row.color ?? '#777',
  }))
}

const greenRed = ['#267b49', '#6f9b4c', '#c4a544', '#cf6f37', '#a92c37']
const redGreen = [...greenRed].reverse()
const educationColors = ['#347b49', '#6f9c4d', '#ad9d49', '#c27842', '#b23a43', '#8e2635']

function exposureCards(data: Occupation[]): MetricCardData[] {
  const total = totalJobs(data)
  const rows = tierRows(data, EXPOSURE_TIERS, (item) => item.exposure, greenRed)
  const wagesExposed = data.reduce(
    (sum, item) => sum + ((item.exposure ?? 0) >= 7 ? (item.jobs ?? 0) * (item.pay ?? 0) : 0),
    0,
  )
  return [
    { title: 'Total jobs', value: formatCompact(total), note: `${data.filter((item) => item.jobs).length} occupations with employment data` },
    { title: 'Avg. exposure', value: weightedAverage(data, 'exposure').toFixed(1), note: 'Job-weighted, 0–10', accent: '#b52332' },
    { title: 'Jobs by exposure', chart: distribution(rows) },
    { title: 'Exposure tiers', rows },
    {
      title: 'Exposure by pay',
      rows: groupAverage(data, payGroups(), 'exposure', (value) => value.toFixed(1), greenRed),
    },
    {
      title: 'Exposure by education',
      rows: groupAverage(data, educationGroups(), 'exposure', (value) => value.toFixed(1), educationColors),
    },
    { title: 'Wages exposed', value: `$${(wagesExposed / 1_000_000_000_000).toFixed(1)}T`, note: 'Annual CAD in jobs scoring 7+', accent: '#b52332' },
  ]
}

function payCards(data: Occupation[]): MetricCardData[] {
  const total = totalJobs(data)
  const rows = tierRows(data, PAY_TIERS, (item) => item.pay, redGreen)
  const totalWages = data.reduce((sum, item) => sum + (item.jobs ?? 0) * (item.pay ?? 0), 0)
  return [
    { title: 'Total jobs', value: formatCompact(total), note: 'Across the Canadian economy' },
    { title: 'Avg. pay', value: formatPay(weightedAverage(data, 'pay')), note: 'Job-weighted annual median', accent: '#267b49' },
    { title: 'Jobs by pay', chart: distribution(rows) },
    { title: 'Pay tiers', rows },
    {
      title: 'Pay by education',
      rows: groupAverage(data, educationGroups(), 'pay', formatPay, educationColors),
    },
    {
      title: 'Pay by outlook',
      rows: groupAverage(data, outlookGroups(), 'pay', formatPay, redGreen),
    },
    { title: 'Total wages', value: `$${(totalWages / 1_000_000_000_000).toFixed(1)}T`, note: 'Estimated annual CAD', accent: '#267b49' },
  ]
}

function educationCards(data: Occupation[]): MetricCardData[] {
  const total = totalJobs(data)
  const educationTierDefinitions = EDUCATION_LEVELS.map((level, index) => ({
    label: EDUCATION_SHORT[index],
    min: index,
    max: index + 1,
  }))
  const rows = tierRows(data, educationTierDefinitions, (item) => {
    const index = educationIndex(item.education)
    return index < 0 ? null : index
  }, educationColors)
  const universityJobs = sumJobs(data, (item) => educationIndex(item.education) >= 4)
  const noDegreeJobs = sumJobs(data, (item) => educationIndex(item.education) <= 1 && educationIndex(item.education) >= 0)
  return [
    { title: 'Total jobs', value: formatCompact(total), note: 'Across the Canadian economy' },
    { title: 'University+', value: `${Math.round((universityJobs / total) * 100)}%`, note: 'Of all jobs', accent: '#a92c37' },
    { title: 'Jobs by education', chart: distribution(rows) },
    { title: 'Education tiers', rows },
    {
      title: 'Avg. pay by education',
      rows: groupAverage(data, educationGroups(), 'pay', formatPay, educationColors),
    },
    {
      title: 'Avg. outlook by education',
      rows: groupAverage(data, educationGroups(), 'outlook', formatPercent, educationColors),
    },
    { title: 'No degree / HS', value: formatCompact(noDegreeJobs), note: 'Jobs with no degree required', accent: '#267b49' },
  ]
}

function outlookCards(data: Occupation[]): MetricCardData[] {
  const total = totalJobs(data)
  const rows = tierRows(data, OUTLOOK_TIERS, (item) => item.outlook, redGreen)
  const surplusJobs = sumJobs(data, (item) => (item.outlook ?? 0) < 0)
  const shortageJobs = sumJobs(data, (item) => (item.outlook ?? 0) > 0)
  return [
    { title: 'Total jobs', value: formatCompact(total), note: 'Across the Canadian economy' },
    { title: 'Avg. outlook', value: formatPercent(weightedAverage(data, 'outlook')), note: 'Job-weighted, 2024–2033', accent: '#267b49' },
    { title: 'Jobs by outlook', chart: distribution(rows) },
    { title: 'Outlook tiers', rows },
    {
      title: 'Outlook by pay',
      rows: groupAverage(data, payGroups(), 'outlook', formatPercent, redGreen),
    },
    {
      title: 'Outlook by education',
      rows: groupAverage(data, educationGroups(), 'outlook', formatPercent, educationColors),
    },
    { title: 'Surplus jobs', value: formatCompact(surplusJobs), note: `${formatCompact(shortageJobs)} jobs have positive growth`, accent: '#a92c37' },
  ]
}

export function getMetricCards(layer: Layer, data: Occupation[]) {
  if (layer === 'pay') return payCards(data)
  if (layer === 'education') return educationCards(data)
  if (layer === 'exposure') return exposureCards(data)
  return outlookCards(data)
}
