import { hierarchy, treemap, type HierarchyNode } from 'd3-hierarchy'
import type { Occupation } from '../types'
import { FIELD_DEFINITIONS, fieldOf } from './careers'
import { paletteColor, tileTextColor } from './format'

/** A rectangle in unit viewport space: u, w across; v, h down. */
interface UnitRect { u: number; v: number; w: number; h: number }
export interface MosaicTile extends UnitRect { color: string; order: number }
export interface MosaicField extends UnitRect { id: string; name: string; jobs: number; share: number; ink: string }
export interface Mosaic { aspect: number; tiles: MosaicTile[]; fields: MosaicField[]; jobs: number }

interface Part { jobs: number; exposure: number }
interface FieldSummary { id: string; name: string; jobs: number; parts: Part[] }
export interface MosaicSource { jobs: number; fields: FieldSummary[] }

// The largest occupations in each field keep their own tile; the rest share one.
const OWN_TILES = 4

const weightedExposure = (items: Occupation[]) => {
  const known = items.filter(item => item.exposure != null)
  const jobs = known.reduce((sum, item) => sum + item.jobs!, 0)
  return jobs ? known.reduce((sum, item) => sum + item.jobs! * item.exposure!, 0) / jobs : 5
}

/** Field and occupation employment, coloured by the default AI exposure layer. */
export function summarizeMosaic(data: Occupation[]): MosaicSource {
  const groups = new Map<string, Occupation[]>()
  for (const item of data) {
    const field = fieldOf(item)?.[0]
    if (!field || item.jobs == null || item.jobs <= 0) continue
    groups.set(field, [...(groups.get(field) ?? []), item])
  }
  const fields = FIELD_DEFINITIONS.flatMap(([id, name]) => {
    const items = [...(groups.get(id) ?? [])].sort((a, b) => b.jobs! - a.jobs!)
    if (!items.length) return []
    const own = items.slice(0, OWN_TILES), rest = items.slice(OWN_TILES)
    const parts = own.map(item => ({ jobs: item.jobs!, exposure: item.exposure ?? weightedExposure(items) }))
    if (rest.length) parts.push({ jobs: rest.reduce((sum, item) => sum + item.jobs!, 0), exposure: weightedExposure(rest) })
    return [{ id, name, jobs: items.reduce((sum, item) => sum + item.jobs!, 0), parts }]
  })
  return { jobs: fields.reduce((sum, field) => sum + field.jobs, 0), fields }
}

/** Equal fields in a neutral colour until the occupation data arrives. */
export const PLACEHOLDER_MOSAIC: MosaicSource = {
  jobs: FIELD_DEFINITIONS.length,
  fields: FIELD_DEFINITIONS.map(([id, name]) => ({ id, name, jobs: 1, parts: [{ jobs: 1, exposure: 5 }] })),
}

type Datum = { children?: Datum[]; field?: FieldSummary; part?: Part }

/** Shared by the WebGL mosaic and the DOM shutter so both land on identical rectangles. */
export function layoutMosaic(source: MosaicSource, aspect: number): Mosaic {
  const root = hierarchy<Datum>({ children: source.fields.map(field => ({ field, children: field.parts.map(part => ({ part })) })) })
    .sum(datum => datum.part?.jobs ?? 0)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  const laid = treemap<Datum>()
    .size([aspect, 1])
    .paddingInner(node => node.depth === 0 ? 0.0065 : 0.0024)
    .round(false)(root)
  const unit = (node: HierarchyNode<Datum> & { x0: number; x1: number; y0: number; y1: number }): UnitRect => ({
    u: node.x0 / aspect, v: node.y0, w: (node.x1 - node.x0) / aspect, h: node.y1 - node.y0,
  })
  const tiles = laid.leaves().map(leaf => {
    const rect = unit(leaf)
    return { ...rect, color: paletteColor(leaf.data.part!.exposure / 10), order: Math.min(1, (rect.u + rect.w / 2) * 0.62 + (rect.v + rect.h / 2) * 0.38) }
  })
  const fields = (laid.children ?? []).map(node => {
    const rect = unit(node), field = node.data.field!
    const corner = tiles.find(tile => tile.u <= rect.u + 0.002 && tile.v <= rect.v + 0.002 && tile.u + tile.w > rect.u + 0.002 && tile.v + tile.h > rect.v + 0.002)
    return { ...rect, id: field.id, name: field.name, jobs: field.jobs, share: field.jobs / source.jobs, ink: tileTextColor(corner?.color ?? '#ffffff') }
  })
  return { aspect, tiles, fields, jobs: source.jobs }
}
