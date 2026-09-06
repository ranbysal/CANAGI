import { useMemo, type CSSProperties } from 'react'
import { getMetricCards } from '../lib/metrics'
import type { Layer, MetricCardData, Occupation } from '../types'
import { AnimatedText } from './AnimatedText'

interface StatsGridProps {
  layer: Layer
  data: Occupation[]
}

function DistributionChart({ card }: { card: MetricCardData }) {
  const max = Math.max(...(card.chart?.map((item) => item.value) ?? [1]), 1)
  return (
    <div className="distribution-chart" aria-label={card.title}>
      {card.chart?.map((item) => (
        <div className="distribution-column" key={item.label} title={`${item.label}: ${item.display}`}>
          <span className="distribution-value"><AnimatedText text={item.display} duration={180} /></span>
          <i style={{ height: `${Math.max(4, (item.value / max) * 48)}px`, background: item.color }} />
          <span className="distribution-label"><AnimatedText text={item.label} duration={230} /></span>
        </div>
      ))}
    </div>
  )
}

function MetricCard({ card, index }: { card: MetricCardData; index: number }) {
  return (
    <article
      className={`metric-card ${card.rows ? 'with-rows' : ''}`}
      style={{ '--metric-index': index } as CSSProperties}
    >
      <h3><AnimatedText text={card.title} duration={210} /></h3>
      {card.value && <p className="metric-value" style={{ color: card.accent }}><AnimatedText text={card.value} duration={190} /></p>}
      {card.note && <p className="metric-note"><AnimatedText text={card.note} duration={340} /></p>}
      {card.chart && <DistributionChart card={card} />}
      {card.rows && (
        <div className="metric-rows">
          {card.rows.map((row) => (
            <div className="metric-row" key={row.label}>
              <span className="metric-row-label">
                {row.color && <i style={{ background: row.color }} aria-hidden="true" />}
                <AnimatedText text={row.label} duration={210} />
              </span>
              {row.bar != null && (
                <span className="metric-row-bar" aria-hidden="true">
                  <i style={{ width: `${Math.max(3, row.bar)}%`, background: row.color }} />
                </span>
              )}
              <strong><AnimatedText text={row.value} duration={180} /></strong>
              {row.share && <small><AnimatedText text={row.share} duration={180} /></small>}
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

export function StatsGrid({ layer, data }: StatsGridProps) {
  const cards = useMemo(() => getMetricCards(layer, data), [layer, data])
  return (
    <div className="stats-grid" aria-live="polite">
      {cards.map((card, index) => <MetricCard card={card} index={index} key={card.title} />)}
    </div>
  )
}
