import type { Layer, Occupation } from '../types'
import { EXPOSURE_NOTE, outlookOf, teerOf } from './careers'

// Continuous teal-to-rose scale using the supplied mint and pink shades.
export const MAP_PALETTE = ['#04cbb8', '#acf3e4', '#fddde3', '#fdb6c5', '#e3066a']
export const PAY_COLORS = [...MAP_PALETTE].reverse()
export const TEER_COLORS = ['#e3066a', '#fe7298', '#fdb6c5', '#fddde3', '#acf3e4', '#04cbb8']
export const OUTLOOK_COLORS = [MAP_PALETTE[4], MAP_PALETTE[3], MAP_PALETTE[2], MAP_PALETTE[1], MAP_PALETTE[0]]
export const UNKNOWN_COLOR = '#c4c1c8'
export const PAY_TIERS = [
  { label: '<$35K', min: 0, max: 35000 }, { label: '$35 to 50K', min: 35000, max: 50000 },
  { label: '$50 to 75K', min: 50000, max: 75000 }, { label: '$75 to 100K', min: 75000, max: 100000 },
  { label: '$100K+', min: 100000, max: Infinity },
]
export const EXPOSURE_TIERS = [
  { label: '0 to <2', min: 0, max: 2 }, { label: '2 to <4', min: 2, max: 4 },
  { label: '4 to <6', min: 4, max: 6 }, { label: '6 to <8', min: 6, max: 8 }, { label: '8 to 10', min: 8, max: 11 },
]
export const LAYER_LABELS: Record<Layer, string> = { outlook: 'COPS Outlook', pay: 'Annualized Pay', education: 'Pathways (TEER)', exposure: 'AI Exposure Index' }
export function formatCompact(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(/\.0$/, '')}M`
  if (value >= 1000) return `${Math.round(value / 1000)}K`
  return Math.round(value).toLocaleString('en-CA')
}
export function formatPay(value: number) { return `$${Math.round(value / 1000)}K` }
export function paletteColor(amount: number) {
  const position = Math.max(0, Math.min(1, amount)) * (MAP_PALETTE.length - 1)
  const index = Math.min(MAP_PALETTE.length - 2, Math.floor(position))
  const fraction = position - index
  return '#' + [1, 3, 5].map(offset => {
    const start = parseInt(MAP_PALETTE[index].slice(offset, offset + 2), 16)
    const end = parseInt(MAP_PALETTE[index + 1].slice(offset, offset + 2), 16)
    return Math.round(start + (end - start) * fraction).toString(16).padStart(2, '0')
  }).join('')
}
export function outlookColor(item: Occupation) {
  const index = ['strong-surplus', 'moderate-surplus', 'balance', 'moderate-shortage', 'strong-shortage'].indexOf(outlookOf(item).id)
  return OUTLOOK_COLORS[index] ?? UNKNOWN_COLOR
}
export function tileTextColor(hex: string) {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4)
  const luminance = .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]
  return (luminance + .05) / .05 >= 1.05 / (luminance + .05) ? '#000000' : '#ffffff'
}
export function layerColor(layer: Layer, item: Occupation) {
  if (layer === 'education') return TEER_COLORS[Number(teerOf(item)?.id)] ?? UNKNOWN_COLOR
  if (layer === 'outlook') return outlookColor(item)
  if (layer === 'exposure') return item.exposure == null ? UNKNOWN_COLOR : paletteColor(item.exposure / 10)
  return item.pay == null ? UNKNOWN_COLOR : paletteColor(1 - (item.pay - 25000) / 125000)
}
export function metricLabel(layer: Layer, item: Occupation) {
  if (layer === 'exposure') return item.exposure == null ? 'Exposure not available' : `${item.exposure}/10 relative exposure`
  if (layer === 'outlook') return outlookOf(item).label
  if (layer === 'pay') return item.pay == null ? 'Pay not available' : `${formatPay(item.pay)} CAD annualized`
  const teer = teerOf(item)
  return teer ? `TEER ${teer.id} · ${teer.short}` : 'Pathway not available'
}
export function exposureExplanation(item: Occupation) { return item.ai?.explanation ?? EXPOSURE_NOTE }
