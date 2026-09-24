import type { CSSProperties } from 'react'
import type { EntryScene } from '../lib/entrySequence'
import type { Mosaic } from '../lib/mosaicLayout'
import { formatCompact } from '../lib/format'

const percent = (value: number) => `${(value * 100).toFixed(4)}%`

/**
 * Canada's workforce as ten fields, covering the screen between pages. Tiles
 * fill in over the matching WebGL dots, then fold away to reveal the next page.
 */
export function StageShutter({ scene, mosaic }: { scene: EntryScene; mosaic: Mosaic }) {
  const active = scene === 'leaving' || scene === 'entering' || scene === 'returning' || scene === 'arriving'
  const real = mosaic.jobs > 1000
  return (
    <div className="stage-shutter" data-scene={scene} hidden={!active} aria-hidden="true">
      {mosaic.tiles.map((tile, index) => (
        <i
          key={index}
          style={{ left: percent(tile.u), top: percent(tile.v), width: percent(tile.w), height: percent(tile.h), background: tile.color, '--order': tile.order.toFixed(3) } as CSSProperties}
        />
      ))}
      {real && mosaic.fields.map(field => (
        <p
          className="shutter-field"
          key={field.id}
          style={{ left: percent(field.u), top: percent(field.v), width: percent(field.w), height: percent(field.h), color: field.ink, '--order': ((field.u + field.v) / 2).toFixed(3) } as CSSProperties}
        >
          <span><b>{field.name}</b><small>{(field.share * 100).toFixed(1)}% of jobs</small></span>
        </p>
      ))}
      {real && <p className="shutter-caption"><span>{formatCompact(mosaic.jobs)} jobs</span><span>{mosaic.fields.length} fields</span><span>Coloured by relative AI exposure</span></p>}
    </div>
  )
}
