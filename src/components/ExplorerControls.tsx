import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown, List, Search, SlidersHorizontal, SquareChartGantt, X } from 'lucide-react'
import { emptyFilters, FIELD_DEFINITIONS, OUTLOOK_DEFINITIONS, PRESETS, TEER_DEFINITIONS, type CareerFilters, type ExplorerState } from '../lib/careers'

interface Props { state: ExplorerState; onChange: (patch: Partial<ExplorerState>) => void; count: number; total: number; onMethodology: () => void }
export function FilterMenu({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null)
  useEffect(() => {
    const dismissOutside = (event: Event) => {
      if (ref.current?.open && event.target instanceof Node && !ref.current.contains(event.target)) ref.current.open = false
    }
    document.addEventListener('pointerdown', dismissOutside)
    document.addEventListener('focusin', dismissOutside)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside)
      document.removeEventListener('focusin', dismissOutside)
    }
  }, [])
  return <details ref={ref} className="filter-menu" name="career-filter" onKeyDown={e => { if (e.key === 'Escape') { e.currentTarget.open = false; e.currentTarget.querySelector('summary')?.focus() } }}>
    <summary>{title}{count > 0 && <span className="filter-number">{count}</span>}<ChevronDown size={14} aria-hidden="true" /></summary>
    <div className="filter-popover">{children}</div>
  </details>
}
export function activeFilterChips(state: CareerFilters): { label: string; patch: Partial<CareerFilters> }[] {
  const chips: { label: string; patch: Partial<CareerFilters> }[] = []
  if (state.query) chips.push({ label: `Search: ${state.query}`, patch: { query: '' } })
  for (const key of ['payMin', 'payMax', 'aiMin', 'aiMax'] as const) if (state[key] != null) {
    const label = key.startsWith('pay') ? `Pay ${key === 'payMin' ? '≥' : '≤'} $${state[key]?.toLocaleString('en-CA')}/yr est.` : `AI ${key === 'aiMin' ? '≥' : '≤'} ${state[key]}/10`
    chips.push({ label, patch: { [key]: null } })
  }
  for (const id of state.teer) chips.push({ label: `TEER ${id}`, patch: { teer: state.teer.filter(x => x !== id) } })
  for (const id of state.outlook) chips.push({ label: OUTLOOK_DEFINITIONS.find(x => x.id === id)?.label ?? id, patch: { outlook: state.outlook.filter(x => x !== id) } })
  for (const id of state.fields) chips.push({ label: FIELD_DEFINITIONS.find(x => x[0] === id)?.[1] ?? id, patch: { fields: state.fields.filter(x => x !== id) } })
  return chips
}
export function ExplorerControls({ state, onChange, count, total, onMethodology }: Props) {
  const [expanded, setExpanded] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!expanded) return
    const dismissOutside = (event: Event) => {
      if (event.target instanceof Node && !panelRef.current?.contains(event.target) && !toggleRef.current?.contains(event.target)) setExpanded(false)
    }
    document.addEventListener('pointerdown', dismissOutside)
    document.addEventListener('focusin', dismissOutside)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside)
      document.removeEventListener('focusin', dismissOutside)
    }
  }, [expanded])
  const chips = activeFilterChips(state)
  const filter = (patch: Partial<CareerFilters>) => onChange({ ...patch, page: 1 })
  const toggle = (key: 'teer' | 'outlook' | 'fields', id: string) => filter({ [key]: state[key].includes(id) ? state[key].filter(x => x !== id) : [...state[key], id] })
  const number = (key: 'payMin' | 'payMax' | 'aiMin' | 'aiMax', value: string) => filter({ [key]: value === '' ? null : Math.max(0, Math.min(key.startsWith('ai') ? 10 : 1000000, Number(value))) })
  return <div className="explorer-controls" id="career-controls">
      <div className="search-view-row">
        <label className="career-search"><Search size={19} aria-hidden="true" /><span className="sr-only">Search occupations, NOC codes or common titles</span><input type="search" value={state.query} onChange={e => filter({ query: e.target.value.slice(0, 120) })} placeholder="Search a career or NOC" maxLength={120} />{state.query && <button type="button" aria-label="Clear search" onClick={() => filter({ query: '' })}><X size={16} /></button>}</label>
        <div className="view-toggle" role="group" aria-label="Explorer view"><button type="button" aria-pressed={state.view === 'treemap'} onClick={() => onChange({ view: 'treemap' })}><SquareChartGantt size={16} />Treemap</button><button type="button" aria-pressed={state.view === 'list'} onClick={() => onChange({ view: 'list' })}><List size={17} />List</button></div>
        <button ref={toggleRef} type="button" className="mobile-filter-toggle" aria-expanded={expanded} aria-controls="filter-panel" onClick={() => setExpanded(!expanded)}><SlidersHorizontal size={16} />Filters{chips.length > 0 && <span>{chips.length}</span>}</button>
      </div>
      <div ref={panelRef} id="filter-panel" className={`filter-panel ${expanded ? 'is-expanded' : ''}`}>
        <div className="filter-menus">
          <FilterMenu title="Annualized pay" count={Number(state.payMin != null) + Number(state.payMax != null)}>
            <p className="filter-help">Job Bank median wages, annualized at 2,080 hours where hourly. Published annual figures stay annual.</p>
            <div className="range-inputs"><label>Minimum ($)<input type="number" inputMode="numeric" min="0" max="1000000" step="1000" placeholder="Any" value={state.payMin ?? ''} onChange={e => number('payMin', e.target.value)} /></label><span>to</span><label>Maximum ($)<input type="number" inputMode="numeric" min="0" max="1000000" step="1000" placeholder="Any" value={state.payMax ?? ''} onChange={e => number('payMax', e.target.value)} /></label></div>
            <button type="button" className="text-button" onClick={onMethodology}>Sources & conversion</button>
          </FilterMenu>
          <FilterMenu title="Education & training" count={state.teer.length}>
            <fieldset><legend>Pathway categories (TEER)</legend>{TEER_DEFINITIONS.map(t => <label className="filter-option" key={t.id}><input type="checkbox" checked={state.teer.includes(t.id)} onChange={() => toggle('teer', t.id)} /><span><b>TEER {t.id}</b> {t.label}</span></label>)}</fieldset><p className="filter-help">Categories include experience and responsibility. They are not years of school or a guarantee you qualify.</p>
          </FilterMenu>
          <FilterMenu title="AI exposure" count={Number(state.aiMin != null) + Number(state.aiMax != null)}>
            <p className="filter-help">Relative exposure index, 0 to 10. Experimental OaSIS based ranking, not a percentage of jobs at risk.</p>
            <div className="range-inputs"><label>Minimum exposure<input type="number" inputMode="decimal" min="0" max="10" step="0.1" placeholder="0" value={state.aiMin ?? ''} onChange={e => number('aiMin', e.target.value)} /></label><span>to</span><label>Maximum exposure<input type="number" inputMode="decimal" min="0" max="10" step="0.1" placeholder="10" value={state.aiMax ?? ''} onChange={e => number('aiMax', e.target.value)} /></label></div>
            <div className="quick-bands">{[[0, 3.9], [4, 6.9], [7, 10]].map(([min, max]) => <button type="button" key={min} onClick={() => filter({ aiMin: min, aiMax: max })}>{min} to {max}</button>)}</div>
          </FilterMenu>
          <FilterMenu title="Projected outlook" count={state.outlook.length}>
            <fieldset><legend>COPS · 2024 to 2033</legend>{OUTLOOK_DEFINITIONS.map(o => <label className="filter-option" key={o.id}><input type="checkbox" checked={state.outlook.includes(o.id)} onChange={() => toggle('outlook', o.id)} /><span>{o.label}</span></label>)}</fieldset><p className="filter-help">Long term labour market balance, not current vacancies or a growth percentage.</p>
          </FilterMenu>
          <FilterMenu title="Career field" count={state.fields.length}>
            <fieldset><legend>NOC 2021 broad occupation groups</legend>{FIELD_DEFINITIONS.map(([id, label, full]) => <label className="filter-option" title={full} key={id}><input type="checkbox" checked={state.fields.includes(id)} onChange={() => toggle('fields', id)} /><span>{label}</span></label>)}</fieldset><p className="filter-help">Occupation families, not economic industries.</p>
          </FilterMenu>
        </div>
        <div className="presets"><span>START WITH</span>{PRESETS.map(p => <button type="button" key={p.label} title={p.note} onClick={() => onChange({ ...emptyFilters(), ...p.filters, page: 1 })}>{p.label}</button>)}</div>
      </div>
      {chips.length > 0 && <div className="active-filters" aria-label="Active filters">{chips.map(c => <button type="button" className="filter-chip" key={c.label} aria-label={`Remove filter: ${c.label}`} onClick={() => filter(c.patch)}>{c.label}<X size={12} aria-hidden="true" /></button>)}<button type="button" className="text-button" onClick={() => filter(emptyFilters())}>Clear all filters</button></div>}
      <div className="result-summary"><p role="status"><strong>{count}</strong> of {total} occupations{chips.length ? ' match your filters' : ' to explore'}</p><span><Check size={13} aria-hidden="true" /> Same results in both views</span><button type="button" className="text-button" onClick={onMethodology}>Data & methodology</button></div>
  </div>
}
