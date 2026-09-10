import { TermHelp } from './TermHelp'
import { ArrowRight, X } from 'lucide-react'
import { useMemo, type CSSProperties, type ReactNode } from 'react'
import type { Occupation } from '../types'
import { aggregateField, annualPay, employmentValue, FIELD_DEFINITIONS, fieldOf, PAY_NOTE, SOURCES, TEER_DEFINITIONS } from '../lib/careers'
import { formatCompact } from '../lib/format'
import { DATA_RELEASE } from '../data/dataRelease'
import { FilterMenu } from './ExplorerControls'
import { AnimatedText } from './AnimatedText'

type Field = ReturnType<typeof aggregateField> & { id: string; name: string; description: string; records: Occupation[] }
const letter = (index: number) => String.fromCharCode(65 + index)
const percent = (value: number, total: number) => total > 0 ? `${Math.round(value / total * 100)}%` : 'N/A'
function Section({ number, title, note, children }: { number: string; title: string; note: ReactNode; children: ReactNode }) {
  return <section className="field-study-section"><header><span className="study-number">{number}</span><h3><AnimatedText text={title} delay={180} /></h3><div className="study-description">{note}</div></header><div className="study-plot">{children}</div></section>
}
function Axis({ maximum, format = String }: { maximum: number; format?: (n: number) => string }) {
  return <div className="study-axis" aria-hidden="true">{[0, .25, .5, .75, 1].map(t => <span key={t}>{format(t * maximum)}</span>)}</div>
}
function Label({ field, index }: { field: Field; index: number }) {
  return <span className="study-row-name"><i>{letter(index)}</i><AnimatedText text={field.name} delay={500 + index * 100} /></span>
}

export function FieldComparison({ data, selected, onChange, onExplore, onMethodology }: { data: Occupation[]; selected: string[]; onChange: (ids: string[]) => void; onExplore: (id: string) => void; onMethodology: () => void }) {
  const fields = useMemo(() => selected.flatMap(id => {
    const definition = FIELD_DEFINITIONS.find(f => f[0] === id)
    if (!definition) return []
    const records = data.filter(d => fieldOf(d)?.[0] === id)
    return [{ id, name: definition[1], description: definition[2], records, ...aggregateField(records) }]
  }), [data, selected])
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter(x => x !== id) : selected.length < 3 ? [...selected, id] : selected)
  const jobMaximum = Math.max(500000, Math.ceil(Math.max(...fields.map(f => f.jobs ?? 0), 0) / 500000) * 500000)
  const payMaximum = Math.max(50000, Math.ceil(Math.max(...fields.map(f => f.payMax ?? 0), 0) / 50000) * 50000)
  const density = fields.map(f => Array.from({ length: 20 }, (_, i) => f.records.filter(r => r.jobs != null && r.exposure != null && Math.min(19, Math.floor(r.exposure * 2)) === i).reduce((sum, r) => sum + r.jobs!, 0) / (f.exposureJobs || 1)))
  const densityMaximum = Math.max(.01, ...density.flat())
  return <div className="field-comparison research-comparison">
    <header className="research-heading"><div><p className="research-eyebrow">THE BROADER PICTURE</p><h2 id="field-comparison-title" tabIndex={-1}><AnimatedText text="Compare career fields." delay={80} duration={400} /></h2><p>Different scales. Different pathways. A shared basis for comparison.</p></div><div className="research-heading-note"><span>CANADA / NOC 2021</span><p>Full occupation families.<br />Your career filters stay saved.</p><button className="text-button" type="button" onClick={onMethodology}>Sources & methodology <ArrowRight size={14} /></button></div></header>
    <div className="field-selection-toolbar"><p>Choose two or three fields<span>Occupation families, not economic industries</span></p><FilterMenu title="Choose fields" count={selected.length}><fieldset><legend>Compare up to three career fields</legend>{FIELD_DEFINITIONS.map(([id, name]) => <label className="filter-option" key={id}><input type="checkbox" checked={selected.includes(id)} disabled={!selected.includes(id) && selected.length >= 3} onChange={() => toggle(id)} /><span>{name}</span></label>)}</fieldset></FilterMenu><span className="field-selection-status" role="status">{selected.length} / 3 selected</span></div>
    <div className="selected-field-index" style={{ '--field-count': Math.max(1, fields.length) } as CSSProperties}>{fields.map((f, index) => <div key={f.id}><div className="field-index-top"><span className="field-letter">{letter(index)}</span><span>NOC {f.id} · {f.count} occupations</span><button type="button" aria-label={`Remove ${f.name} from field comparison`} onClick={() => toggle(f.id)}><X size={16} /></button></div><h3>{f.name}</h3><button className="field-drill" type="button" onClick={() => onExplore(f.id)}>Explore occupations <ArrowRight size={15} /></button></div>)}</div>
    {fields.length < 2 ? <div className="empty-results"><h3>Select another perspective.</h3><p>Choose {2 - fields.length} more {fields.length ? 'field' : 'fields'} to begin comparing.</p></div> : <div className="field-study">
      <Section number="01" title="The scale of work" note={<><p>Covered employment, 2023.</p><p>Each line uses the same scale. Counts include occupations with a published employment size.</p></>}>
        <Axis maximum={jobMaximum} format={formatCompact} />
        {fields.map((f, i) => <div className="study-measure" key={f.id}><div className="study-value-line"><Label field={f} index={i} /><strong>{f.jobs == null ? 'N/A' : formatCompact(f.jobs)}<small>people</small></strong></div><div className="study-bar"><i style={{ width: `${(f.jobs ?? 0) / jobMaximum * 100}%` }} /></div><p className="study-coverage">{employmentValue(f.jobs)} people · {f.employmentCount}/{f.count} occupations covered</p></div>)}
      </Section>
      <Section number="02" title="Pay, in perspective" note={<><p>Annualized occupation medians.</p><p>The band contains the middle half of occupation medians. The marker is the middle occupation; the fine line spans the lowest to highest.</p><p>Hourly sources × 2,080 hours. Published annual sources remain annual.</p></>}>
        <Axis maximum={payMaximum} format={n => `$${Math.round(n / 1000)}K`} />
        {fields.map((f, i) => <div className="study-measure pay-measure" key={f.id}><div className="study-value-line"><Label field={f} index={i} /><strong>{annualPay(f.payMedian)}<small>middle occupation</small></strong></div>{f.payCount > 0 ? <><div className="study-boxplot" role="img" aria-label={`${f.name}: minimum ${annualPay(f.payMin)}, 25th percentile ${annualPay(f.payQ1)}, median ${annualPay(f.payMedian)}, 75th percentile ${annualPay(f.payQ3)}, maximum ${annualPay(f.payMax)}`}><i className="boxplot-whisker" style={{ left: `${f.payMin! / payMaximum * 100}%`, width: `${(f.payMax! - f.payMin!) / payMaximum * 100}%` }} /><i className="boxplot-band" style={{ left: `${f.payQ1! / payMaximum * 100}%`, width: `${(f.payQ3! - f.payQ1!) / payMaximum * 100}%` }} /><i className="boxplot-median" style={{ left: `${f.payMedian! / payMaximum * 100}%` }} /></div><div className="study-quantiles"><span>Low {annualPay(f.payMin)}</span><span>25% {annualPay(f.payQ1)}</span><span>75% {annualPay(f.payQ3)}</span><span>High {annualPay(f.payMax)}</span></div></> : null}<p className="study-coverage">{f.payCount}/{f.count} occupations · Job Bank, November 2025 release</p></div>)}
      </Section>
      <Section number="03" title="Pathways into work" note={<><p>Share of occupations by TEER.<TermHelp term="teer" /></p><p>Education, training, experience and responsibility. TEER 0 means management. These are alternative pathways, not years of school.</p></>}>
        <div className="pathway-key">{TEER_DEFINITIONS.map((t, i) => <span key={t.id}><i style={{ background: `var(--ink-${i})` }} />{t.id} · {['Management', 'University / expertise', 'College / skilled apprenticeship', 'College / work training', 'Secondary / work training', 'Short work demonstration'][i]}</span>)}</div>
        {fields.map((f, i) => <div className="study-measure" key={f.id}><div className="study-value-line"><Label field={f} index={i} /><span className="study-small-value">{f.count} occupations</span></div><div className="pathway-stack" role="img" aria-label={f.education.map(t => `TEER ${t.id}: ${t.count} occupations`).join('; ')}>{f.education.map((t, j) => <div key={t.id} title={`TEER ${t.id}: ${t.count} occupations (${percent(t.count, f.count)})`} style={{ width: `${t.count / f.count * 100}%`, background: `var(--ink-${j})`, color: j < 3 ? 'var(--background)' : 'var(--text)' }}>{t.count / f.count > .08 && <span>{t.id}</span>}</div>)}</div><p className="study-coverage">{f.education.map(t => `TEER ${t.id}: ${t.count}`).join(' · ')}</p></div>)}
      </Section>
      <Section number="04" title="Where AI meets work" note={<><p>Relative activity exposure, 0–10.</p><p>Fine bars show the distribution of covered employment. The vertical marker locates the employment-weighted mean.</p><p>Experimental OaSIS-based estimate. Higher exposure can mean assistance or transformation, not necessarily displacement.</p><button className="text-button" type="button" onClick={onMethodology}>How the index works <ArrowRight size={14} /></button></>}>
        {fields.map((f, i) => <div className="study-measure exposure-measure" key={f.id}><div className="study-value-line"><Label field={f} index={i} /><strong>{f.exposureMean?.toFixed(1) ?? 'N/A'}<small>weighted index / 10</small></strong></div><div className="exposure-density" role="img" aria-label={`${f.name}: employment weighted relative AI exposure ${f.exposureMean?.toFixed(1) ?? 'unavailable'} out of 10; distribution from lower to higher exposure`}>{density[i].map((share, j) => <span key={j} title={`${j / 2} to ${(j + 1) / 2}: ${(share * 100).toFixed(1)}% of covered employment`} style={{ height: `${share / densityMaximum * 100}%` }} />)}{f.exposureMean != null && <i className="density-mean" style={{ left: `${f.exposureMean * 10}%` }} />}</div><Axis maximum={10} /><div className="exposure-band-values">{f.exposureBands.map(b => <span key={b.label}>{b.label}<strong>{percent(b.jobs, f.exposureJobs)}</strong></span>)}</div><p className="study-coverage">{formatCompact(f.exposureJobs)} covered 2023 jobs · {f.exposureCount}/{f.count} occupations with employment and scores</p></div>)}
      </Section>
      <Section number="05" title="Demand ahead" note={<><p>Employment in occupations projected to face shortages.</p><p>Moderate or strong risk of shortage over 2024–2033. A labour-market balance assessment, not a growth percentage or a count of vacancies.</p></>}>
        <Axis maximum={100} format={n => `${n}%`} />
        {fields.map((f, i) => <div className="study-measure" key={f.id}><div className="study-value-line"><Label field={f} index={i} /><strong>{f.shortageShare == null ? 'N/A' : `${Math.round(f.shortageShare * 100)}%`}<small>of assessed employment</small></strong></div><div className="study-bar"><i style={{ width: `${(f.shortageShare ?? 0) * 100}%` }} /></div><p className="study-coverage">{employmentValue(f.shortageJobs)} of {employmentValue(f.assessedJobs)} covered jobs · {f.assessedCount}/{f.count} occupations assessed</p></div>)}
      </Section>
    </div>}
    <details className="research-notes"><summary>Sources, coverage and comparison notes</summary><p>Employment: <a href={SOURCES.employment} target="_blank" rel="noreferrer">COPS 2023 base year</a>. Outlook: <a href={SOURCES.cops} target="_blank" rel="noreferrer">COPS 2024 to 2033</a>, still the latest verified projection release. AI inputs: <a href={SOURCES.oasis} target="_blank" rel="noreferrer">OaSIS 2025</a>. Sources checked {DATA_RELEASE.checked}.</p><p>{PAY_NOTE}</p><p>Each NOC is counted once. Unknowns are excluded from each metric’s denominator. Pay percentiles give each occupation equal weight. Pathways count occupations. Exposure means, its distribution, and shortage shares use covered 2023 employment weights. All exposure distributions use the same vertical scale, expressed as a share of each field’s covered employment. Rounding can affect totals.</p><p>These full fields ignore detailed career filters. Explore occupations opens that field in Career Explorer and resets conflicting filters, keeping career comparison selections.</p></details>
  </div>
}
