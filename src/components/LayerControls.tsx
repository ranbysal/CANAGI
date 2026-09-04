import type { Layer } from '../types'
import { LAYER_LABELS } from '../lib/format'

interface LayerControlsProps {
  layer: Layer
  onChange: (layer: Layer) => void
}

const layers = Object.keys(LAYER_LABELS) as Layer[]

export function LayerControls({ layer, onChange }: LayerControlsProps) {
  const legend = {
    outlook: ['Surplus', 'Shortage'],
    pay: ['$25K', '$150K+'],
    education: ['No degree', 'University+'],
    exposure: ['Low', 'High'],
  }[layer]

  return (
    <div className="layer-bar">
      <div>
        <p className="control-label">Layer</p>
        <div className="layer-buttons" role="group" aria-label="Choose a data layer">
          {layers.map((item) => (
            <button
              className={item === layer ? 'active' : ''}
              type="button"
              key={item}
              aria-pressed={item === layer}
              onClick={() => onChange(item)}
            >
              {LAYER_LABELS[item]}
            </button>
          ))}
        </div>
      </div>
      <div className={`color-legend ${layer}`} aria-label={`${legend[0]} to ${legend[1]}`}>
        <span>{legend[0]}</span>
        <i aria-hidden="true" />
        <span>{legend[1]}</span>
      </div>
    </div>
  )
}
