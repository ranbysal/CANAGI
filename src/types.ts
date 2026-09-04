export type Layer = 'outlook' | 'pay' | 'education' | 'exposure'

export interface Occupation {
  title: string
  slug: string
  noc_code: string
  category: string
  pay: number | null
  jobs: number | null
  outlook: number | null
  outlook_desc: string
  education: string | null
  exposure: number | null
}

export interface DistributionDatum {
  label: string
  value: number
  display: string
  color: string
}

export interface MetricRow {
  label: string
  value: string
  share?: string
  color?: string
  bar?: number
}

export interface MetricCardData {
  title: string
  value?: string
  note?: string
  accent?: string
  chart?: DistributionDatum[]
  rows?: MetricRow[]
}
