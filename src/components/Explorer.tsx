import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import type { Layer, Occupation } from '../types'
import { LayerControls } from './LayerControls'
import { OccupationTreemap } from './OccupationTreemap'
import { StatsGrid } from './StatsGrid'
import { AnimatedText } from './AnimatedText'

export function Explorer({ interactive, hidden }: { interactive: boolean; hidden: boolean }) {
  const [layer, setLayer] = useState<Layer>('exposure')
  const [data, setData] = useState<Occupation[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/data/occupations.json')
      .then((response) => {
        if (!response.ok) throw new Error('Occupation data could not be loaded')
        return response.json() as Promise<Occupation[]>
      })
      .then((occupations) => {
        if (active) setData(occupations)
      })
      .catch(() => {
        if (active) setError(true)
      })
    return () => { active = false }
  }, [])

  return (
    <section className="explorer-section" id="explore" aria-labelledby="explorer-title" inert={!interactive} aria-hidden={hidden}>
      <div className="explorer-stage">
        <div className="explorer-heading">
          <div className="explorer-copy">
            <p className="section-kicker"><AnimatedText text="CANADA'S WORKFORCE, IN ONE VIEW" delay={20} duration={280} /></p>
            <h2 id="explorer-title" tabIndex={-1}>
              <span className="heading-line"><AnimatedText text="Canadian Job" delay={80} duration={350} /></span>
              <span className="heading-line"><AnimatedText text="Market Visualizer" delay={210} duration={420} /></span>
            </h2>
            <p className="explorer-description">
              <AnimatedText text="Explore 515 occupations spanning more than 20 million jobs. Tile size represents employment, while colour changes with the selected layer. Compare projected labour demand, median pay, typical education, and estimated AI task exposure." delay={380} duration={650} />
            </p>
            <p className="source-line" id="methodology" tabIndex={-1}>
              <strong><AnimatedText text="Data sources:" delay={610} duration={90} /></strong>{' '}
              <AnimatedText text="Employment and wages from " delay={690} duration={120} />
              <a href="https://open.canada.ca/" target="_blank" rel="noreferrer"><AnimatedText text="Open Canada" delay={800} duration={70} /></a>{' '}
              <AnimatedText text="(2023–2025), outlook from " delay={860} duration={110} />
              <a href="https://occupations.esdc.gc.ca/" target="_blank" rel="noreferrer"><AnimatedText text="COPS" delay={960} duration={55} /></a>{' '}
              <AnimatedText text="(2024–2033), and education requirements from NOC 2021 TEER." delay={1000} duration={200} />
            </p>
            <details className="methodology-note">
              <summary><AnimatedText text="How to interpret Digital AI Exposure" delay={950} duration={250} /></summary>
              <p>
                Exposure is a rough task-level estimate, not a prediction that a job will disappear. High-scoring occupations may be transformed or become more productive. The score does not model demand growth, regulation, adoption speed, or preference for human work.
              </p>
            </details>
          </div>
          <div className="explorer-art" aria-hidden="true">
            <img src="/assets/canada-workforce.webp" alt="" width="1672" height="941" />
          </div>
        </div>

        {error ? (
          <div className="data-state" role="alert">
            <h3>The occupation data did not load.</h3>
            <p>Refresh the page to try again.</p>
          </div>
        ) : data.length === 0 ? (
          <div className="data-state loading" aria-live="polite">
            <span />
            <p>Loading Canada&apos;s occupation data</p>
          </div>
        ) : (
          <>
            <LayerControls layer={layer} onChange={setLayer} />
            <StatsGrid layer={layer} data={data} />
            <OccupationTreemap layer={layer} data={data} />
          </>
        )}

        <footer className="site-footer">
          <p><AnimatedText text="CANAGI · Canada's AI job economy" delay={1850} duration={350} /></p>
          <a href="https://github.com/ranbysal/CANAGI" target="_blank" rel="noreferrer">
            <AnimatedText text="View source" delay={1980} duration={220} /> <ExternalLink size={13} />
          </a>
        </footer>
      </div>
    </section>
  )
}
