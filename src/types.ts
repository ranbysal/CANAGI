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
  employment_reference?: string
  wage?: {
    low: number | null; median: number | null; high: number | null
    unit: 'hour' | 'year'; reference: string; updated: string; source: string; note: string
  }
  ai?: {
    model: string; range: [number, number]; profiles: number; explanation: string
    drivers: string[]; humanOversight: number; rawScore: number; assessed: string
  }
}

export interface ActivityEvidence { name: string; level: number; capability: number; contribution: number; reason: string }
export interface CareerEvidence {
  noc: string; description: string; duties: string[]; requirements: string[]
  ai: {
    model: string; rawScore: number; score: number; sensitivityRange: [number, number]
    profileRange: [number, number]; assessed: string; cohort: number
    profiles: { code: string; title: string; rawScore: number; levels: Record<string, number> }[]
    drivers: ActivityEvidence[]; constraints: ActivityEvidence[]; activities: ActivityEvidence[]
    humanContext: { name: string; level: number; reason: string }[]
  }
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
