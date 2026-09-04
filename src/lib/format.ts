import type { Layer, Occupation } from '../types'

export const EDUCATION_LEVELS = [
  'No formal education required',
  'High school diploma',
  'College diploma or apprenticeship (< 2 years)',
  'College diploma or apprenticeship (2+ years)',
  'University degree',
  'University degree + significant experience',
] as const

export const EDUCATION_SHORT = [
  'No formal',
  'High school',
  'College <2yr',
  'College 2+yr',
  'University',
  'Univ + exp',
] as const

export const OUTLOOK_TIERS = [
  { label: 'Strong surplus', min: Number.NEGATIVE_INFINITY, max: -4 },
  { label: 'Moderate surplus', min: -4, max: 0 },
  { label: 'Balance', min: 0, max: 6 },
  { label: 'Moderate shortage', min: 6, max: 11 },
  { label: 'Strong shortage', min: 11, max: Number.POSITIVE_INFINITY },
] as const

export const PAY_TIERS = [
  { label: '<$35K', min: 0, max: 35_000 },
  { label: '$35–50K', min: 35_000, max: 50_000 },
  { label: '$50–75K', min: 50_000, max: 75_000 },
  { label: '$75–100K', min: 75_000, max: 100_000 },
  { label: '$100K+', min: 100_000, max: Number.POSITIVE_INFINITY },
] as const

export const EXPOSURE_TIERS = [
  { label: 'Minimal (0–1)', min: 0, max: 2 },
  { label: 'Low (2–3)', min: 2, max: 4 },
  { label: 'Moderate (4–5)', min: 4, max: 6 },
  { label: 'High (6–7)', min: 6, max: 8 },
  { label: 'Very high (8–10)', min: 8, max: 11 },
] as const

export const LAYER_LABELS: Record<Layer, string> = {
  outlook: 'COPS Outlook',
  pay: 'Median Pay',
  education: 'Education (TEER)',
  exposure: 'Digital AI Exposure',
}

export function educationIndex(value: string | null) {
  if (!value) return -1
  return EDUCATION_LEVELS.indexOf(value as (typeof EDUCATION_LEVELS)[number])
}

export function formatCompact(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return Math.round(value).toLocaleString('en-CA')
}

export function formatPay(value: number) {
  return `$${Math.round(value / 1_000)}K`
}

export function formatPercent(value: number) {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
}

function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(normalized, 16)
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

function mix(a: string, b: string, amount: number) {
  const start = hexToRgb(a)
  const end = hexToRgb(b)
  const t = Math.max(0, Math.min(1, amount))
  const channel = (from: number, to: number) => Math.round(from + (to - from) * t)
  return `rgb(${channel(start.r, end.r)}, ${channel(start.g, end.g)}, ${channel(start.b, end.b)})`
}

function threeStop(low: string, middle: string, high: string, amount: number) {
  return amount <= 0.5
    ? mix(low, middle, amount * 2)
    : mix(middle, high, (amount - 0.5) * 2)
}

export function layerColor(layer: Layer, occupation: Occupation) {
  if (layer === 'exposure') {
    return threeStop('#1f7a46', '#c4a43d', '#a92835', (occupation.exposure ?? 5) / 10)
  }
  if (layer === 'outlook') {
    return threeStop('#a92835', '#9c794c', '#1f7a46', ((occupation.outlook ?? 4) + 6) / 21)
  }
  if (layer === 'pay') {
    return threeStop('#a92835', '#aa874d', '#1f7a46', ((occupation.pay ?? 25_000) - 25_000) / 125_000)
  }
  return threeStop('#1f7a46', '#a4824c', '#a92835', Math.max(0, educationIndex(occupation.education)) / 5)
}

export function metricLabel(layer: Layer, occupation: Occupation) {
  if (layer === 'exposure') return `${occupation.exposure ?? 'N/A'}/10 AI exposure`
  if (layer === 'outlook') return occupation.outlook == null ? 'No outlook data' : `${formatPercent(occupation.outlook)} outlook`
  if (layer === 'pay') return occupation.pay == null ? 'No pay data' : `${formatPay(occupation.pay)} median pay`
  return occupation.education || 'Education not available'
}

export function exposureExplanation(occupation: Occupation) {
  const score = occupation.exposure ?? 5
  if (score >= 8) {
    return 'Many information-based tasks in this occupation can be accelerated or automated by current AI tools. The role may change substantially, but exposure does not mean elimination.'
  }
  if (score >= 6) {
    return 'AI can assist with a meaningful share of the role, especially research, drafting, analysis, and routine digital work. Human judgment and domain knowledge remain important.'
  }
  if (score >= 4) {
    return 'AI is more likely to support selected tasks than replace the occupation. Its effect will depend on adoption, regulation, and how employers redesign the work.'
  }
  return 'Most core tasks depend on physical presence, direct human interaction, or situational judgment. AI may improve planning and administration without replacing the main work.'
}
