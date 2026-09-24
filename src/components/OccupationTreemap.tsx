import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { hierarchy, treemap } from 'd3-hierarchy'
import { ArrowUpRight } from 'lucide-react'
import { createPortal } from 'react-dom'
import { placeTooltip, type Rectangle } from '../lib/tooltipPlacement'
import { exposureExplanation, formatCompact, layerColor, metricLabel, tileTextColor } from '../lib/format'
import type { Layer, Occupation } from '../types'
import { tileEntryDelay, tileSweep } from '../lib/entrySequence'
import { AnimatedText } from './AnimatedText'
import { employmentValue, FIELD_DEFINITIONS, fieldOf, outlookOf, publishedWage } from '../lib/careers'

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

interface Box { x: number; y: number; width: number; height: number }
interface Category extends Box { index: number; name: string; jobs: number; count: number }

function isOccupation(value: TreeDatum): value is Occupation {
  return 'noc_code' in value
}

const RELAYOUT_MS = 760
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function OccupationTreemap({ data, layer, onSelect }: OccupationTreemapProps) {
  const figureRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hoverSession = useRef(0)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [tooltipSize, setTooltipSize] = useState({ width: 320, height: 240 })
  const [width, setWidth] = useState(1200)
  const [hovered, setHovered] = useState<HoverState | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [settled, setSettled] = useState(false)
  const [relayout, setRelayout] = useState(false)
  const [sweep, setSweep] = useState(0)
  const previous = useRef<{ data: Occupation[]; layer: Layer; ids: Set<string> } | null>(null)
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

  // The map unfolds the first time it scrolls into view, then stays still.
  useEffect(() => {
    const figure = figureRef.current
    if (!figure) return
    if (reducedMotion()) { setRevealed(true); setSettled(true); return }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setRevealed(true); observer.disconnect() }
    }, { threshold: 0.08 })
    observer.observe(figure)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!revealed || settled) return
    const timer = window.setTimeout(() => setSettled(true), 2400)
    return () => window.clearTimeout(timer)
  }, [revealed, settled])

  const layout = useMemo(() => {
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
    const laid = treemap<TreeDatum>()
      .size([width, height])
      .paddingInner(1.25)
      .paddingOuter(0)
      .paddingTop((node) => node.depth === 1 ? 2.5 : 0)
      .round(true)(root)
    const fields: Category[] = (laid.children ?? []).map(node => {
      const first = (node.data as CategoryDatum).children[0]
      const field = first ? fieldOf(first) : undefined
      return {
        index: field ? Number(field[0]) : 0, name: field?.[1] ?? (node.data as CategoryDatum).name, jobs: node.value ?? 0, count: node.leaves().length,
        x: node.x0, y: node.y0, width: node.x1 - node.x0, height: node.y1 - node.y0,
      }
    })
    const leaves = laid.leaves().flatMap((leaf) => {
      if (!isOccupation(leaf.data)) return []
      const field = fieldOf(leaf.data)
      return [{ occupation: leaf.data, category: field ? Number(field[0]) : 0, x: leaf.x0, y: leaf.y0, width: Math.max(0, leaf.x1 - leaf.x0), height: Math.max(0, leaf.y1 - leaf.y0) }]
    })
    return { fields, leaves, byId: new Map(leaves.map(leaf => [leaf.occupation.noc_code, leaf])) }
  }, [data, height, width])

  // New data (not a resize) glides tiles to their new places; a new layer sweeps colour across.
  const ids = useMemo(() => new Set(layout.leaves.map(leaf => leaf.occupation.noc_code)), [layout])
  useLayoutEffect(() => {
    const last = previous.current
    previous.current = { data, layer, ids }
    if (!last || reducedMotion()) return
    if (last.layer !== layer) setSweep(value => value + 1)
    if (last.data !== data) {
      setRelayout(true)
      const timer = window.setTimeout(() => setRelayout(false), RELAYOUT_MS)
      return () => window.clearTimeout(timer)
    }
  }, [data, layer, ids])

  const show = (tileWidth: number, tileHeight: number) => {
    const label = tileWidth > 54 && tileHeight > 24
    const word = !label && tileWidth > 22 && tileHeight > 12
    return { label, metric: tileWidth > 82 && tileHeight > 46, word, initial: !label && !word && tileWidth > 6 && tileHeight > 7 }
  }

  // Geometry lives in SVG; every piece of text lives in one HTML layer above it,
  // so colour sweeps and hovering never re-rasterize hundreds of text boxes.
  const tiles = useMemo(() => {
    // Occupations that were not on the last committed map unfold into their space.
    const before = previous.current?.data !== data ? previous.current?.ids : undefined
    return layout.leaves.map(({ occupation, x, y, width: tileWidth, height: tileHeight }) => {
      const fill = layerColor(layer, occupation)
      const place = (event: { currentTarget: Element }, pointer?: { x: number; y: number }) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const next = { occupation, x: pointer?.x ?? rect.left + rect.width / 2, y: pointer?.y ?? rect.top + rect.height / 2, tile: { left: rect.left, top: rect.top, width: rect.width, height: rect.height } }
        setHovered(current => { if (!current) hoverSession.current++; return next })
      }
      return (
        <a
          className="treemap-cell"
          href={`?career=${occupation.noc_code}#explore`}
          onClick={(event) => { event.preventDefault(); event.currentTarget.focus({ preventScroll: true }); setHovered(null); onSelect(occupation.noc_code) }}
          aria-label={`${occupation.title}. ${metricLabel(layer, occupation)}. View career details.`}
          key={occupation.noc_code}
          data-new={before && !before.has(occupation.noc_code) ? '' : undefined}
          style={{ '--tile-delay': `${tileEntryDelay(x, y, width, height)}ms`, '--sweep': `${Math.round(tileSweep(x, y, width, height) * 420)}ms` } as CSSProperties}
          onPointerMove={(event) => { if (event.pointerType !== 'touch') place(event, { x: event.clientX, y: event.clientY }) }}
          onFocus={event => place(event)}
          onBlur={() => setHovered(null)}
        >
          <rect x={x} y={y} width={tileWidth} height={tileHeight} style={{ x, y, width: tileWidth, height: tileHeight } as CSSProperties} fill={fill} className="treemap-tile" />
        </a>
      )
    })
  }, [layout, layer, width, height, onSelect, data])

  const labels = useMemo(() => layout.leaves.flatMap(({ occupation, x, y, width: tileWidth, height: tileHeight }) => {
    const visible = show(tileWidth, tileHeight)
    const style = { '--tile-ink': tileTextColor(layerColor(layer, occupation)), '--sweep': `${Math.round(tileSweep(x, y, width, height) * 420)}ms` } as CSSProperties
    if (visible.label) return [
      <div className={`tile-label ${tileWidth < 78 || tileHeight < 38 ? 'tile-label--compact' : ''}`} key={occupation.noc_code} style={{ ...style, left: x + 4, top: y + 4, width: tileWidth - 8, height: tileHeight - 8 }}>
        <strong>{occupation.title}</strong>
        {visible.metric && <span>{metricLabel(layer, occupation)}</span>}
      </div>,
    ]
    if (visible.word) {
      const fontSize = Math.max(5, Math.min(8, tileHeight * 0.48))
      const word = occupation.title.split(/\s+/)[0].slice(0, Math.max(1, Math.floor((tileWidth - 6) / (fontSize * 0.62))))
      return [<span className="tile-word" key={occupation.noc_code} style={{ ...style, left: x + 3, top: y + 1, width: tileWidth - 4, fontSize }}>{word}</span>]
    }
    if (visible.initial) return [<span className="tile-initial" key={occupation.noc_code} style={{ ...style, left: x, top: y, width: tileWidth, height: tileHeight, fontSize: Math.max(3.5, Math.min(7, tileWidth * 0.5, tileHeight * 0.62)) }}>{occupation.title.charAt(0)}</span>]
    return []
  }), [layout, layer, width, height])

  const focusLeaf = hovered ? layout.byId.get(hovered.occupation.noc_code) : undefined
  const focusField = focusLeaf ? layout.fields.find(field => field.index === focusLeaf.category) : undefined
  const total = layout.leaves.reduce((sum, leaf) => sum + (leaf.occupation.jobs ?? 0), 0)
  const figureClass = ['treemap-figure', revealed && 'is-revealed', settled && 'is-settled', relayout && 'is-relayout'].filter(Boolean).join(' ')

  return (
    <figure className={figureClass} ref={figureRef}>
      <p className="treemap-context" aria-hidden="true">
        <span className="treemap-context-inner" key={focusField?.index ?? 'all'}>
          {focusField
            ? <><b>{FIELD_DEFINITIONS.find(field => Number(field[0]) === focusField.index)?.[1] ?? focusField.name}</b><span>{formatCompact(focusField.jobs)} jobs</span><span>{focusField.count} occupations</span><span>{total ? `${((focusField.jobs / total) * 100).toFixed(1)}% of mapped employment` : ''}</span></>
            : <><b>{layout.fields.length} fields</b><span>{formatCompact(total)} jobs</span><span>Hover a tile to focus its field</span></>}
        </span>
      </p>
      <div className="treemap-shell" onPointerLeave={() => setHovered(null)}>
        <div className="treemap-plane" ref={containerRef}>
          <svg className="treemap" viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`Treemap of ${layout.leaves.length} matching occupations coloured by ${layer}`}>
            {tiles}
          </svg>
          <div className="treemap-labels" aria-hidden="true">{labels}</div>
          {focusField && focusLeaf && <>
            <div className="treemap-veil" key={`veil-${hoverSession.current}`} aria-hidden="true" style={{ clipPath: `polygon(evenodd, 0 0, ${width}px 0, ${width}px ${height}px, 0 ${height}px, 0 0, ${focusField.x}px ${focusField.y}px, ${focusField.x + focusField.width}px ${focusField.y}px, ${focusField.x + focusField.width}px ${focusField.y + focusField.height}px, ${focusField.x}px ${focusField.y + focusField.height}px, ${focusField.x}px ${focusField.y}px)` }} />
            <div className="treemap-field-ring" key={`field-${hoverSession.current}`} aria-hidden="true" style={{ transform: `translate3d(${focusField.x}px, ${focusField.y}px, 0)`, width: focusField.width, height: focusField.height }} />
            <div className="treemap-focus-ring" key={`tile-${hoverSession.current}`} aria-hidden="true" style={{ transform: `translate3d(${focusLeaf.x}px, ${focusLeaf.y}px, 0)`, width: focusLeaf.width, height: focusLeaf.height }} />
          </>}
        </div>
        {sweep > 0 && <span className="treemap-sheen" key={sweep} aria-hidden="true" />}
        {hovered && createPortal(
          <div
            ref={tooltipRef}
            className="treemap-tooltip"
            role="tooltip"
            style={(({ left, top }) => ({ transform: `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)` }))(placeTooltip(hovered, hovered.tile, tooltipSize, { width: document.documentElement.clientWidth, height: window.innerHeight }))}
          >
            <div className="tooltip-body" key={hovered.occupation.noc_code}>
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
            </div>
          </div>, document.body
        )}
      </div>
      <figcaption><AnimatedText text={`Tile area represents covered 2023 employment, not vacancies. ${layout.leaves.length} matching occupations shown. Select a tile for career details; Career Explorer's List includes every occupation.`} delay={1800} duration={400} /></figcaption>
    </figure>
  )
}
