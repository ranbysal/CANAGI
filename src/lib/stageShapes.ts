import type { Mosaic } from './mosaicLayout'

/**
 * Point formations for the launch stage. Every formation fits a 2.6 × 2 box
 * centred on the origin, with +z toward the viewer. Points are sorted from
 * left to right so each morph travels a short distance as a sweeping wave.
 */
export const FORMATION_WIDTH = 2.6

export type Random = () => number

export function createRandom(seed: number): Random {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// The maple leaf from the Flag of Canada, with its small rounded notches straightened.
const LEAF_OUTLINE = [
  [4890, 4430], [4845, 3567], [4956, 3469], [5815, 3620], [5699, 3300], [5719, 3227], [6660, 2465], [6448, 2366],
  [6414, 2287], [6600, 1715], [6058, 1830], [5985, 1792], [5880, 1545], [5457, 1999], [5346, 1942], [5550, 890],
  [5223, 1079], [5132, 1052], [4800, 400], [4468, 1052], [4377, 1079], [4050, 890], [4254, 1942], [4143, 1999],
  [3720, 1545], [3615, 1792], [3542, 1830], [3000, 1715], [3186, 2287], [3152, 2366], [2940, 2465], [3881, 3227],
  [3901, 3300], [3785, 3620], [4644, 3469], [4755, 3567], [4710, 4430],
].map(([x, y]) => [(x - 4800) / 2015, -(y - 2415) / 2015] as const)

function insidePolygon(x: number, y: number, polygon: readonly (readonly [number, number])[]) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j]
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

class Cloud {
  readonly points: number[] = []
  add(x: number, y: number, z: number) { this.points.push(x, y, z) }
  get size() { return this.points.length / 3 }
}

/** A faint halo shared by every formation keeps depth in the scene while points travel. */
function dust(cloud: Cloud, count: number, random: Random, radius = 1.35) {
  for (let i = 0; i < count; i++) {
    const u = random() * 2 - 1, theta = random() * Math.PI * 2, r = radius * (0.72 + random() * 0.5)
    const s = Math.sqrt(1 - u * u)
    cloud.add(Math.cos(theta) * s * r * 1.15, u * r * 0.82, Math.sin(theta) * s * r * 0.7)
  }
}

/** Sort by a left-to-right key, then trim or pad to exactly `count` points. */
function finish(cloud: Cloud, count: number, random: Random, extras: number[][] = []) {
  const n = cloud.size
  const index = Array.from({ length: n }, (_, i) => i)
  const key = new Float32Array(n)
  for (let i = 0; i < n; i++) key[i] = cloud.points[i * 3] + cloud.points[i * 3 + 1] * 0.12 + (random() - 0.5) * 0.08
  index.sort((a, b) => key[a] - key[b])
  const positions = new Float32Array(count * 3)
  const extraOut = extras.map(values => new Float32Array(count * (values.length / Math.max(1, n))))
  for (let i = 0; i < count; i++) {
    const source = index[Math.min(n - 1, Math.floor((i / count) * n))]
    positions.set(cloud.points.slice(source * 3, source * 3 + 3), i * 3)
    extras.forEach((values, e) => {
      const stride = values.length / n
      for (let k = 0; k < stride; k++) extraOut[e][i * stride + k] = values[source * stride + k]
    })
  }
  return { positions, extras: extraOut }
}

const leafSurface = (x: number, y: number) => 0.3 * x * x - 0.1 + 0.05 * y + 0.07 * x * y

export function leafFormation(count: number, random: Random) {
  const cloud = new Cloud()
  const outline = Math.round(count * 0.19), veins = Math.round(count * 0.1), halo = Math.round(count * 0.035)
  const interior = count - outline - veins - halo
  const segments = LEAF_OUTLINE.map((point, i) => {
    const next = LEAF_OUTLINE[(i + 1) % LEAF_OUTLINE.length]
    return { a: point, b: next, length: Math.hypot(next[0] - point[0], next[1] - point[1]) }
  })
  const perimeter = segments.reduce((sum, segment) => sum + segment.length, 0)
  for (let i = 0; i < outline; i++) {
    let distance = random() * perimeter
    const segment = segments.find(item => (distance -= item.length) <= 0) ?? segments[0]
    const t = random()
    const x = segment.a[0] + (segment.b[0] - segment.a[0]) * t, y = segment.a[1] + (segment.b[1] - segment.a[1]) * t
    cloud.add(x, y, leafSurface(x, y) + (random() - 0.5) * 0.012)
  }
  const base = [0, -0.56] as const
  const tips = [[0, 1], [0.893, 0.347], [-0.893, 0.347], [0.504, -0.598], [-0.504, -0.598], [0.372, 0.757], [-0.372, 0.757], [0.923, -0.025], [-0.923, -0.025]]
  const weights = [1.6, 1.25, 1.25, 0.8, 0.8, 0.55, 0.55, 0.55, 0.55]
  const total = weights.reduce((sum, value) => sum + value, 0)
  for (let i = 0; i < veins; i++) {
    let pick = random() * total, v = 0
    while ((pick -= weights[v]) > 0) v++
    const tip = tips[v], t = Math.pow(random(), 0.85) * 0.93
    // Minor veins branch from the main veins instead of the base.
    const from = v >= 5 ? [tips[v < 7 ? 0 : v < 8 ? 1 : 2][0] * 0.38, 0.1] : base
    const x = from[0] + (tip[0] - from[0]) * t, y = from[1] + (tip[1] - from[1]) * t
    cloud.add(x, y, leafSurface(x, y) + 0.018)
  }
  for (let i = 0; i < interior;) {
    const x = random() * 1.9 - 0.95, y = random() * 2 - 1
    if (!insidePolygon(x, y, LEAF_OUTLINE)) continue
    cloud.add(x, y, leafSurface(x, y) + (random() - 0.5) * 0.05)
    i++
  }
  dust(cloud, halo, random)
  return finish(cloud, count, random).positions
}

export function skylineFormation(count: number, random: Random) {
  const cloud = new Cloud()
  const ground = -0.98, towerX = -0.22, towerZ = 0.12
  const tower = Math.round(count * 0.2), floor = Math.round(count * 0.05), halo = Math.round(count * 0.03)
  const buildings = count - tower - floor - halo
  // The CN Tower: a flared, tapering shaft, the main pod and ring, the SkyPod and the antenna.
  for (let i = 0; i < tower; i++) {
    const part = random(), theta = random() * Math.PI * 2
    if (part < 0.44) {
      const t = random(), y = ground + t * (0.62 - ground)
      const r = (0.07 + (0.024 - 0.07) * t) * (1 + 1.4 * Math.pow(1 - t, 7))
      cloud.add(towerX + Math.cos(theta) * r, y, towerZ + Math.sin(theta) * r)
    } else if (part < 0.69) {
      const u = random() * 2 - 1, s = Math.sqrt(1 - u * u)
      cloud.add(towerX + Math.cos(theta) * s * 0.118, 0.3 + u * 0.05, towerZ + Math.sin(theta) * s * 0.118)
    } else if (part < 0.8) {
      cloud.add(towerX + Math.cos(theta) * 0.14, 0.262, towerZ + Math.sin(theta) * 0.14)
    } else if (part < 0.86) {
      const u = random() * 2 - 1, s = Math.sqrt(1 - u * u)
      cloud.add(towerX + Math.cos(theta) * s * 0.034, 0.6 + u * 0.03, towerZ + Math.sin(theta) * s * 0.034)
    } else {
      const t = random()
      cloud.add(towerX + Math.cos(theta) * 0.008 * (1 - t), 0.63 + t * 0.37, towerZ + Math.sin(theta) * 0.008 * (1 - t))
    }
  }
  const boxes: { x: number; z: number; w: number; d: number; h: number }[] = []
  while (boxes.length < 22) {
    const x = -1.02 + random() * 2.04
    if (Math.abs(x - towerX) < 0.12) continue
    const centre = Math.exp(-(((x + 0.02) / 0.62) ** 2))
    boxes.push({ x, z: -0.3 + random() * 0.55, w: 0.08 + random() * 0.11, d: 0.07 + random() * 0.09, h: 0.14 + (0.22 + 0.9 * centre) * (0.4 + 0.6 * random()) })
  }
  const areas = boxes.map(box => box.h * (box.w + box.d) + box.w * box.d)
  const areaTotal = areas.reduce((sum, value) => sum + value, 0)
  boxes.forEach((box, b) => {
    const share = b === boxes.length - 1 ? buildings - (cloud.size - tower) : Math.round((areas[b] / areaTotal) * buildings)
    const x0 = box.x - box.w / 2, z0 = box.z - box.d / 2, top = ground + box.h
    const edgePoints = Math.round(share * 0.5)
    // Edges, stratified so each line reads as a line: four verticals and the roof outline.
    const lengths = [box.h, box.h, box.h, box.h, box.w, box.w, box.d, box.d]
    const perimeter = lengths.reduce((sum, value) => sum + value, 0)
    for (let i = 0; i < edgePoints; i++) {
      let along = ((i + random() * 0.3) / edgePoints) * perimeter, edge = 0
      while (along > lengths[edge] && edge < 7) along -= lengths[edge++]
      const t = along / lengths[edge]
      if (edge < 4) cloud.add(x0 + (edge & 1) * box.w, ground + t * box.h, z0 + (edge >> 1) * box.d)
      else if (edge < 6) cloud.add(x0 + t * box.w, top, z0 + (edge - 4) * box.d)
      else cloud.add(x0 + (edge - 6) * box.w, top, z0 + t * box.d)
    }
    // Lit windows on a regular grid across the front and side faces.
    const frontColumns = Math.max(2, Math.round(box.w / 0.034)), sideColumns = Math.max(2, Math.round(box.d / 0.034))
    const rows = Math.max(3, Math.round(box.h / 0.042))
    const windows = (frontColumns + sideColumns) * rows
    for (let i = 0; i < share - edgePoints; i++) {
      const cell = Math.floor((i / (share - edgePoints)) * windows)
      const row = Math.floor(cell / (frontColumns + sideColumns)), column = cell % (frontColumns + sideColumns)
      const y = ground + ((row + 0.5) / rows) * box.h * 0.94
      if (column < frontColumns) cloud.add(x0 + ((column + 0.5) / frontColumns) * box.w, y, z0 + box.d)
      else cloud.add(x0 + box.w, y, z0 + ((column - frontColumns + 0.5) / sideColumns) * box.d)
    }
  })
  for (let i = 0; i < floor; i++) cloud.add(-1.15 + random() * 2.3, ground, -0.55 + Math.floor(random() * 5) / 4 * 1.0)
  dust(cloud, halo, random, 1.3)
  return finish(cloud, count, random).positions
}

/** A layered network. Points on connections carry a direction so signals can flow. */
export function networkFormation(count: number, random: Random) {
  const cloud = new Cloud()
  const flow: number[] = []
  const layers = [[-1.0, 6, 0.38], [-0.5, 10, 0.6], [0, 13, 0.72], [0.5, 10, 0.6], [1.0, 5, 0.34]] as const
  const nodes = layers.map(([x, total, radius]) => Array.from({ length: total }, (_, k) => {
    const r = radius * Math.sqrt((k + 0.5) / total), theta = k * 2.39996 + x
    const y = r * Math.cos(theta), z = r * Math.sin(theta) * 0.9
    return [x + 0.05 * (y * y + z * z), y, z] as const
  }))
  const edges: [readonly number[], readonly number[]][] = []
  nodes.slice(0, -1).forEach((layer, l) => layer.forEach(node => {
    const next = [...nodes[l + 1]].sort((a, b) => Math.hypot(a[1] - node[1], a[2] - node[2]) - Math.hypot(b[1] - node[1], b[2] - node[2]))
    const targets = new Set([next[0], next[1], next[Math.floor(random() * next.length)]])
    targets.forEach(target => edges.push([node, target]))
  }))
  const allNodes = nodes.flat()
  const nodePoints = Math.round(count * 0.26), halo = Math.round(count * 0.05)
  const edgePoints = count - nodePoints - halo
  for (let i = 0; i < nodePoints; i++) {
    const node = allNodes[Math.floor(random() * allNodes.length)]
    const u = random() * 2 - 1, theta = random() * Math.PI * 2, s = Math.sqrt(1 - u * u), r = 0.026 * Math.cbrt(random())
    cloud.add(node[0] + Math.cos(theta) * s * r, node[1] + u * r, node[2] + Math.sin(theta) * s * r)
    flow.push(0, 0, 0, 0)
  }
  for (let i = 0; i < edgePoints; i++) {
    const [a, b] = edges[Math.floor(random() * edges.length)]
    const t = random()
    cloud.add(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t)
    // Start point is recovered from the phase, so store the direction and phase only.
    flow.push(b[0] - a[0], b[1] - a[1], b[2] - a[2], t)
  }
  dust(cloud, halo, random, 1.3)
  for (let i = 0; i < halo; i++) flow.push(0, 0, 0, 0)
  const { positions, extras } = finish(cloud, count, random, [flow])
  return { positions, flow: extras[0] }
}

function hexToRgb(hex: string) {
  return [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255)
}

/**
 * The data mosaic, laid out at the viewport's aspect ratio so that, scaled to
 * fill the screen, every dot sits inside the matching DOM shutter tile.
 */
export function mosaicFormation(count: number, mosaic: Mosaic, random: Random) {
  const width = FORMATION_WIDTH, height = FORMATION_WIDTH / mosaic.aspect
  const rects = mosaic.tiles.map(tile => ({
    x: (tile.u - 0.5) * width, y: (0.5 - tile.v) * height, w: tile.w * width, h: tile.h * height, rgb: hexToRgb(tile.color),
  }))
  const fits = (spacing: number) => rects.reduce((sum, rect) => sum + Math.floor(rect.w / spacing) * Math.floor(rect.h / spacing), 0)
  let low = 0.002, high = 0.2
  for (let i = 0; i < 32; i++) { const mid = (low + high) / 2; if (fits(mid) > count) low = mid; else high = mid }
  const spacing = high
  const cloud = new Cloud(), colour: number[] = []
  for (const rect of rects) {
    const columns = Math.floor(rect.w / spacing), rows = Math.floor(rect.h / spacing)
    const ox = rect.x + (rect.w - columns * spacing) / 2 + spacing / 2, oy = rect.y - (rect.h - rows * spacing) / 2 - spacing / 2
    for (let r = 0; r < rows; r++) for (let c = 0; c < columns; c++) {
      cloud.add(ox + c * spacing, oy - r * spacing, 0)
      colour.push(...rect.rgb, 1)
    }
  }
  // Spare points hide inside a tile and fade out rather than doubling a dot.
  while (cloud.size < count) {
    const rect = rects[Math.floor(random() * rects.length)]
    cloud.add(rect.x + random() * rect.w, rect.y - random() * rect.h, 0)
    colour.push(...rect.rgb, 0)
  }
  const { positions, extras } = finish(cloud, count, random, [colour])
  return { positions, colour: extras[0], spacing }
}
