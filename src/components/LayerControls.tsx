import type { Layer } from '../types'
import { LAYER_LABELS, MAP_PALETTE, PAY_COLORS, OUTLOOK_COLORS, TEER_COLORS } from '../lib/format'
import { AnimatedText } from './AnimatedText'

interface LayerControlsProps {
  layer: Layer
  onChange: (layer: Layer) => void
}

const layers = Object.keys(LAYER_LABELS) as Layer[]

export function LayerControls({ layer, onChange }: LayerControlsProps) {
  const legend = {
    outlook: ['Surplus', 'Shortage'],
    pay: ['$25K', '$150K+'],
    education: ['TEER categories', 'Not a school duration scale'],
    exposure: ['Low', 'High'],
  }[layer]

  return (
    <div className="layer-bar">
      <div>
        <p className="control-label"><AnimatedText text="Layer" delay={560} duration={100} /></p>
        <div className="layer-buttons" role="group" aria-label="Choose a data layer">
          {layers.map((item, index) => (
            <button
              className={item === layer ? 'active' : ''}
              type="button"
              key={item}
              aria-pressed={item === layer}
              onClick={() => onChange(item)}
            >
              <AnimatedText text={LAYER_LABELS[item]} delay={610 + index * 70} duration={220} />
            </button>
          ))}
        </div>
      </div>
      {layer === 'education' ? <div className="teer-legend" aria-label="TEER category colours">{TEER_COLORS.map((color, index) => <span key={color}><i style={{ background: color }} />{index}</span>)}</div> : <div className={`color-legend ${layer}`} aria-label={`${legend[0]} to ${legend[1]}`}>
        <span><AnimatedText text={legend[0]} delay={900} duration={130} /></span>
        <span className="palette-legend" aria-hidden="true">{layer === 'outlook' ? OUTLOOK_COLORS.map((color, index) => <i key={color} style={{ background: color }} title={['Strong surplus', 'Moderate surplus', 'Balance', 'Moderate shortage', 'Strong shortage'][index]} />) : <i style={{ background: `linear-gradient(to right, ${(layer === 'pay' ? PAY_COLORS : MAP_PALETTE).join(', ')})` }} />}</span>
        <span><AnimatedText text={legend[1]} delay={980} duration={130} /></span>
      </div>}
    </div>
  )
}
