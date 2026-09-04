import { useMemo } from 'react'
import { getMetricCards } from '../lib/metrics'
import type { Layer, MetricCardData, Occupation } from '../types'

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
          <span className="distribution-value">{item.display}</span>
          <i style={{ height: `${Math.max(4, (item.value / max) * 48)}px`, background: item.color }} />
          <span className="distribution-label">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function MetricCard({ card }: { card: MetricCardData }) {
  return (
    <article className={`metric-card ${card.rows ? 'with-rows' : ''}`}>
      <h3>{card.title}</h3>
      {card.value && <p className="metric-value" style={{ color: card.accent }}>{card.value}</p>}
      {card.note && <p className="metric-note">{card.note}</p>}
      {card.chart && <DistributionChart card={card} />}
      {card.rows && (
        <div className="metric-rows">
          {card.rows.map((row) => (
            <div className="metric-row" key={row.label}>
              <span className="metric-row-label">
                {row.color && <i style={{ background: row.color }} aria-hidden="true" />}
                {row.label}
              </span>
              {row.bar != null && (
                <span className="metric-row-bar" aria-hidden="true">
                  <i style={{ width: `${Math.max(3, row.bar)}%`, background: row.color }} />
                </span>
              )}
              <strong>{row.value}</strong>
              {row.share && <small>{row.share}</small>}
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
      {cards.map((card) => <MetricCard card={card} key={card.title} />)}
    </div>
  )
}
