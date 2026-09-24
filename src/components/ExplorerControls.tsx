import { TermHelp } from './TermHelp'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { BrainCircuit, Check, ChevronDown, CircleDollarSign, GraduationCap, Layers, List, Search, SlidersHorizontal, Sparkles, SquareChartGantt, TrendingUp, X, type LucideIcon } from 'lucide-react'
import { emptyFilters, FIELD_DEFINITIONS, OUTLOOK_DEFINITIONS, PRESETS, TEER_DEFINITIONS, type CareerFilters, type ExplorerState } from '../lib/careers'

interface Props { state: ExplorerState; onChange: (patch: Partial<ExplorerState>) => void; count: number; total: number; onMethodology: () => void }
export function FilterMenu({ title, count, children, icon: Icon, description }: { title: string; count: number; children: ReactNode; icon?: LucideIcon; description?: string }) {
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
    <summary data-active={count > 0 || undefined}>{Icon && <Icon size={15} strokeWidth={1.8} aria-hidden="true" />}<span className="filter-title">{title}</span>{count > 0 && <span className="filter-number">{count}</span>}<ChevronDown className="filter-chevron" size={14} aria-hidden="true" /></summary>
    <div className="filter-popover">
      <p className="filter-popover-title">{title}</p>
      {description && <p className="filter-popover-description">{description}</p>}
      {children}
    </div>
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
  const searchRef = useRef<HTMLInputElement>(null)
  // "/" jumps to search from anywhere outside a text field.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable], dialog')) return
      event.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const chips = activeFilterChips(state)
  const filter = (patch: Partial<CareerFilters>) => onChange({ ...patch, page: 1 })
  const toggle = (key: 'teer' | 'outlook' | 'fields', id: string) => filter({ [key]: state[key].includes(id) ? state[key].filter(x => x !== id) : [...state[key], id] })
  const number = (key: 'payMin' | 'payMax' | 'aiMin' | 'aiMax', value: string) => filter({ [key]: value === '' ? null : Math.max(0, Math.min(key.startsWith('ai') ? 10 : 1000000, Number(value))) })
  return <div className="explorer-controls" id="career-controls">
      <div className="search-view-row">
        <label className="career-search"><Search size={19} aria-hidden="true" /><span className="sr-only">Search occupations, NOC codes or common titles</span><input ref={searchRef} type="search" value={state.query} onChange={e => filter({ query: e.target.value.slice(0, 120) })} placeholder="Search a career or NOC" maxLength={120} />{state.query ? <button type="button" aria-label="Clear search" onClick={() => filter({ query: '' })}><X size={16} /></button> : <kbd className="search-shortcut" aria-hidden="true">/</kbd>}</label>
        <TermHelp term="noc" />
        <div className="view-toggle" role="group" aria-label="Explorer view" data-view={state.view}><span className="view-toggle-pill" aria-hidden="true" /><button type="button" aria-pressed={state.view === 'treemap'} onClick={() => onChange({ view: 'treemap' })}><SquareChartGantt size={16} />Treemap</button><button type="button" aria-pressed={state.view === 'list'} onClick={() => onChange({ view: 'list' })}><List size={17} />List</button></div>
        <button ref={toggleRef} type="button" className="mobile-filter-toggle" aria-expanded={expanded} aria-controls="filter-panel" onClick={() => setExpanded(!expanded)}><SlidersHorizontal size={16} />Filters{chips.length > 0 && <span>{chips.length}</span>}</button>
      </div>
      <div ref={panelRef} id="filter-panel" className={`filter-panel ${expanded ? 'is-expanded' : ''}`}>
        <div className="filter-menus">
          <FilterMenu title="Annualized pay" icon={CircleDollarSign} description="Median wages, CAD per year" count={Number(state.payMin != null) + Number(state.payMax != null)}>
            <p className="filter-help"><TermHelp term="pay" /> Job Bank median wages, annualized at 2,080 hours where hourly. Published annual figures stay annual.</p>
            <div className="range-inputs"><label>Minimum ($)<input type="number" inputMode="numeric" min="0" max="1000000" step="1000" placeholder="Any" value={state.payMin ?? ''} onChange={e => number('payMin', e.target.value)} /></label><span>to</span><label>Maximum ($)<input type="number" inputMode="numeric" min="0" max="1000000" step="1000" placeholder="Any" value={state.payMax ?? ''} onChange={e => number('payMax', e.target.value)} /></label></div>
            <button type="button" className="text-button" onClick={onMethodology}>Sources & conversion</button>
          </FilterMenu>
          <FilterMenu title="Education & training" icon={GraduationCap} description="NOC 2021 TEER pathway categories" count={state.teer.length}>
            <fieldset><legend>Pathway categories (TEER)<TermHelp term="teer" /></legend>{TEER_DEFINITIONS.map(t => <label className="filter-option" key={t.id}><input type="checkbox" checked={state.teer.includes(t.id)} onChange={() => toggle('teer', t.id)} /><span><b>TEER {t.id}</b> {t.label}</span></label>)}</fieldset><p className="filter-help">Categories include experience and responsibility. They are not years of school or a guarantee you qualify.</p>
          </FilterMenu>
          <FilterMenu title="AI exposure" icon={BrainCircuit} description="Relative index, 0 to 10" count={Number(state.aiMin != null) + Number(state.aiMax != null)}>
            <p className="filter-help"><TermHelp term="exposure" /> Relative exposure index, 0 to 10. Experimental OaSIS based ranking, not a percentage of jobs at risk.</p>
            <div className="range-inputs"><label>Minimum exposure<input type="number" inputMode="decimal" min="0" max="10" step="0.1" placeholder="0" value={state.aiMin ?? ''} onChange={e => number('aiMin', e.target.value)} /></label><span>to</span><label>Maximum exposure<input type="number" inputMode="decimal" min="0" max="10" step="0.1" placeholder="10" value={state.aiMax ?? ''} onChange={e => number('aiMax', e.target.value)} /></label></div>
            <div className="quick-bands">{[[0, 3.9, 'Lower'], [4, 6.9, 'Middle'], [7, 10, 'Higher']].map(([min, max, name]) => <button type="button" key={min} aria-pressed={state.aiMin === min && state.aiMax === max} onClick={() => filter({ aiMin: min as number, aiMax: max as number })}><strong>{name}</strong>{min} to {max}</button>)}</div>
          </FilterMenu>
          <FilterMenu title="Projected outlook" icon={TrendingUp} description="COPS labour market balance, 2024 to 2033" count={state.outlook.length}>
            <fieldset><legend>COPS · 2024 to 2033<TermHelp term="outlook" /></legend>{OUTLOOK_DEFINITIONS.map(o => <label className="filter-option" key={o.id}><input type="checkbox" checked={state.outlook.includes(o.id)} onChange={() => toggle('outlook', o.id)} /><span>{o.label}</span></label>)}</fieldset><p className="filter-help">Long term labour market balance, not current vacancies or a growth percentage.</p>
          </FilterMenu>
          <FilterMenu title="Career field" icon={Layers} description="NOC 2021 broad occupation groups" count={state.fields.length}>
            <fieldset><legend>NOC 2021 broad occupation groups</legend>{FIELD_DEFINITIONS.map(([id, label, full]) => <label className="filter-option" title={full} key={id}><input type="checkbox" checked={state.fields.includes(id)} onChange={() => toggle('fields', id)} /><span>{label}</span></label>)}</fieldset><p className="filter-help">Occupation families, not economic industries.</p>
          </FilterMenu>
        </div>
        <div className="presets"><span><Sparkles size={13} aria-hidden="true" />Start with</span>{PRESETS.map(p => <button type="button" key={p.label} title={p.note} onClick={() => onChange({ ...emptyFilters(), ...p.filters, page: 1 })}>{p.label}</button>)}</div>
      </div>
      {chips.length > 0 && <div className="active-filters" aria-label="Active filters"><span className="active-filters-label">Active</span>{chips.map(c => <button type="button" className="filter-chip" key={c.label} aria-label={`Remove filter: ${c.label}`} onClick={() => filter(c.patch)}>{c.label}<X size={12} aria-hidden="true" /></button>)}<button type="button" className="text-button" onClick={() => filter(emptyFilters())}>Clear all filters</button></div>}
      <div className="result-summary"><p role="status"><strong>{count}</strong><span> of {total} occupations{chips.length ? ' match your filters' : ' to explore'}</span></p><span className="result-badge"><Check size={13} aria-hidden="true" /> Same results in both views</span><button type="button" className="text-button" onClick={onMethodology}>Data & methodology</button></div>
  </div>
}
