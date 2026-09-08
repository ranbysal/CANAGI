import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { hierarchy, treemap } from 'd3-hierarchy'
import { ArrowUpRight } from 'lucide-react'
import { createPortal } from 'react-dom'
import { placeTooltip, type Rectangle } from '../lib/tooltipPlacement'
import { exposureExplanation, layerColor, metricLabel, tileTextColor } from '../lib/format'
import type { Layer, Occupation } from '../types'
import { tileEntryDelay } from '../lib/entrySequence'
import { AnimatedText } from './AnimatedText'
import { employmentValue, outlookOf, publishedWage } from '../lib/careers'

interface OccupationTreemapProps {
  data: Occupation[]
  layer: Layer
  onSelect: (id: string) => void
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
  tile: Rectangle
}

function isOccupation(value: TreeDatum): value is Occupation {
  return 'noc_code' in value
}

export function OccupationTreemap({ data, layer, onSelect }: OccupationTreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipSize, setTooltipSize] = useState({ width: 320, height: 240 })
  const [width, setWidth] = useState(1200)
  const [hovered, setHovered] = useState<HoverState | null>(null)
  const height = width < 680 ? 820 : Math.max(610, Math.min(760, width * 0.54))

  useLayoutEffect(() => {
    if (!hovered || !tooltipRef.current) return
    const measure = () => {
      const rect = tooltipRef.current?.getBoundingClientRect()
      if (rect) setTooltipSize(current => current.width === rect.width && current.height === rect.height ? current : { width: rect.width, height: rect.height })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(tooltipRef.current)
    const dismiss = () => setHovered(null)
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss() }
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    window.addEventListener('keydown', onKey)
    return () => { observer.disconnect(); window.removeEventListener('scroll', dismiss, true); window.removeEventListener('resize', dismiss); window.removeEventListener('keydown', onKey) }
  }, [hovered?.occupation.noc_code])

  useLayoutEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(1, entry.contentRect.width)))
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
        <svg className="treemap" viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`Treemap of ${leaves.length} matching occupations coloured by ${layer}`}>
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
                href={`?career=${occupation.noc_code}#explore`}
                onClick={(event) => { event.preventDefault(); event.currentTarget.focus({ preventScroll: true }); setHovered(null); onSelect(occupation.noc_code) }}
                aria-label={`${occupation.title}. ${metricLabel(layer, occupation)}. View career details.`}
                key={occupation.noc_code}
                style={{
                  '--tile-delay': `${delay}ms`,
                  '--text-delay': `${delay + 190}ms`,
                  '--char-step': '14ms',
                  '--tile-ink': tileTextColor(layerColor(layer, occupation)),
                } as CSSProperties}
                onPointerMove={(event) => {
                  if (event.pointerType === 'touch') return
                  const rect = event.currentTarget.getBoundingClientRect()
                  setHovered({ occupation, x: event.clientX, y: event.clientY, tile: { left: rect.left, top: rect.top, width: rect.width, height: rect.height } })
                }}
                onFocus={event => { const rect = event.currentTarget.getBoundingClientRect(); setHovered({ occupation, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, tile: { left: rect.left, top: rect.top, width: rect.width, height: rect.height } }) }}
                onBlur={() => setHovered(null)}
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
        {hovered && createPortal(
          <div
            ref={tooltipRef}
            className="treemap-tooltip"
            role="tooltip"
            style={placeTooltip(hovered, hovered.tile, tooltipSize, { width: document.documentElement.clientWidth, height: window.innerHeight })}
          >
            <p className="tooltip-code">NOC {hovered.occupation.noc_code}</p>
            <h3>{hovered.occupation.title}</h3>
            <dl>
              <div><dt>Employment · 2023</dt><dd>{employmentValue(hovered.occupation.jobs)}</dd></div>
              <div><dt>Published median wage</dt><dd>{publishedWage(hovered.occupation)}</dd></div>
              <div><dt>2024 to 2033</dt><dd>{outlookOf(hovered.occupation).label}</dd></div>
              <div><dt>Relative AI index</dt><dd>{hovered.occupation.exposure ?? 'N/A'}/10</dd></div>
            </dl>
            <p className="tooltip-rationale">{exposureExplanation(hovered.occupation)}</p>
            <span className="tooltip-link">View career details <ArrowUpRight size={12} /></span>
          </div>, document.body
        )}
      </div>
      <figcaption><AnimatedText text={`Tile area represents covered 2023 employment, not vacancies. ${leaves.length} matching occupations shown. Select a tile for career details; Career Explorer's List includes every occupation.`} delay={1800} duration={400} /></figcaption>
    </figure>
  )
}
