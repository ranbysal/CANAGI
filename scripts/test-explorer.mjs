import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { createRequire, Module } from 'node:module'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

// Exercise the actual TypeScript modules without adding a test-runner dependency.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url), cache = new Map()
function load(relative) {
  const filename = resolve(root, relative)
  if (cache.has(filename)) return cache.get(filename).exports
  const module = new Module(filename)
  cache.set(filename, module)
  module.require = specifier => {
    if (!specifier.startsWith('.')) return require(specifier)
    const path = resolve(dirname(filename), specifier)
    const full = [path, `${path}.ts`, `${path}.tsx`].find(existsSync)
    return load(full)
  }
  module._compile(ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText, filename)
  return module.exports
}
const careers = load('src/lib/careers.ts'), metrics = load('src/lib/metrics.ts'), format = load('src/lib/format.ts')
const { emptyFilters, matchesCareer, rankCareers, parseExplorerState, serializeExplorerState, initialExplorerState, aggregateField, fieldOf, teerOf, outlookOf, PRESETS, FIELD_DEFINITIONS } = careers
const data = JSON.parse(readFileSync(resolve(root, 'public/data/occupations.json'), 'utf8'))
const ids = new Set(data.map(d => d.noc_code))
let passed = 0
function test(name, fn) { fn(); passed++; console.log(`PASS ${name}`) }
const fixture = (patch = {}) => ({ title: 'Alpha', slug: 'alpha', noc_code: '21232', category: 'Test', jobs: 100, pay: 50000, exposure: 3, outlook: 4, outlook_desc: 'Balance', education: 'Legacy label', ...patch })

test('516 valid unique NOC 2021 IDs and stable employment coverage', () => {
  assert.equal(data.length, 516); assert.equal(ids.size, 516)
  assert(data.every(d => /^\d{5}$/.test(d.noc_code) && teerOf(d) && fieldOf(d)))
  assert.equal(data.filter(d => d.jobs != null).length, 485)
  assert.equal(data.reduce((s, d) => s + (d.jobs ?? 0), 0), 20136800)
  assert.equal(data.filter(d => outlookOf(d).id === 'unknown').length, 31)
  assert.equal(data.filter(d => d.pay == null).length, 1)
})
test('exact COPS category coverage, balance is not shortage or percent growth', () => {
  const counts = Object.fromEntries(careers.OUTLOOK_DEFINITIONS.map(o => [o.id, data.filter(d => outlookOf(d).id === o.id).length]))
  assert.deepEqual(counts, { 'strong-surplus': 6, 'moderate-surplus': 11, balance: 365, 'moderate-shortage': 65, 'strong-shortage': 38, unknown: 31 })
  assert.equal(format.metricLabel('outlook', fixture()), 'Balance')
  assert.equal(aggregateField([fixture()]).shortageShare, 0)
})
test('AND between categories and OR within selected categories', () => {
  const f = { ...emptyFilters(), payMin: 50000, payMax: 60000, aiMax: 3, teer: ['1', '2'], fields: ['2', '3'], outlook: ['balance', 'strong-shortage'] }
  assert(matchesCareer(fixture(), f))
  assert(matchesCareer(fixture({ noc_code: '32200' }), f))
  for (const patch of [{ pay: 49999 }, { pay: 60001 }, { exposure: 4 }, { noc_code: '24200' }, { outlook_desc: 'Strong risk of surplus' }]) assert(!matchesCareer(fixture(patch), f))
})
test('inclusive thresholds, unknown is never a numeric match, zero remains zero', () => {
  assert(matchesCareer(fixture(), { ...emptyFilters(), payMin: 50000, payMax: 50000, aiMin: 3, aiMax: 3 }))
  assert(!matchesCareer(fixture({ pay: null }), { ...emptyFilters(), payMin: 0 }))
  assert(!matchesCareer(fixture({ exposure: null }), { ...emptyFilters(), aiMax: 10 }))
  assert(matchesCareer(fixture({ pay: 0, exposure: 0 }), { ...emptyFilters(), payMax: 0, aiMin: 0, aiMax: 0 }))
})
test('title, NOC, common aliases and diacritics search', () => {
  const find = query => data.filter(d => matchesCareer(d, { ...emptyFilters(), query })).map(d => d.noc_code)
  assert(find('software developer').includes('21232'))
  assert.deepEqual(find('21232'), ['21232'])
  assert.deepEqual(find('RN'), ['31301'])
  assert(find('PSW').includes('33102'))
  assert(matchesCareer(fixture({ title: 'Maîtres d’hôtel' }), { ...emptyFilters(), query: 'maitres' }))
  assert(!matchesCareer(fixture({ title: 'Burner' }), { ...emptyFilters(), query: 'RN' }))
})
test('competition ranks, alphabetic ties, unknown last in both directions', () => {
  const rows = [fixture({ title: 'Bravo', noc_code: '21231', pay: 50000 }), fixture({ title: 'Alpha', pay: 50000 }), fixture({ title: 'Charlie', noc_code: '21234', pay: 80000 }), fixture({ title: 'Unknown', noc_code: '31301', pay: null })]
  assert.deepEqual(rankCareers(rows, 'pay-asc').map(r => [r.item.title, r.rank]), [['Alpha', 1], ['Bravo', 1], ['Charlie', 3], ['Unknown', null]])
  assert.deepEqual(rankCareers(rows, 'pay-desc').map(r => [r.item.title, r.rank]), [['Charlie', 1], ['Alpha', 2], ['Bravo', 2], ['Unknown', null]])
  assert(rankCareers(rows, 'name').every(r => r.rank == null))
  assert.equal(rows[0].title, 'Bravo', 'sorting must not mutate input')
})
test('exposure and categorical outlook sorts obey direction and unknown handling', () => {
  const rows = [fixture({ exposure: null, outlook_desc: 'Not assessed' }), fixture({ noc_code: '21231', exposure: 2, outlook_desc: 'Strong risk of shortage' }), fixture({ noc_code: '21234', exposure: 8, outlook_desc: 'Strong risk of surplus' })]
  for (const sort of ['exposure-asc', 'exposure-desc', 'outlook-asc', 'outlook-desc']) assert.equal(rankCareers(rows, sort).at(-1).item.noc_code, '21232')
  assert.equal(rankCareers(rows, 'outlook-desc')[0].item.noc_code, '21231')
  assert.equal(rankCareers(rows, 'outlook-asc')[0].item.noc_code, '21234')
})
test('safe URL round trip retains view, layer, all filters, comparisons and list position', () => {
  const state = { ...initialExplorerState(), query: 'nurse & care', payMin: 50000, payMax: 120000, teer: ['1', '2'], aiMin: 0, aiMax: 6, outlook: ['balance', 'strong-shortage'], fields: ['3'], view: 'list', layer: 'pay', sort: 'pay-desc', compared: ['21232', '31301', '72200'], detail: '31301', page: 2, fieldCompare: ['1', '3', '7'] }
  assert.deepEqual(parseExplorerState(serializeExplorerState(state), ids), state)
})
test('malformed URL parameters are discarded and comparisons capped at three', () => {
  const parsed = parseExplorerState('?view=evil&sort=__proto__&layer=wat&payMin=Infinity&payMax=-1&aiMax=99&teer=0,0,wrong&fields=2,11&compare=21232,21232,31301,72200,11100,99999&career=99999&page=-2&comparison=1', ids)
  assert.equal(parsed.view, 'list'); assert.equal(parsed.sort, 'name'); assert.equal(parsed.layer, 'exposure')
  assert.equal(parsed.payMin, null); assert.equal(parsed.payMax, null); assert.equal(parsed.aiMax, null)
  assert.deepEqual(parsed.teer, ['0']); assert.deepEqual(parsed.fields, ['2'])
  assert.deepEqual(parsed.compared, ['21232', '31301', '72200']); assert.equal(parsed.detail, null); assert.equal(parsed.page, 1)
  assert.equal(parseExplorerState('?compare=21232&comparison=1', ids).comparison, false)
})
test('inverted ranges stay empty rather than silently widening criteria', () => {
  const filters = parseExplorerState('?payMin=100000&payMax=20000')
  assert.equal(data.filter(d => matchesCareer(d, filters)).length, 0)
  assert.equal(data.filter(d => matchesCareer(d, { ...emptyFilters(), query: 'zzzzzznothing' })).length, 0)
})
test('all presets produce nonempty real results through the same filter function', () => {
  for (const p of PRESETS) {
    const found = data.filter(d => matchesCareer(d, { ...emptyFilters(), ...p.filters }))
    assert(found.length > 0 && found.length < data.length)
    console.log(`  ${p.label}: ${found.length} occupations`)
  }
  assert.equal(data.filter(d => matchesCareer(d, { ...emptyFilters(), ...PRESETS[0].filters })).length, 103)
  assert.equal(data.filter(d => matchesCareer(d, emptyFilters())).length, 516)
})
test('TEER 0 is management regardless of the misleading legacy education string', () => {
  assert.equal(teerOf(data.find(d => d.noc_code === '00010')).short, 'Management')
  assert.equal(format.metricLabel('education', data.find(d => d.noc_code === '00010')), 'TEER 0 · Management')
})
test('treemap records are exactly the positive-employment subset of shared matches', () => {
  for (const f of [emptyFilters(), ...PRESETS.map(p => ({ ...emptyFilters(), ...p.filters }))]) {
    const matching = data.filter(d => matchesCareer(d, f)), sized = matching.filter(d => d.jobs != null && d.jobs > 0)
    assert.equal(matching.length, sized.length + matching.filter(d => d.jobs == null || d.jobs <= 0).length)
    assert(sized.every(d => matching.includes(d)))
  }
  const missing = data.find(d => d.jobs == null)
  assert(matchesCareer(missing, { ...emptyFilters(), query: missing.noc_code }))
})
test('field aggregates exclude unavailable pairs and deduplicate NOC records', () => {
  const a = fixture({ jobs: 100, pay: 40000, exposure: 2, outlook_desc: 'Strong risk of shortage' })
  const b = fixture({ noc_code: '21231', jobs: 300, pay: 80000, exposure: 6 })
  const c = fixture({ noc_code: '21234', jobs: null, pay: null, exposure: 10, outlook_desc: 'Not assessed' })
  const f = aggregateField([a, b, c, a])
  assert.equal(f.count, 3); assert.equal(f.jobs, 400); assert.equal(f.employmentCount, 2)
  assert.equal(f.payMedian, 60000); assert.equal(f.payCount, 2)
  assert.equal(f.exposureMean, 5); assert.equal(f.exposureJobs, 400)
  assert.equal(f.shortageShare, .25); assert.equal(f.assessedJobs, 400)
  assert.equal(f.education.reduce((s, t) => s + t.count, 0), 3)
  assert.equal(f.exposureBands.reduce((s, t) => s + t.jobs, 0), 400)
})
test('field quartiles use linear interpolation over equally weighted occupation estimates', () => {
  const f = aggregateField([0, 10, 20, 30].map((pay, i) => fixture({ pay, noc_code: `2123${i}`, jobs: (i + 1) * 1000 })))
  assert.equal(f.payQ1, 7.5); assert.equal(f.payMedian, 15); assert.equal(f.payQ3, 22.5)
})
test('empty and zero-employment aggregates distinguish missing from zero', () => {
  const empty = aggregateField([]), unknown = aggregateField([fixture({ jobs: null, pay: null, exposure: null, outlook_desc: 'Not assessed' })]), zero = aggregateField([fixture({ jobs: 0, pay: 0, exposure: 0 })])
  assert.equal(empty.jobs, null); assert.equal(unknown.payMedian, null); assert.equal(unknown.exposureMean, null)
  assert.equal(zero.jobs, 0); assert.equal(zero.payMedian, 0); assert.equal(zero.exposureMean, null); assert.equal(zero.shortageShare, null)
  assert.equal(metrics.getMetricCards('exposure', [fixture({ jobs: 0 })])[0].value, '0')
  assert(metrics.getMetricCards('exposure', []).every(c => !JSON.stringify(c).includes('NaN')))
})
test('full-field totals partition the dataset without double counting', () => {
  const fields = FIELD_DEFINITIONS.map(([id]) => aggregateField(data.filter(d => fieldOf(d)?.[0] === id)))
  assert.equal(fields.reduce((s, f) => s + f.count, 0), 516)
  assert.equal(fields.reduce((s, f) => s + (f.jobs ?? 0), 0), 20136800)
  assert(fields.every(f => f.exposureBands.reduce((s, b) => s + b.jobs, 0) === f.exposureJobs))
})
test('every summary layer handles filtered and empty data without fake numeric outlook averages', () => {
  for (const layer of ['pay', 'outlook', 'education', 'exposure']) for (const rows of [[], data, data.slice(0, 1)]) {
    const cards = metrics.getMetricCards(layer, rows)
    assert.equal(cards.length, 7)
    assert(!JSON.stringify(cards).match(/NaN|Infinity|Avg\. outlook|Total wages|Wages exposed|University\+/))
  }
})
const { createScrollCharge } = load('src/lib/scrollCharge.ts')
const { pageFromLocation, pageAddress } = load('src/lib/contentPages.ts')
test('explicit page addresses retain filters without changing the selected screen', () => {
  const search = '?q=nurse&view=list&compare=21232,31301&payMin=50000'
  assert.equal(pageFromLocation('#visualizer', search), 'overview')
  assert.equal(pageFromLocation('#careers', search), 'careers')
  assert.equal(pageFromLocation('#careers/fields', search), 'fields')
  assert.equal(pageFromLocation('#top', search), 'home')
  assert.equal(pageAddress('fields', '/', search), `/${search}#careers/fields`)
  assert.equal(parseExplorerState(search, ids).query, 'nurse')
})
test('legacy explorer links resolve to their new page without invalid view state', () => {
  assert.equal(pageFromLocation('#explore', ''), 'overview')
  assert.equal(pageFromLocation('#explore', '?q=nurse&view=list'), 'careers')
  assert.equal(pageFromLocation('#explore', '?view=fields'), 'fields')
  assert.equal(parseExplorerState('?view=fields').view, 'list')
  assert.equal(pageFromLocation('#methodology', ''), 'overview')
  assert.equal(pageFromLocation('#not-a-page', ''), 'home')
})
test('approved entry still takes three wheel steps, with upward discharge', () => {
  const charge = createScrollCharge()
  assert.equal(charge.wheel(120, 0, 0), 1 / 3); assert.equal(charge.wheel(120, 0, 220), 2 / 3)
  assert.equal(charge.wheel(-120, 0, 440), 1 / 3); assert.equal(charge.wheel(120, 0, 660), 2 / 3); assert.equal(charge.wheel(120, 0, 880), 1)
  const smooth = createScrollCharge()
  for (let i = 0; i < 20; i++) smooth.wheel(12.5, 0, i * 10)
  assert.equal(smooth.wheel(12.5, 0, 201), 1 / 3, 'one smooth gesture cannot fill all three steps')
})
const { createEntrySequence, EXIT_DURATION_MS, ENTER_DURATION_MS, HOME_DURATION_MS } = load('src/lib/entrySequence.ts')
test('approved entry is timed, nonoverlapping, reversible and reduced-motion aware', () => {
  const tasks = [], scenes = []
  const clock = { set: (fn, delay) => { tasks.push({ fn, delay }); return tasks.length }, clear: () => {} }
  const seq = createEntrySequence(s => scenes.push(s), 'intro', clock)
  assert(seq.start()); assert(!seq.start()); assert.equal(tasks[0].delay, EXIT_DURATION_MS)
  tasks.shift().fn(); assert.equal(tasks[0].delay, ENTER_DURATION_MS); tasks.shift().fn()
  assert.deepEqual(scenes, ['leaving', 'entering', 'explorer'])
  assert(seq.home()); tasks.shift().fn(); assert.equal(tasks[0].delay, HOME_DURATION_MS); tasks.shift().fn()
  assert.equal(scenes.at(-1), 'intro')
  assert(seq.start(true)); assert.equal(scenes.at(-1), 'explorer')
  assert(seq.home(true)); assert.equal(scenes.at(-1), 'intro'); assert.equal(tasks.length, 0)
})
test('published wages preserve native units, periods and annualization', () => {
  assert(ids.has('00013'))
  assert.equal(data.find(d => d.noc_code === '00013').pay, null)
  for (const d of data) {
    assert(d.wage.source && d.wage.reference)
    assert.equal(d.pay, d.wage.median == null ? null : Math.round(d.wage.median * (d.wage.unit === 'hour' ? 2080 : 1)))
    assert.equal(d.employment_reference, '2023')
  }
  assert.equal(data.find(d => d.noc_code === '21232').wage.median, 48.08)
  assert.equal(data.find(d => d.noc_code === '31301').wage.median, 43.27)
})
test('every occupation has reproducible activity evidence and valid sensitivity ranges', () => {
  let profileCount = 0
  for (const d of data) {
    const evidence = JSON.parse(readFileSync(resolve(root, `public/data/evidence/${d.noc_code}.json`), 'utf8'))
    assert.equal(evidence.noc, d.noc_code)
    assert(evidence.description.length && evidence.duties.length)
    assert.equal(evidence.ai.activities.length, 39)
    assert.equal(evidence.ai.score, d.exposure)
    assert.equal(evidence.ai.profiles.length, d.ai.profiles)
    assert(d.ai.range[0] <= d.exposure && d.ai.range[1] >= d.exposure)
    assert(d.exposure >= 0 && d.exposure <= 10 && d.ai.range[0] >= 0 && d.ai.range[1] <= 10)
    assert(d.ai.explanation && evidence.ai.drivers.length && evidence.ai.constraints.length)
    const profileScores = evidence.ai.profiles.map(p => {
      profileCount++
      assert.equal(Object.keys(p.levels).length, 39)
      assert(Object.values(p.levels).every(v => v >= 0 && v <= 5))
      const numerator = evidence.ai.activities.reduce((s, a) => s + p.levels[a.name] * a.capability, 0)
      const denominator = Object.values(p.levels).reduce((s, x) => s + x, 0)
      const score = 10 * numerator / denominator
      assert(Math.abs(score - p.rawScore) < 1e-10)
      return score
    })
    assert(Math.abs(profileScores.reduce((s, x) => s + x, 0) / profileScores.length - evidence.ai.rawScore) < .000001)
  }
  assert.equal(profileCount, 900)
  const bins = aggregateField(data).exposureBands
  assert.equal(bins.reduce((s, b) => s + b.jobs, 0), 20136800, 'decimal scores must not fall between bins')
})
const { placeTooltip } = load('src/lib/tooltipPlacement.ts')
test('tooltip stays in the viewport and clear of tiles at all four corners', () => {
  const viewport = { width: 1440, height: 900 }, panel = { width: 352, height: 350 }
  for (const [left, top] of [[15, 15], [1340, 15], [15, 800], [1340, 800], [650, 500]]) {
    const tile = { left, top, width: 70, height: 70 }
    const cursor = { x: left + 35, y: top + 35 }
    const box = { ...placeTooltip(cursor, tile, panel, viewport), ...panel }
    assert(box.left >= 12 && box.top >= 12)
    assert(box.left + box.width <= viewport.width - 12 && box.top + box.height <= viewport.height - 12)
    const overlaps = box.left < tile.left + tile.width && box.left + box.width > tile.left && box.top < tile.top + tile.height && box.top + box.height > tile.top
    assert(!overlaps, `Tooltip obscures a corner tile at ${left}, ${top}`)
  }
})
const { createSurfaceTransition } = load('src/lib/useSurfaceTransition.ts')
test('page and list/map swaps wait for exit, commit once, and support cancel and reduced motion', () => {
  const tasks = new Map(), phases = [], commits = []
  let id = 0
  const clock = { set: (fn, delay) => { tasks.set(++id, { fn, delay }); return id }, clear: key => tasks.delete(key) }
  const next = () => { const [key, task] = tasks.entries().next().value; tasks.delete(key); task.fn(); return task.delay }
  const transition = createSurfaceTransition(p => phases.push(p), clock)
  assert(transition.run(() => commits.push('list')))
  assert(!transition.run(() => commits.push('duplicate')))
  assert.deepEqual(commits, [])
  assert.equal(next(), EXIT_DURATION_MS)
  assert.deepEqual(commits, ['list']); assert.equal(phases.at(-1), 'in')
  assert.equal(next(), ENTER_DURATION_MS); assert.equal(phases.at(-1), 'idle')
  transition.run(() => commits.push('canceled')); transition.cancel(); assert.equal(tasks.size, 0)
  transition.run(() => commits.push('reduced'), true); assert.deepEqual(commits, ['list', 'reduced'])
  transition.run(() => commits.push('escape')); transition.finish(); assert.equal(commits.at(-1), 'escape'); assert.equal(tasks.size, 0)
  transition.run(() => commits.push('unmounted')); transition.dispose(); assert.equal(tasks.size, 0)
})
test('both maps use the approved palette and contrasting tile text', () => {
  const palette = new Set([...format.MAP_PALETTE, format.UNKNOWN_COLOR])
  assert.equal(format.paletteColor(0), format.MAP_PALETTE[0])
  assert.equal(format.paletteColor(1), format.MAP_PALETTE.at(-1))
  assert.notEqual(format.paletteColor(.1), format.paletteColor(.11))
  for (const layer of ['exposure', 'pay', 'education', 'outlook']) for (const item of data) palette.add(format.layerColor(layer, item))
  for (const hex of palette) {
    const channel = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4)
    const lum = .2126 * channel[0] + .7152 * channel[1] + .0722 * channel[2]
    const contrast = format.tileTextColor(hex) === '#ffffff' ? 1.05 / (lum + .05) : (lum + .05) / .05
    assert(contrast >= 4.5, `Insufficient text contrast on ${hex}`)
  }
})
console.log(`\n${passed} tests passed. No network or AI service calls.`)
