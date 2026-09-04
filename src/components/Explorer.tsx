import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import type { Layer, Occupation } from '../types'
import { LayerControls } from './LayerControls'
import { OccupationTreemap } from './OccupationTreemap'
import { StatsGrid } from './StatsGrid'

export function Explorer() {
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
    <section className="explorer-section" id="explore" aria-labelledby="explorer-title">
      <div className="explorer-heading">
        <div className="explorer-copy">
          <p className="section-kicker">CANADA&apos;S WORKFORCE, IN ONE VIEW</p>
          <h2 id="explorer-title">Canadian Job<br />Market Visualizer</h2>
          <p>
            Explore 515 occupations spanning more than 20 million jobs. Tile size represents employment, while colour changes with the selected layer. Compare projected labour demand, median pay, typical education, and estimated AI task exposure.
          </p>
          <p className="source-line" id="methodology">
            <strong>Data sources:</strong> Employment and wages from <a href="https://open.canada.ca/" target="_blank" rel="noreferrer">Open Canada</a> (2023–2025), outlook from <a href="https://occupations.esdc.gc.ca/" target="_blank" rel="noreferrer">COPS</a> (2024–2033), and education requirements from NOC 2021 TEER.
          </p>
          <details className="methodology-note">
            <summary>How to interpret Digital AI Exposure</summary>
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
        <p>CANAGI · Canada&apos;s AI job economy</p>
        <a href="https://github.com/ranbysal/CANAGI" target="_blank" rel="noreferrer">
          View source <ExternalLink size={13} />
        </a>
      </footer>
    </section>
  )
}
