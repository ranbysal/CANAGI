import type { Layer, Occupation } from '../types'

export const SOURCES = {
  noc: 'https://www.statcan.gc.ca/en/subjects/standard/noc/2021/introductionV1',
  cops: 'https://occupations.esdc.gc.ca/sppc-cops/l.3bd.2t.1.3lshtml@-eng.jsp?fid=54&lid=69',
  profiles: 'https://www.jobbank.gc.ca/career-planning/search-job-profile',
  training: 'https://www.canada.ca/en/services/jobs/training.html',
  wages: 'https://open.canada.ca/data/en/dataset/adad580f-76b0-4502-bd05-20c125de9116',
  oasis: 'https://open.canada.ca/data/en/dataset/10ce43bd-fb58-4969-806b-4bffebc87bec',
  aiResearch: 'https://www150.statcan.gc.ca/n1/pub/11f0019m/11f0019m2024005-eng.htm',
  ilo: 'https://www.ilo.org/publications/generative-ai-and-jobs-refined-global-index-occupational-exposure',
  employment: 'https://occupations.esdc.gc.ca/sppc-cops/content.jsp?cid=occupationdatasearch&lang=en',
}
export const PAY_NOTE = 'Job Bank national wages, released November 19, 2025. Hourly medians are multiplied by 40 hours × 52 weeks (2,080 hours) for an annual comparison. Published annual figures stay annual. This is a full time equivalent, not observed annual earnings, starting pay or a guarantee. Original units, source and reference periods appear in each profile.'
export const EXPOSURE_NOTE = 'CANAGI’s experimental relative exposure index, based on 39 OaSIS work activity ratings. Scores rank the 516 NOC occupations from lower (0) to higher (10) modeled exposure to software based generative AI. A score of 8 means roughly the 80th percentile in this model, not 80% of tasks or jobs replaced. The capability rubric is our assumption, not a government rating. Human oversight is shown separately.'
export const FIELD_DEFINITIONS = [
  ['0', 'Senior management', 'Legislative and senior management occupations'],
  ['1', 'Business & finance', 'Business, finance and administration occupations'],
  ['2', 'Science & technology', 'Natural and applied sciences and related occupations'],
  ['3', 'Health', 'Health occupations'],
  ['4', 'Education, law & community', 'Occupations in education, law and social, community and government services'],
  ['5', 'Arts, culture & sport', 'Occupations in art, culture, recreation and sport'],
  ['6', 'Sales & service', 'Sales and service occupations'],
  ['7', 'Trades & transport', 'Trades, transport and equipment operators and related occupations'],
  ['8', 'Natural resources & agriculture', 'Natural resources, agriculture and related production occupations'],
  ['9', 'Manufacturing & utilities', 'Occupations in manufacturing and utilities'],
] as const
export const TEER_DEFINITIONS = [
  { id: '0', short: 'Management', label: 'Management responsibilities', description: 'TEER 0 groups management occupations. Education and experience requirements vary by occupation; a university degree is not implied.' },
  { id: '1', short: 'University / expertise', label: 'University or related expertise', description: 'TEER 1 usually involves a university degree. Relevant experience and subject expertise from a TEER 2 occupation may be an alternative in some cases.' },
  { id: '2', short: 'College / apprenticeship / supervision', label: 'College, apprenticeship or supervisory pathway', description: 'TEER 2 includes college study of two to three years, apprenticeship of two to five years, supervisory or significant safety responsibilities, or relevant experience. These are alternative pathways, not a universal school duration.' },
  { id: '3', short: 'College / apprenticeship / work training', label: 'Shorter college, apprenticeship or work training', description: 'TEER 3 includes college or apprenticeship of less than two years, more than six months of work training or specific experience with some secondary schooling, or progression from a related occupation.' },
  { id: '4', short: 'Secondary / work training', label: 'Secondary school or work training', description: 'TEER 4 usually involves secondary school, several weeks of work training with some secondary schooling, or experience in a related occupation.' },
  { id: '5', short: 'Short work demonstration', label: 'Short work demonstration; no formal education', description: 'TEER 5 generally involves a short work demonstration without a formal education requirement. Specific employers and regulated work may have additional requirements.' },
] as const
export const OUTLOOK_DEFINITIONS = [
  { id: 'strong-surplus', label: 'Strong risk of surplus', value: -6, color: '#a92c37' },
  { id: 'moderate-surplus', label: 'Moderate risk of surplus', value: -2, color: '#ba7552' },
  { id: 'balance', label: 'Balance', value: 4, color: '#9a884d' },
  { id: 'moderate-shortage', label: 'Moderate risk of shortage', value: 7, color: '#6f954e' },
  { id: 'strong-shortage', label: 'Strong risk of shortage', value: 15, color: '#267b49' },
  { id: 'unknown', label: 'Not assessed', value: null, color: '#817d89' },
] as const
export function fieldOf(item: Occupation) { return FIELD_DEFINITIONS.find(([id]) => id === item.noc_code[0]) }
export function teerOf(item: Occupation) { return TEER_DEFINITIONS.find(({ id }) => id === item.noc_code[1]) }
export function outlookOf(item: Occupation) {
  return OUTLOOK_DEFINITIONS.find(({ label }) => label.toLowerCase() === item.outlook_desc.toLowerCase()) ?? OUTLOOK_DEFINITIONS[5]
}
export function nocUrl(code: string) { return `https://noc.esdc.gc.ca/Structure/NOCProfile?GocTemplateCulture=en-CA&code=${code}&version=2021.0` }
export function annualPay(value: number | null) { return value == null ? 'Not available' : new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(value) }
export function exposureValue(value: number | null) { return value == null ? 'Not available' : `${value}/10` }
export function publishedWage(item: Occupation) { return item.wage?.median == null ? 'Not available' : `${new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: item.wage.unit === 'hour' ? 2 : 0 }).format(item.wage.median)} / ${item.wage.unit === 'hour' ? 'hour' : 'year'}` }
export function employmentValue(value: number | null) { return value == null ? 'Not available' : value.toLocaleString('en-CA') }
export const isKnown = (value: number | null): value is number => value != null && Number.isFinite(value)

// Reviewed search synonyms. These are search aids, not occupation qualifications.
export const ALIASES: Record<string, string[]> = {
  '21232': ['software developer', 'programmer', 'software programmer', 'application developer', 'coding'],
  '21231': ['software engineer', 'software architect'],
  '21234': ['web developer', 'front end developer', 'frontend developer', 'full stack web developer'],
  '21211': ['data scientist', 'data science'],
  '21220': ['cybersecurity', 'cyber security', 'information security'],
  '21223': ['database analyst', 'database administrator', 'DBA'],
  '22221': ['IT support', 'help desk', 'technical support', 'computer support'],
  '31301': ['registered nurse', 'RN', 'psychiatric nurse'],
  '32101': ['licensed practical nurse', 'LPN', 'registered practical nurse', 'RPN'],
  '33102': ['nurse aide', 'personal support worker', 'PSW'],
  '11100': ['accountant', 'auditor', 'CPA'],
  '11102': ['financial advisor', 'financial planner'],
  '41220': ['high school teacher', 'secondary teacher'],
  '41221': ['elementary teacher', 'kindergarten teacher'],
  '42202': ['early childhood educator', 'ECE', 'daycare educator'],
  '72200': ['electrician'], '72300': ['plumber'], '72310': ['carpenter'],
  '73300': ['truck driver', 'long haul driver'], '62200': ['chef'], '63200': ['cook'],
  '13110': ['administrative assistant', 'office assistant'],
}

export interface CareerFilters { query: string; payMin: number | null; payMax: number | null; teer: string[]; aiMin: number | null; aiMax: number | null; outlook: string[]; fields: string[] }
export type CareerView = 'treemap' | 'list'
export const SORTS = {
  name: 'Occupation name, A to Z', 'pay-desc': 'Annualized pay, highest first', 'pay-asc': 'Annualized pay, lowest first',
  'exposure-asc': 'AI exposure, lowest first', 'exposure-desc': 'AI exposure, highest first', 'outlook-desc': 'Outlook, shortage first', 'outlook-asc': 'Outlook, surplus first',
} as const
export type CareerSort = keyof typeof SORTS
export interface ExplorerState extends CareerFilters { view: CareerView; layer: Layer; sort: CareerSort; compared: string[]; detail: string | null; comparison: boolean; fieldCompare: string[]; page: number }
export const emptyFilters = (): CareerFilters => ({ query: '', payMin: null, payMax: null, teer: [], aiMin: null, aiMax: null, outlook: [], fields: [] })
export const initialExplorerState = (): ExplorerState => ({ ...emptyFilters(), view: 'list', layer: 'exposure', sort: 'name', compared: [], detail: null, comparison: false, fieldCompare: ['2', '3'], page: 1 })
export const normalizeSearch = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
export function matchesCareer(item: Occupation, filters: CareerFilters) {
  const words = normalizeSearch(filters.query).split(/\s+/).filter(Boolean)
  const haystack = normalizeSearch([item.title, item.noc_code, ...(ALIASES[item.noc_code] ?? [])].join(' '))
  return words.every(word => word.length <= 3 && !/^\d+$/.test(word) ? haystack.split(' ').includes(word) : haystack.includes(word))
    && (filters.payMin == null || (isKnown(item.pay) && item.pay >= filters.payMin))
    && (filters.payMax == null || (isKnown(item.pay) && item.pay <= filters.payMax))
    && (filters.aiMin == null || (isKnown(item.exposure) && item.exposure >= filters.aiMin))
    && (filters.aiMax == null || (isKnown(item.exposure) && item.exposure <= filters.aiMax))
    && (!filters.teer.length || filters.teer.includes(teerOf(item)?.id ?? 'unknown'))
    && (!filters.outlook.length || filters.outlook.includes(outlookOf(item).id))
    && (!filters.fields.length || filters.fields.includes(fieldOf(item)?.[0] ?? 'unknown'))
}
const alphabetic = (a: Occupation, b: Occupation) => a.title.localeCompare(b.title, 'en-CA') || a.noc_code.localeCompare(b.noc_code)
export function sortValue(item: Occupation, sort: CareerSort): number | null {
  return sort.startsWith('pay') ? item.pay : sort.startsWith('exposure') ? item.exposure : sort.startsWith('outlook') ? outlookOf(item).value : null
}
export function rankCareers(data: Occupation[], sort: CareerSort) {
  const sorted = [...data].sort((a, b) => {
    if (sort === 'name') return alphabetic(a, b)
    const av = sortValue(a, sort), bv = sortValue(b, sort)
    if (!isKnown(av)) return !isKnown(bv) ? alphabetic(a, b) : 1
    if (!isKnown(bv)) return -1
    return (av - bv) * (sort.endsWith('desc') ? -1 : 1) || alphabetic(a, b)
  })
  let rank = 0
  return sorted.map((item, index) => {
    const value = sortValue(item, sort)
    if (index === 0 || value !== sortValue(sorted[index - 1], sort)) rank = index + 1
    return { item, rank: sort === 'name' || !isKnown(value) ? null : rank }
  })
}
export const PRESETS = [
  { label: 'Projected shortages', note: 'Moderate or strong risk, 2024 to 2033', filters: { outlook: ['moderate-shortage', 'strong-shortage'] } },
  { label: 'Lower AI exposure', note: 'Relative exposure index of 0 to 3 / 10', filters: { aiMin: 0, aiMax: 3 } },
  { label: '$50K to $80K annualized', note: 'Job Bank medians, annualized at 2,080 hours when hourly', filters: { payMin: 50000, payMax: 80000 } },
  { label: 'Secondary / work training', note: 'TEER 4 or 5; check each occupation’s requirements', filters: { teer: ['4', '5'] } },
] satisfies Array<{ label: string; note: string; filters: Partial<CareerFilters> }>

const PARAMS = ['q', 'payMin', 'payMax', 'teer', 'aiMin', 'aiMax', 'outlook', 'fields', 'view', 'layer', 'sort', 'compare', 'career', 'comparison', 'fieldCompare', 'page']
export const hasExplorerParams = (search: string) => PARAMS.some(key => new URLSearchParams(search).has(key))
export function parseExplorerState(search: string, validIds?: Set<string>): ExplorerState {
  const p = new URLSearchParams(search), state = initialExplorerState()
  const list = (key: string, allowed: readonly string[], limit = 10) => [...new Set((p.get(key) ?? '').split(','))].filter(id => allowed.includes(id)).slice(0, limit)
  const number = (key: string, max: number) => { const raw = p.get(key); if (raw == null || raw.trim() === '') return null; const v = Number(raw); return Number.isFinite(v) && v >= 0 && v <= max ? v : null }
  const ids = (key: string) => [...new Set((p.get(key) ?? '').split(','))].filter(id => /^\d{5}$/.test(id) && (!validIds || validIds.has(id))).slice(0, 3)
  state.query = (p.get('q') ?? '').slice(0, 120)
  state.payMin = number('payMin', 1000000); state.payMax = number('payMax', 1000000)
  state.aiMin = number('aiMin', 10); state.aiMax = number('aiMax', 10)
  state.teer = list('teer', TEER_DEFINITIONS.map(t => t.id)); state.fields = list('fields', FIELD_DEFINITIONS.map(f => f[0]))
  state.outlook = list('outlook', OUTLOOK_DEFINITIONS.map(o => o.id))
  if (['treemap', 'list'].includes(p.get('view') ?? '')) state.view = p.get('view') as CareerView
  if (['pay', 'outlook', 'education', 'exposure'].includes(p.get('layer') ?? '')) state.layer = p.get('layer') as Layer
  if (Object.hasOwn(SORTS, p.get('sort') ?? '')) state.sort = p.get('sort') as CareerSort
  state.compared = ids('compare'); state.detail = ids('career')[0] ?? null
  state.comparison = p.get('comparison') === '1' && state.compared.length >= 2
  state.fieldCompare = p.has('fieldCompare') ? list('fieldCompare', FIELD_DEFINITIONS.map(f => f[0]), 3) : state.fieldCompare
  state.page = Math.max(1, Math.floor(number('page', 1000) ?? 1))
  return state
}
export function serializeExplorerState(state: ExplorerState) {
  const p = new URLSearchParams()
  if (state.query) p.set('q', state.query)
  for (const key of ['payMin', 'payMax', 'aiMin', 'aiMax'] as const) if (state[key] != null) p.set(key, String(state[key]))
  for (const key of ['teer', 'outlook', 'fields'] as const) if (state[key].length) p.set(key, state[key].join(','))
  if (state.view !== 'list') p.set('view', state.view)
  if (state.layer !== 'exposure') p.set('layer', state.layer)
  if (state.sort !== 'name') p.set('sort', state.sort)
  if (state.compared.length) p.set('compare', state.compared.join(','))
  if (state.detail) p.set('career', state.detail)
  if (state.comparison) p.set('comparison', '1')
  if (state.fieldCompare.join(',') !== '2,3') p.set('fieldCompare', state.fieldCompare.join(','))
  if (state.page > 1) p.set('page', String(state.page))
  return p.toString()
}
export function uniqueCareers(data: Occupation[]) { return [...new Map(data.map(item => [item.noc_code, item])).values()] }
export function aggregateField(records: Occupation[]) {
  const data = uniqueCareers(records)
  const employed = data.filter(x => isKnown(x.jobs) && x.jobs >= 0)
  const jobs = employed.reduce((s, x) => s + x.jobs!, 0)
  const pays = data.map(x => x.pay).filter(isKnown).sort((a, b) => a - b)
  const quantile = (q: number) => { if (!pays.length) return null; const pos = (pays.length - 1) * q, lo = Math.floor(pos); return pays[lo] + (pays[Math.ceil(pos)] - pays[lo]) * (pos - lo) }
  const exposed = employed.filter(x => isKnown(x.exposure))
  const exposureJobs = exposed.reduce((s, x) => s + x.jobs!, 0)
  const assessed = employed.filter(x => outlookOf(x).id !== 'unknown')
  const assessedJobs = assessed.reduce((s, x) => s + x.jobs!, 0)
  const shortageJobs = assessed.filter(x => outlookOf(x).id.endsWith('-shortage')).reduce((s, x) => s + x.jobs!, 0)
  return { count: data.length, employmentCount: employed.length, jobs: employed.length ? jobs : null,
    payCount: pays.length, payMin: pays[0] ?? null, payQ1: quantile(.25), payMedian: quantile(.5), payQ3: quantile(.75), payMax: pays.at(-1) ?? null,
    education: TEER_DEFINITIONS.map(t => ({ ...t, count: data.filter(x => teerOf(x)?.id === t.id).length })),
    exposureCount: exposed.length, exposureJobs, exposureMean: exposureJobs ? exposed.reduce((s, x) => s + x.jobs! * x.exposure!, 0) / exposureJobs : null,
    exposureBands: [{ label: 'Lower · 0 to <4', min: 0, max: 4 }, { label: 'Middle · 4 to <7', min: 4, max: 7 }, { label: 'Higher · 7 to 10', min: 7, max: 11 }].map(b => ({ ...b, jobs: exposed.filter(x => x.exposure! >= b.min && x.exposure! < b.max).reduce((s, x) => s + x.jobs!, 0) })),
    assessedJobs, assessedCount: assessed.length, shortageJobs, shortageShare: assessedJobs ? shortageJobs / assessedJobs : null }
}
