import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { hierarchy, treemap } from 'd3-hierarchy'
import { ExternalLink } from 'lucide-react'
import { exposureExplanation, layerColor, metricLabel } from '../lib/format'
import type { Layer, Occupation } from '../types'
import { tileEntryDelay } from '../lib/entrySequence'
import { AnimatedText } from './AnimatedText'

interface OccupationTreemapProps {
  data: Occupation[]
  layer: Layer
}

interface CategoryDatum {
  name: string
  children: Occupation[]
}

interface RootDatum {
  name: string
  children: CategoryDatum[]
}

type TreeDatum = RootDatum | CategoryDatum | Occupation

interface HoverState {
  occupation: Occupation
  x: number
  y: number
}

function isOccupation(value: TreeDatum): value is Occupation {
  return 'noc_code' in value
}

function nocUrl(code: string) {
  return `https://noc.esdc.gc.ca/Structure/NOCProfile?GocTemplateCulture=en-CA&code=${code}&version=2021.0`
}

export function OccupationTreemap({ data, layer }: OccupationTreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(1200)
  const [hovered, setHovered] = useState<HoverState | null>(null)
  const height = width < 680 ? 820 : Math.max(610, Math.min(760, width * 0.54))

  useLayoutEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(320, entry.contentRect.width)))
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const leaves = useMemo(() => {
    const categories = new Map<string, Occupation[]>()
    data.filter((item) => item.jobs && item.jobs > 0).forEach((item) => {
      const items = categories.get(item.category) ?? []
      items.push(item)
      categories.set(item.category, items)
    })
    const rootDatum: RootDatum = {
      name: 'Canada',
      children: Array.from(categories, ([name, children]) => ({ name, children })),
    }
    const root = hierarchy<TreeDatum>(rootDatum)
      .sum((item) => isOccupation(item) ? item.jobs ?? 0 : 0)
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    const layout = treemap<TreeDatum>()
      .size([width, height])
      .paddingInner(1.25)
      .paddingOuter(0)
      .paddingTop((node) => node.depth === 1 ? 2.5 : 0)
      .round(true)
    return layout(root).leaves().flatMap((leaf) => (
      isOccupation(leaf.data) ? [{ leaf, occupation: leaf.data }] : []
    ))
  }, [data, height, width])

  return (
    <figure className="treemap-figure">
      <div className="treemap-shell" ref={containerRef} onPointerLeave={() => setHovered(null)}>
        <svg className="treemap" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Treemap of Canadian occupations colored by ${layer}`}>
          {leaves.map(({ leaf, occupation }) => {
            const tileWidth = Math.max(0, leaf.x1 - leaf.x0)
            const tileHeight = Math.max(0, leaf.y1 - leaf.y0)
            const showLabel = tileWidth > 54 && tileHeight > 24
            const showMetric = tileWidth > 82 && tileHeight > 46
            const showWord = !showLabel && tileWidth > 22 && tileHeight > 12
            const showInitial = !showLabel && !showWord && tileWidth > 6 && tileHeight > 7
            const firstWord = occupation.title.split(/\s+/)[0]
            const wordFontSize = Math.max(5, Math.min(8, tileHeight * 0.48))
            const wordCapacity = Math.max(1, Math.floor((tileWidth - 6) / (wordFontSize * 0.62)))
            const compactWord = firstWord.slice(0, wordCapacity)
            const delay = tileEntryDelay(leaf.x0, leaf.y0, width, height)
            return (
              <a
                className="treemap-cell"
                href={nocUrl(occupation.noc_code)}
                target="_blank"
                rel="noreferrer"
                aria-label={`${occupation.title}. ${metricLabel(layer, occupation)}. Open NOC profile.`}
                key={occupation.noc_code}
                style={{
                  '--tile-delay': `${delay}ms`,
                  '--text-delay': `${delay + 190}ms`,
                  '--char-step': '14ms',
                } as CSSProperties}
                onPointerMove={(event) => {
                  if (event.movementX === 0 && event.movementY === 0) return
                  const rect = containerRef.current?.getBoundingClientRect()
                  if (rect) {
                    setHovered((current) => current?.occupation.noc_code === occupation.noc_code
                      ? current
                      : { occupation, x: event.clientX - rect.left, y: event.clientY - rect.top })
                  }
                }}
              >
                <rect
                  x={leaf.x0}
                  y={leaf.y0}
                  width={tileWidth}
                  height={tileHeight}
                  fill={layerColor(layer, occupation)}
                  className="treemap-tile"
                />
                {showLabel && (
                  <foreignObject x={leaf.x0 + 4} y={leaf.y0 + 4} width={Math.max(0, tileWidth - 8)} height={Math.max(0, tileHeight - 8)} pointerEvents="none">
                    <div className={`tile-label ${tileWidth < 78 || tileHeight < 38 ? 'tile-label--compact' : ''}`}>
                      <strong><AnimatedText text={occupation.title} duration={220} limit={60} /></strong>
                      {showMetric && <span><AnimatedText text={metricLabel(layer, occupation)} duration={180} /></span>}
                    </div>
                  </foreignObject>
                )}
                {showWord && (
                  <text
                    className="tile-word"
                    x={leaf.x0 + 3}
                    y={leaf.y0 + Math.min(tileHeight - 3, 10)}
                    fontSize={wordFontSize}
                    pointerEvents="none"
                  >
                    {Array.from(compactWord).map((letter, index) => <tspan className="animated-char" style={{ '--char-index': index } as CSSProperties} key={index}>{letter}</tspan>)}
                  </text>
                )}
                {showInitial && (
                  <text
                    className="tile-initial"
                    x={leaf.x0 + tileWidth / 2}
                    y={leaf.y0 + tileHeight / 2}
                    fontSize={Math.max(3.5, Math.min(7, tileWidth * 0.5, tileHeight * 0.62))}
                    textAnchor="middle"
                    dominantBaseline="central"
                    pointerEvents="none"
                  >
                    <tspan className="animated-char" style={{ '--char-index': 0 } as CSSProperties}>{occupation.title.charAt(0)}</tspan>
                  </text>
                )}
              </a>
            )
          })}
        </svg>
        {hovered && (
          <div
            className="treemap-tooltip"
            role="status"
            style={{
              left: Math.min(Math.max(8, hovered.x + 16), Math.max(8, width - 330)),
              top: Math.min(Math.max(8, hovered.y + 16), height - 210),
            }}
          >
            <p className="tooltip-code">NOC {hovered.occupation.noc_code}</p>
            <h3>{hovered.occupation.title}</h3>
            <dl>
              <div><dt>Jobs</dt><dd>{(hovered.occupation.jobs ?? 0).toLocaleString('en-CA')}</dd></div>
              <div><dt>Median pay</dt><dd>{hovered.occupation.pay ? `$${hovered.occupation.pay.toLocaleString('en-CA')}` : 'N/A'}</dd></div>
              <div><dt>Outlook</dt><dd>{hovered.occupation.outlook == null ? 'N/A' : `${hovered.occupation.outlook > 0 ? '+' : ''}${hovered.occupation.outlook}%`}</dd></div>
              <div><dt>AI exposure</dt><dd>{hovered.occupation.exposure ?? 'N/A'}/10</dd></div>
            </dl>
            <p className="tooltip-rationale">{exposureExplanation(hovered.occupation)}</p>
            <span className="tooltip-link">Open official profile <ExternalLink size={12} /></span>
          </div>
        )}
      </div>
      <figcaption><AnimatedText text="Tile area represents employment. Select any occupation to open its official NOC profile." delay={1800} duration={400} /></figcaption>
    </figure>
  )
}
