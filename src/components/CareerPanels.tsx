import { useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, ArrowUpRight, Columns3, ExternalLink, X } from 'lucide-react'
import type { Occupation } from '../types'
import { annualPay, employmentValue, EXPOSURE_NOTE, exposureValue, fieldOf, isKnown, nocUrl, outlookOf, PAY_NOTE, publishedWage, SOURCES, teerOf } from '../lib/careers'
import { REVIEWED_PROFILES } from '../data/reviewedProfiles'
import { CompareButton } from './CareerList'
import { useCareerEvidence } from '../lib/useCareerEvidence'
import { ExposureEvidence } from './ExposureEvidence'
import { DATA_RELEASE } from '../data/dataRelease'

export function Dialog({ title, eyebrow, wide = false, onClose, children }: { title: string; eyebrow: string; wide?: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null), titleId = useId()
  const triggerRef = useRef<HTMLElement | null>(null)
  useLayoutEffect(() => {
    const dialog = ref.current!
    if (!triggerRef.current) triggerRef.current = document.activeElement as HTMLElement | null
    const position = { left: window.scrollX, top: window.scrollY }
    const overflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    dialog.showModal()
    return () => {
      dialog.close()
      document.documentElement.style.overflow = overflow
      requestAnimationFrame(() => {
        if (!document.querySelector('dialog[open]')) {
          window.scrollTo({ ...position, behavior: 'instant' })
          if (triggerRef.current?.isConnected) triggerRef.current.focus({ preventScroll: true })
        }
      })
    }
  }, [])
  return createPortal(<dialog className={`career-dialog ${wide ? 'career-dialog--wide' : ''}`} ref={ref} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); onClose() }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
    <div className="dialog-content">
      <header className="dialog-heading"><div><p className="utility-label">{eyebrow}</p><h2 id={titleId}>{title}</h2></div><button type="button" className="dialog-close" onClick={onClose} aria-label="Close panel" autoFocus><X size={22} /></button></header>
      {children}
    </div>
  </dialog>, document.body)
}
export function CareerResources({ item, compact = false }: { item: Occupation; compact?: boolean }) {
  return <div className={`career-resources ${compact ? 'compact-resources' : ''}`}>
    <a href={nocUrl(item.noc_code)} target="_blank" rel="noreferrer"><span><strong>Official NOC profile</strong>{!compact && <small>Duties, requirements & example titles · NOC {item.noc_code}</small>}</span><ExternalLink size={16} /></a>
    <a href={SOURCES.profiles} target="_blank" rel="noreferrer"><span><strong>Wage & outlook search</strong>{!compact && <small>Job Bank search tool · Enter NOC {item.noc_code} and choose a location</small>}</span><ExternalLink size={16} /></a>
    <a href={SOURCES.training} target="_blank" rel="noreferrer"><span><strong>Training & education resources</strong>{!compact && <small>Canada.ca directory · General tools, not a verified program for this occupation</small>}</span><ExternalLink size={16} /></a>
  </div>
}
function CareerWorkSummary({ item }: { item: Occupation }) {
  const evidence = useCareerEvidence(item.noc_code)
  return <><p>{evidence.data?.description ?? (evidence.error ? 'Description unavailable. Consult the official source.' : 'Loading occupation description.')}</p><a href={nocUrl(item.noc_code)} target="_blank" rel="noreferrer">Official NOC profile</a><small>NOC 2021 · checked {DATA_RELEASE.checked}</small></>
}
export function CareerRequirements({ item }: { item: Occupation }) {
  const teer = teerOf(item), profile = REVIEWED_PROFILES[item.noc_code]
  const { data } = useCareerEvidence(item.noc_code)
  return <><p className="pathway-heading">TEER {teer?.id ?? '?'} · {teer?.label ?? 'Not available'}</p><p>{teer?.description ?? 'A pathway category is not available.'}</p>{data?.requirements.length ? <ul className="requirements-list">{data.requirements.map((text, index) => <li key={index}>{text}</li>)}</ul> : profile ? <p>{profile.requirements}</p> : <p className="data-caveat">Consult the official NOC profile below for full requirements. The TEER category alone does not establish eligibility.</p>}</>
}
export function OccupationDetails({ item, compared, onCompare, onClose }: { item: Occupation; compared: string[]; onCompare: (id: string) => void; onClose: () => void }) {
  const profile = REVIEWED_PROFILES[item.noc_code]
  const evidence = useCareerEvidence(item.noc_code)
  return <Dialog title={item.title} eyebrow={`CAREER PROFILE · NOC ${item.noc_code}`} onClose={onClose}>
    <div className="detail-context"><span>{fieldOf(item)?.[1] ?? 'Field not available'} · Canada</span><CompareButton item={item} selected={compared.includes(item.noc_code)} full={compared.length >= 3} onToggle={onCompare} /></div>
    <dl className="detail-metrics"><div><dt>Annualized pay</dt><dd>{annualPay(item.pay)}</dd><small>CAD · {item.wage?.unit === 'year' ? 'Published annual median' : 'Hourly median × 2,080'}</small></div><div><dt>AI exposure index</dt><dd>{exposureValue(item.exposure)}</dd><small>Relative position · Experimental</small></div><div><dt>Projected outlook</dt><dd className="detail-outlook">{outlookOf(item).label}</dd><small>COPS · 2024 to 2033</small></div><div><dt>Covered employment</dt><dd>{employmentValue(item.jobs)}</dd><small>2023 · National · Not vacancies</small></div></dl>
    <div className="published-wage"><span>Published national median</span><strong>{publishedWage(item)}</strong><span>{item.wage?.source} · {item.wage?.reference}</span></div>
    <section className="detail-section"><h3>The work</h3><p>{evidence.data?.description ?? profile?.description ?? 'Loading the official occupation description.'}</p>{evidence.data?.duties.length ? <details className="detail-source-note"><summary>Read the occupation’s main duties</summary><ul className="requirements-list">{evidence.data.duties.map((d, i) => <li key={i}>{d}</li>)}</ul></details> : null}<p className="source-caption">Source: <a href={nocUrl(item.noc_code)} target="_blank" rel="noreferrer">NOC 2021 v1.0</a>, checked {DATA_RELEASE.checked}. Requirements vary by specialization and jurisdiction.</p>{evidence.error && <p role="alert">The detailed source file did not load. The official NOC link remains available.</p>}</section>
    <ExposureEvidence item={item} evidence={evidence.data} error={evidence.error} />
    <section className="detail-section"><h3>Education, training & experience</h3><CareerRequirements item={item} /><p className="source-caption">Category definition: <a href={SOURCES.noc} target="_blank" rel="noreferrer">NOC 2021 v1.0 TEER</a>. Check local regulators for current licensing rules.</p></section>
    <section className="detail-section"><h3>Explore this career <ArrowUpRight size={20} /></h3><CareerResources item={item} /></section>
    <details className="detail-source-note"><summary>Sources, dates & what the numbers mean</summary><p><strong>Pay:</strong> {PAY_NOTE}</p><p>For this occupation: {item.wage?.source}, reference {item.wage?.reference}, wage release {item.wage?.updated}. {item.wage?.note}</p><p><strong>AI exposure:</strong> {EXPOSURE_NOTE}</p><p><strong>Employment:</strong> <a href={SOURCES.employment} target="_blank" rel="noreferrer">COPS employment file</a>, 2023 base year employment, sourced from Statistics Canada’s Labour Force Survey. Later years in that file are projections and are not substituted for observations.</p><p><strong>Outlook:</strong> <a href={SOURCES.cops} target="_blank" rel="noreferrer">COPS 2024 to 2033</a>, published January 30, 2025. Categories describe projected labour market balance, not growth rates.</p><p>Classification: NOC 2021 v1.0. Sources checked {DATA_RELEASE.checked}; this is not a new wage or employment observation date.</p></details>
    <p className="table-footnote">Annualized figures assume full time, year round work where the source is hourly. Actual hours, weeks and earnings vary.</p>
  </Dialog>
}
export function ComparisonTray({ selected, matching, onRemove, onClear, onOpen }: { selected: Occupation[]; matching: Set<string>; onRemove: (id: string) => void; onClear: () => void; onOpen: () => void }) {
  if (!selected.length) return null
  return <aside className="comparison-tray" aria-label="Selected careers for comparison"><div className="tray-label"><Columns3 size={18} /><strong>{selected.length}/3</strong><span>CAREERS</span></div><div className="tray-selections">{selected.map(item => <div className="tray-career" key={item.noc_code}><div><span className="tray-title">{item.title}</span>{!matching.has(item.noc_code) && <small>Outside current filters</small>}</div><button type="button" onClick={() => onRemove(item.noc_code)} aria-label={`Remove ${item.title} from comparison`}><X size={15} /></button></div>)}</div><div className="tray-actions"><button type="button" className="text-button" onClick={onClear}>Clear</button><button type="button" className="primary-button" disabled={selected.length < 2} onClick={onOpen}>Compare{selected.length < 2 ? ' · add one more' : ` ${selected.length}`}<ArrowRight size={16} /></button></div></aside>
}
export function OccupationComparison({ items, onClose }: { items: Occupation[]; onClose: () => void }) {
  const knownPay = items.filter(x => isKnown(x.pay)), knownAi = items.filter(x => isKnown(x.exposure))
  const topPay = knownPay.length > 1 ? Math.max(...knownPay.map(x => x.pay!)) : null
  const lowAi = knownAi.length > 1 ? Math.min(...knownAi.map(x => x.exposure!)) : null
  const row = (label: string, render: (item: Occupation) => ReactNode) => <tr key={label}><th scope="row">{label}</th>{items.map(item => <td key={item.noc_code}>{render(item)}</td>)}</tr>
  return <Dialog title="Different careers. Clearer trade offs." eyebrow={`COMPARE ${items.length} OCCUPATIONS · CANADA`} wide onClose={onClose}>
    <p className="dialog-intro">The same national snapshot, side by side. This comparison does not choose a winner or predict your fit.</p>
    <p className="mobile-table-hint">Swipe across to compare each career →</p>
    <div className="comparison-scroll" role="region" tabIndex={0} aria-label="Side by side career comparison; scroll horizontally for all careers"><table className="comparison-table" data-careers={items.length}><caption className="sr-only">Occupation comparison. Each column is one selected occupation.</caption><thead><tr><th scope="col">CAREER</th>{items.map(item => <th scope="col" key={item.noc_code}><span className="utility-label">NOC {item.noc_code}</span><h3>{item.title}</h3></th>)}</tr></thead><tbody>
      {row('Annualized pay · CAD', item => <><strong className="compare-number">{annualPay(item.pay)}</strong><small>{publishedWage(item)} published · {item.wage?.reference}</small></>)}
      {row('Projected outlook · 2024 to 2033', item => <span className="outlook-label"><i style={{ background: outlookOf(item).color }} />{outlookOf(item).label}</span>)}
      {row('AI exposure index · relative 0 to 10', item => <><strong className="compare-number">{exposureValue(item.exposure)}</strong><small>{item.ai?.explanation}</small></>)}
      {row('Covered employment · national, 2023', item => <>{employmentValue(item.jobs)}<small>Not current vacancies</small></>)}
      {row('Education, training & experience', item => <CareerRequirements item={item} />)}
      {row('Career field · NOC broad group', item => fieldOf(item)?.[2] ?? 'Not available')}
      {row('The work', item => <CareerWorkSummary item={item} />)}
      {row('Explore this career', item => <CareerResources item={item} compact />)}
    </tbody></table></div>
    <div className="comparison-takeaways"><h3>A few factual differences</h3>{topPay != null && <p>The highest annualized pay among the {knownPay.length} careers with pay data is {annualPay(topPay)}: {knownPay.filter(x => x.pay === topPay).map(x => x.title).join('; ')}. Hourly sources assume 2,080 hours; source reference periods can differ.</p>}{lowAi != null && <p>The lowest relative exposure index among the {knownAi.length} careers with scores is {lowAi}/10: {knownAi.filter(x => x.exposure === lowAi).map(x => x.title).join('; ')}. This does not establish job security.</p>}</div>
    <p className="table-footnote">{PAY_NOTE}</p><p className="table-footnote">{EXPOSURE_NOTE} Employment: 2023. Outlook uses <a href={SOURCES.cops} target="_blank" rel="noreferrer">COPS 2024 to 2033</a> (published January 30, 2025). Pathways use NOC 2021. Sources checked {DATA_RELEASE.checked}.</p>
  </Dialog>
}
export function MethodologyPanel({ onClose, count, employed }: { onClose: () => void; count: number; employed: number }) {
  return <Dialog title="Read the data with context." eyebrow="SOURCES & METHODOLOGY" onClose={onClose}>
    <div className="methodology-content"><section><h3>What is current, and what is comparable?</h3><p>Checked {DATA_RELEASE.checked}. This release covers all {count} five digit NOC 2021 v1.0 occupation groups. {employed} have employment and outlook data, {DATA_RELEASE.wageCoverage} have a published national wage, and {DATA_RELEASE.exposureCoverage} have an experimental exposure estimate. Missing data stays unavailable, never zero.</p><p>The latest national context shown is {employmentValue(DATA_RELEASE.national.jobs)} employed people in {DATA_RELEASE.national.reference}, seasonally adjusted, from <a href={DATA_RELEASE.national.url} target="_blank" rel="noreferrer">Statistics Canada table 14 to 10 to 0310 to 01</a>. It is separate from the occupation sized treemap.</p><p>Detailed occupation employment comes from the 2023 base year in the <a href={SOURCES.employment} target="_blank" rel="noreferrer">COPS employment file</a>. Newer public LFS occupation tables use broader groupings, including different management aggregates. We do not allocate those newer totals to individual careers or present COPS projections as observed employment.</p></section>
    <section><h3>Wages with the original units and dates</h3><p>{PAY_NOTE}</p><p><a href={SOURCES.wages} target="_blank" rel="noreferrer">The November 2025 Job Bank release</a> is the latest national occupation level wage release verified for this update. Most records refer to 2023 to 2024; some use 2024 or the 2021 Census. The original low, median, high, unit, source and reference period are retained. A recent publication date does not mean all observations are recent.</p><p>Field pay spreads compare occupation medians with equal weight. They are not distributions of individual workers’ wages or a field’s worker median. Annualized hourly wages describe a 40-hour, 52-week scenario; published annual data can have a different earnings concept, described in the source note.</p></section>
    <section><h3>TEER is not years of school</h3><p><a href={SOURCES.noc} target="_blank" rel="noreferrer">NOC 2021 TEER definitions</a> describe training, education, experience and responsibility. The second NOC digit identifies the category. TEER 0 means management, not automatically a university degree plus experience. Categories have alternative pathways. Check the occupation’s full requirements.</p></section>
    <section><h3>Long term outlook, not openings today</h3><p><a href={SOURCES.cops} target="_blank" rel="noreferrer">COPS 2024 to 2033 projections</a> were published January 30, 2025. The source orders risk of surplus, balance, then risk of shortage, with moderate and strong risk levels. The stored numeric labels are category encodings, not growth percentages; we never average them.</p></section>
    <section><h3>A transparent, experimental exposure index</h3><p>{EXPOSURE_NOTE}</p><p>We use the 39 work activity proficiency or complexity ratings from <a href={SOURCES.oasis} target="_blank" rel="noreferrer">ESDC’s OaSIS 2025 dataset</a>, covering 900 profiles mapped directly to all 516 NOC groups. The 0 to 5 levels are used as a weighting proxy, not time shares. Each activity has a published CANAGI coefficient for potential generative software assistance. Raw score = 10 × Σ(level × coefficient) ÷ Σ(level). Profile scores are averaged equally within a NOC because sub profile employment weights are unavailable.</p><p>We turn the raw averages into a relative 0 to 10 index using midranks across the fixed 516-occupation cohort. A score of 0 still permits exposure; 10 is the highest relative position, not complete automation. The six scenario sensitivity range varies coefficients by ±0.15 and uses linear or squared activity weights. It is not a confidence interval. Changing the cohort or rubric can change ranks.</p><p>Every career profile shows its drivers, lower exposure activities, human oversight context, source profiles and complete calculation inputs. Oversight is the maximum of OaSIS consequence of error and health and safety responsibility ratings, averaged across sub profiles. It is kept separate from exposure, not presented as a validated complementarity measure.</p><p>The distinction between exposure and displacement is informed by <a href={SOURCES.aiResearch} target="_blank" rel="noreferrer">Statistics Canada’s experimental AI exposure research</a> and the <a href={SOURCES.ilo} target="_blank" rel="noreferrer">ILO’s 2025 task exposure study</a>. This is our own unvalidated index, not a reproduction of either published measure. It excludes robotics and does not predict adoption, hiring, unemployment, or the rate of future AI progress.</p></section>
    <section><h3>How filters, ranks and totals work</h3><p>Different categories combine with AND; multiple selected choices inside a category combine with OR. Numeric limits include their endpoints and exclude missing values. Common title aliases are a small, non exhaustive search aid, not a qualification assessment.</p><p>Ranks apply only to matching records. Ties share a competition rank (1, 1, 3) and are alphabetical within the tie. Unknowns are unranked and last in either direction.</p><p>Employment totals sum distinct NOC groups with known employment. Exposure averages use valid employment and score pairs. Shortage shares divide employment in moderate or strong shortage occupations by employment with an assessed outlook. Education mixes count occupations, not workers. Coverage is shown beside each metric.</p></section>
    <section><h3>Career fields and next steps</h3><p>Fields use the <a href={SOURCES.noc} target="_blank" rel="noreferrer">first digit of NOC 2021</a>, not industry codes. A health occupation family is not the whole healthcare industry. Field comparison covers the full chosen groups and ignores detailed filters; drill down resets conflicting filters visibly.</p><p>All careers now include official NOC descriptions, main duties and employment requirements. These are classification descriptions, not individualized eligibility or current licensing advice. Job Bank and Canada.ca links are general search tools or directories, not endorsed training programs. The <a href="/data/release.json" target="_blank" rel="noreferrer">release record</a> lists exact source downloads and their checksums.</p></section></div>
  </Dialog>
}
