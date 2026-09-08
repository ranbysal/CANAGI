import { ArrowDown, ArrowUpRight, Check, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { annualPay, outlookOf, rankCareers, SORTS, teerOf, type CareerSort } from '../lib/careers'
import type { Layer, Occupation } from '../types'
import { useMemo } from 'react'
import { AnimatedText } from './AnimatedText'

export function CompareButton({ item, selected, full, onToggle }: { item: Occupation; selected: boolean; full: boolean; onToggle: (id: string) => void }) {
  return <button className={`compare-add ${selected ? 'is-selected' : ''}`} type="button" onClick={() => onToggle(item.noc_code)} disabled={!selected && full} aria-pressed={selected} aria-label={`${selected ? 'Remove' : 'Add'} ${item.title} ${selected ? 'from' : 'to'} comparison`} title={!selected && full ? 'Three careers selected. Remove one to add another.' : selected ? 'Remove from comparison' : 'Add to comparison'}>{selected ? <Check size={17} /> : <Plus size={17} />}<span>{selected ? 'Added' : 'Compare'}</span></button>
}
interface Props { data: Occupation[]; sort: CareerSort; layer: Layer; page: number; compared: string[]; onSort: (sort: CareerSort) => void; onPage: (page: number) => void; onSelect: (id: string) => void; onCompare: (id: string) => void }
export function CareerList({ data, sort, page, compared, onSort, onPage, onSelect, onCompare }: Props) {
  const ranked = useMemo(() => rankCareers(data, sort), [data, sort])
  const pageSize = 30, pages = Math.max(1, Math.ceil(ranked.length / pageSize)), actualPage = Math.min(page, pages)
  const shown = ranked.slice((actualPage - 1) * pageSize, actualPage * pageSize)
  return <section className="career-list research-list" aria-label="Occupation list" id="career-list">
    <div className="list-toolbar"><div><p className="utility-label">{sort === 'name' ? 'OCCUPATION DIRECTORY' : 'RANKED WITHIN YOUR RESULTS'}</p><p>{sort === 'name' ? 'Explore the work behind the numbers.' : SORTS[sort]}</p></div><label className="sort-control"><ArrowDown size={15} aria-hidden="true" /><span className="sr-only">Sort occupations</span><select value={sort} onChange={e => onSort(e.target.value as CareerSort)}>{Object.entries(SORTS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>
    {sort !== 'name' && <p className="ranking-note">Equal values share a rank (1, 1, 3). Ties appear alphabetically. Missing values are unranked and last. There is no overall career score.</p>}
    {sort.startsWith('outlook') && <p className="ranking-note">Outlook order runs from strong surplus to strong shortage. Shortage first reverses this order.</p>}
    <ol className="occupation-directory" start={(actualPage - 1) * pageSize + 1}>{shown.map(({ item, rank }) => <li className="occupation-row" key={item.noc_code} data-noc={item.noc_code}>
      <div className="occupation-identity">{sort !== 'name' && <span className="occupation-rank" aria-label={`Rank ${rank ?? 'unavailable'}`}>{rank == null ? 'N/A' : String(rank).padStart(2, '0')}</span>}<div><button className="career-title-button" type="button" onClick={event => { event.currentTarget.focus({ preventScroll: true }); onSelect(item.noc_code) }}><span><AnimatedText text={item.title} duration={430} /></span><ArrowUpRight size={17} aria-hidden="true" /></button><p className="occupation-metadata"><span>NOC {item.noc_code}</span><span>TEER {teerOf(item)?.id ?? '?'} · {teerOf(item)?.short ?? 'Not available'}</span><span>{outlookOf(item).label}</span></p></div></div>
      <div className="occupation-pay"><span>Annualized median</span><strong><AnimatedText text={annualPay(item.pay)} duration={260} /></strong><small>CAD / year</small></div>
      <div className="occupation-exposure"><span>Relative AI exposure</span><strong><AnimatedText text={item.exposure?.toFixed(1) ?? 'N/A'} duration={220} /><small> / 10</small></strong><div className="index-track" aria-hidden="true">{item.exposure != null && <i style={{ left: `${item.exposure * 10}%` }} />}</div></div>
      <CompareButton item={item} selected={compared.includes(item.noc_code)} full={compared.length >= 3} onToggle={onCompare} />
    </li>)}</ol>
    <div className="list-pagination"><p>{ranked.length ? (actualPage - 1) * pageSize + 1 : 0} to {Math.min(actualPage * pageSize, ranked.length)} of {ranked.length} matching occupations</p><div><button type="button" disabled={actualPage <= 1} onClick={() => onPage(actualPage - 1)} aria-label="Previous results page"><ChevronLeft size={17} /></button><span>Page {actualPage} / {pages}</span><button type="button" disabled={actualPage >= pages} onClick={() => onPage(actualPage + 1)} aria-label="Next results page"><ChevronRight size={17} /></button></div></div>
    <p className="table-footnote">Job Bank, November 2025 release. Hourly medians × 2,080 hours; published annual figures remain annual. AI exposure is an experimental relative index, not a job loss forecast. Open any occupation for its source wage, reference period and scoring rationale.</p>
  </section>
}
