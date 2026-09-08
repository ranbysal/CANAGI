import { displayRecord } from '../lib/displayCopy'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowRight, ExternalLink, RotateCcw } from 'lucide-react'
import type { Occupation } from '../types'
import { emptyFilters, FIELD_DEFINITIONS, matchesCareer, uniqueCareers } from '../lib/careers'
import { type ContentPage } from '../lib/contentPages'
import { useExplorerState } from '../lib/useExplorerState'
import { LayerControls } from './LayerControls'
import { OccupationTreemap } from './OccupationTreemap'
import { StatsGrid } from './StatsGrid'
import { AnimatedText } from './AnimatedText'
import { ExplorerControls } from './ExplorerControls'
import { CareerList } from './CareerList'
import { ComparisonTray, MethodologyPanel, OccupationComparison, OccupationDetails } from './CareerPanels'
import { FieldComparison } from './FieldComparison'
import { NavigationLinks } from './NavigationLinks'
import { CareerSummary } from './CareerSummary'
import { DATA_RELEASE } from '../data/dataRelease'
import { useSurfaceTransition } from '../lib/useSurfaceTransition'

interface Props {
  interactive: boolean; hidden: boolean; page: ContentPage
  onNavigate: (page: ContentPage) => void; onHome: () => void
  darkMode: boolean; onThemeToggle: () => void
}

export function Explorer({ interactive, hidden, page, onNavigate, onHome, darkMode, onThemeToggle }: Props) {
  const [data, setData] = useState<Occupation[]>([])
  const [error, setError] = useState(false)
  const [methodology, setMethodology] = useState(() => window.location.hash === '#methodology')
  const [announcement, setAnnouncement] = useState('')
  const pageTransition = useSurfaceTransition()
  const viewTransition = useSurfaceTransition()
  const navigate = (destination: ContentPage) => {
    if (destination !== page) pageTransition.run(() => onNavigate(destination))
  }
  const validIds = useMemo(() => data.length ? new Set(data.map(d => d.noc_code)) : undefined, [data])
  const { state, update, toggleCompare, closeOverlay } = useExplorerState(validIds)
  const matching = useMemo(() => data.filter(d => matchesCareer(d, state)), [data, state])
  const matchingIds = useMemo(() => new Set(matching.map(d => d.noc_code)), [matching])
  const selected = useMemo(() => state.compared.flatMap(id => data.find(d => d.noc_code === id) ?? []), [state.compared, data])
  const detail = data.find(d => d.noc_code === state.detail)
  const overview = page === 'overview'
  const visibleData = overview ? data : matching
  const sizedCount = visibleData.filter(d => d.jobs != null && d.jobs > 0).length
  const openDetail = useCallback((id: string) => {
    if (page === 'overview') onNavigate('careers')
    update({ detail: id, comparison: false }, true)
  }, [update, page, onNavigate])
  const showMethodology = useCallback(() => setMethodology(true), [])

  useEffect(() => {
    const controller = new AbortController()
    fetch('/data/occupations.json', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('Occupation data could not be loaded'); return response.json() as Promise<Occupation[]> })
      .then(occupations => setData(uniqueCareers(displayRecord(occupations))))
      .catch(e => { if (e.name !== 'AbortError') setError(true) })
    return () => controller.abort()
  }, [])

  const exploreField = (id: string) => {
    update({ ...emptyFilters(), fields: [id], view: 'list', page: 1 })
    onNavigate('careers')
    setAnnouncement(`Showing ${FIELD_DEFINITIONS.find(f => f[0] === id)?.[1] ?? id}. Other occupation filters were reset. Comparison selections were kept.`)
    requestAnimationFrame(() => { document.getElementById('career-controls')?.scrollIntoView({ block: 'start', behavior: 'instant' }); document.getElementById('results-heading')?.focus({ preventScroll: true }) })
  }
  const changePage = (page: number) => {
    update({ page })
    document.getElementById('career-list')?.scrollIntoView({ block: 'start', behavior: 'instant' })
  }

  return <section className={`explorer-section ${selected.length && page === 'careers' ? 'has-comparison' : ''}`} data-page={page} aria-labelledby={overview ? 'explorer-title' : page === 'careers' ? 'career-page-title' : 'field-comparison-title'} inert={!interactive} aria-hidden={hidden}>
    <div className="explorer-stage">
      <div className={`content-page ${overview ? 'overview-page' : 'career-workspace'}`} key={page} data-motion={pageTransition.phase} inert={pageTransition.phase === 'out'}>
        <div className="page-topline">
          <div className="page-identity"><a className="page-link home-link" href={`${window.location.search}#top`} aria-label="Home, return to launch screen" onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onHome() } }}>Home</a><p className="section-kicker">{overview ? "CANADA'S WORKFORCE, IN ONE VIEW" : 'CANAGI / RESEARCH'}</p></div>
          <nav className="page-navigation" aria-label="Primary navigation">
            <NavigationLinks page={page} onNavigate={navigate} darkMode={darkMode} onThemeToggle={onThemeToggle} />
          </nav>
        </div>

        {overview ? <header className="explorer-heading">
          <div className="explorer-art" aria-hidden="true"><img src="/assets/canada-workforce.webp" alt="" width="1672" height="941" /></div>
          <div className="explorer-copy">
            <h2 id="explorer-title" tabIndex={-1}>
              <span className="heading-line"><AnimatedText text="Canadian Job" delay={80} duration={350} /></span>
              <span className="heading-line"><AnimatedText text="Market Visualizer" delay={210} duration={420} /></span>
            </h2>
            <p className="explorer-description"><AnimatedText text="516 occupations. One connected view of Canadian work. Compare employment, annualized wages, training pathways, projected demand and explainable AI exposure." delay={380} duration={550} /></p>
            <p className="source-line"><AnimatedText text="516 occupations · Employment base 2023 · Wage release November 2025" delay={610} duration={450} /></p>
            <p className="national-context">Latest national employment: <strong>{(DATA_RELEASE.national.jobs / 1000000).toFixed(2)}M</strong> · August 2026, seasonally adjusted. This newer total is not used to size individual tiles.</p>
            <button className="text-button header-methodology" id="methodology" type="button" onClick={showMethodology}><AnimatedText text="About the data & its limits" delay={950} duration={250} /><ArrowRight size={13} /></button>
          </div>
        </header> : page === 'careers' ? <header className="career-page-heading research-heading">
          <div><p className="research-eyebrow">THE WORK BEHIND THE NUMBERS</p><h2 id="career-page-title" tabIndex={-1}><AnimatedText text="The Career Explorer." delay={80} duration={400} /></h2>
          <p>Find and compare occupations by pay, pathways, demand and AI exposure.</p></div>
          <div className="research-heading-note"><span>516 OCCUPATIONS / CANADA</span><p>Wages: November 2025 release<br />Activity profiles: OaSIS 2025</p><button className="text-button" type="button" onClick={showMethodology}>Sources & methodology <ArrowRight size={14} /></button></div>
        </header> : null}

        {error ? <div className="data-state" role="alert"><h3>The occupation data did not load.</h3><p>Refresh the page to try again.</p><button className="secondary-button" type="button" onClick={() => window.location.reload()}>Try again</button></div>
          : !data.length ? <div className="data-state loading" role="status"><span /><p>Loading Canada's occupation data</p></div>
          : page === 'fields' ? <FieldComparison data={data} selected={state.fieldCompare} onChange={fieldCompare => update({ fieldCompare })} onExplore={exploreField} onMethodology={showMethodology} />
          : <>
            {!overview && <>
              <ExplorerControls state={state} onChange={patch => { if (patch.view && patch.view !== state.view) viewTransition.run(() => update(patch)); else update(patch); setAnnouncement('') }} count={matching.length} total={data.length} onMethodology={showMethodology} />
              {announcement && <div className="drill-announcement" role="status">{announcement}<button type="button" className="text-button" onClick={() => setAnnouncement('')}>Dismiss</button></div>}
              <div className="results-heading"><h3 id="results-heading" tabIndex={-1}>{state.fields.length === 1 ? FIELD_DEFINITIONS.find(f => f[0] === state.fields[0])?.[1] ?? 'Selected results' : 'Your selected occupations'}</h3></div>
            </>}
            <div className="market-results" data-motion={viewTransition.phase} inert={viewTransition.phase === 'out'}>
              {(overview || state.view === 'treemap') && <LayerControls layer={state.layer} onChange={layer => update({ layer })} />}
              {overview && <p className="pay-disclaimer">Pay: published medians, annualized where hourly. AI: experimental relative index, not job loss probability. <button className="text-button" type="button" onClick={showMethodology}>Sources & limitations</button></p>}
              {visibleData.length === 0 ? <div className="empty-results" role="status"><span className="utility-label">NO MATCHES</span><h3>A different starting point?</h3><p>No occupations match all these filters. Try widening a range or removing a selection. Your criteria have not been changed.</p><button className="secondary-button" type="button" onClick={() => update({ ...emptyFilters(), page: 1 })}><RotateCcw size={16} />Clear all filters</button></div> : <>
                {overview ? <StatsGrid layer={state.layer} data={visibleData} /> : <CareerSummary data={visibleData} />}
                {!overview && state.view === 'list' ? <CareerList data={matching} sort={state.sort} layer={state.layer} page={state.page} compared={state.compared} onSort={sort => update({ sort, page: 1 })} onPage={changePage} onSelect={openDetail} onCompare={toggleCompare} /> : <>
                  {sizedCount < visibleData.length && <div className={overview ? 'overview-coverage' : 'coverage-notice'}><p><strong>{visibleData.length - sizedCount} {overview ? '' : 'matching '}occupations have no employment size.</strong> {overview ? 'They are available in the Career Explorer list.' : 'They remain in List and the matching count, but cannot be sized on the treemap.'}</p>{!overview && <button className="text-button" type="button" onClick={() => update({ view: 'list' })}>View all in List <ArrowRight size={14} /></button>}</div>}
                  {sizedCount > 0 && <OccupationTreemap layer={state.layer} data={visibleData} onSelect={openDetail} />}
                </>}
              </>}
            </div>
          </>}
        <footer className="site-footer"><p>CANAGI · A clearer view of Canada's working future</p><a href="https://github.com/ranbysal/CANAGI" target="_blank" rel="noreferrer">View source <ExternalLink size={13} /></a></footer>
      </div>
    </div>
    {interactive && page === 'careers' && <ComparisonTray selected={selected} matching={matchingIds} onRemove={toggleCompare} onClear={() => update({ compared: [] })} onOpen={() => update({ detail: null, comparison: true }, true)} />}
    {interactive && detail && <OccupationDetails item={detail} compared={state.compared} onCompare={toggleCompare} onClose={closeOverlay} />}
    {interactive && state.comparison && selected.length >= 2 && <OccupationComparison items={selected} onClose={closeOverlay} />}
    {interactive && methodology && <MethodologyPanel onClose={() => setMethodology(false)} count={data.length} employed={data.filter(d => d.jobs != null).length} />}
  </section>
}
