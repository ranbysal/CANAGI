import type { Mosaic } from './mosaicLayout'
import { createRandom, FORMATION_WIDTH, leafFormation, mosaicFormation, networkFormation, skylineFormation } from './stageShapes'

/**
 * The stage: one WebGL canvas behind every page, anchored to a DOM box.
 * Points spring between four formations (Canada, Today, Tomorrow, Together).
 * Between pages the points flood the screen, then gather into the next page.
 */
export type StageMode = 'intro' | 'leaving' | 'entering' | 'page' | 'page-out' | 'page-in' | 'returning' | 'arriving' | 'hidden'

const FOV = (34 * Math.PI) / 180
const CAMERA = 6
const WORLD_HEIGHT = 2 * CAMERA * Math.tan(FOV / 2)
const LAST_STAGE = 3

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t) }

const POINT_VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec4 aState;
layout(location = 1) in float aAlpha;
layout(location = 2) in vec4 aRandom;
layout(location = 3) in vec4 aMapColour;
uniform mat4 uViewProjection;
uniform mat4 uModel;
uniform float uTime, uSize, uMapSize, uAlpha, uNoise, uDisperse, uDof;
uniform vec3 uPointer;
uniform vec3 uInk0, uInk1, uInk2;
out vec3 vColour;
out float vAlpha;
out float vSoft;
void main() {
  vec4 world = uModel * vec4(aState.xyz, 1.0);
  float scale = length(uModel[0].xyz);
  world.xyz += sin(uTime * vec3(0.55, 0.47, 0.61) + aRandom.xyz * 6.2832) * 0.0045 * scale * uNoise;
  world.xyz += (aRandom.xyz - 0.5) * vec3(2.8, 2.0, 2.4) * scale * uDisperse * (0.6 + aRandom.w);
  vec2 away = world.xy - uPointer.xy;
  float d2 = dot(away, away);
  float radius = 0.34 * scale;
  world.xy += away * inversesqrt(d2 + 1e-5) * uPointer.z * 0.13 * scale * exp(-d2 / (radius * radius + 1e-5));
  gl_Position = uViewProjection * world;
  float depth = gl_Position.w;
  float mapMix = aState.w;
  float blur = min(abs(depth - ${CAMERA.toFixed(1)}) * uDof, 2.5) * (1.0 - mapMix);
  float sparkle = step(0.965, aRandom.z);
  float size = mix(uSize * (0.62 + aRandom.w * 0.9) * (1.0 + sparkle * 0.9), uMapSize, mapMix);
  gl_PointSize = max(1.0, size * (${CAMERA.toFixed(1)} / depth) * (1.0 + blur * 1.5));
  vec3 ink = mix(uInk0, uInk1, aRandom.y);
  ink = mix(ink, uInk2, aRandom.x * aRandom.x * 0.8);
  vColour = ink;
  float twinkle = 1.0 - sparkle * (0.35 + 0.35 * sin(uTime * 2.3 + aRandom.x * 40.0)) * (1.0 - mapMix);
  vAlpha = aAlpha * uAlpha * twinkle * mix(1.0, aMapColour.a, mapMix) * (1.0 - uDisperse * 0.85) / (1.0 + blur * blur * 3.0);
  vSoft = clamp(blur * 0.6, 0.0, 1.0);
}`

const POINT_FRAGMENT = `#version 300 es
precision highp float;
in vec3 vColour;
in float vAlpha;
in float vSoft;
uniform float uGlow;
out vec4 outColour;
void main() {
  float r = length(gl_PointCoord - 0.5) * 2.0;
  float edge = mix(0.3, 0.95, vSoft);
  float a = (1.0 - smoothstep(1.0 - edge, 1.0, r)) * vAlpha;
  if (a < 0.003) discard;
  outColour = vec4(vColour * a, a * uGlow);
}`

const LINE_VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aLine;
uniform mat4 uViewProjection;
uniform mat4 uModel;
uniform float uTime, uPhase;
out float vAlpha;
void main() {
  float ribbon = floor(aLine.y);
  float line = fract(aLine.y);
  float u = aLine.x;
  float x = mix(-3.3, 3.3, u);
  float envelope = smoothstep(0.0, 0.22, u) * smoothstep(1.0, 0.72, u);
  vec3 p;
  if (ribbon < 0.5) {
    float a = 0.34 + line * 0.3;
    p = vec3(x, -0.6 + a * sin(x * 0.82 + uTime * 0.21 + line * 1.25 + uPhase) - x * 0.08, -0.35 + line * 0.9 * cos(x * 0.45 + line * 1.4));
  } else {
    float a = 0.28 + line * 0.24;
    p = vec3(x, -0.84 + a * sin(x * 0.66 - uTime * 0.16 + 2.2 + line * 0.9 - uPhase * 0.7) + x * 0.06, 0.25 - line * 0.7);
  }
  gl_Position = uViewProjection * uModel * vec4(p, 1.0);
  vAlpha = envelope * (0.3 + 0.7 * sin(line * 3.14159));
}`

const LINE_FRAGMENT = `#version 300 es
precision highp float;
in float vAlpha;
uniform vec3 uColour;
uniform float uAlpha;
uniform vec2 uFade;
out vec4 outColour;
void main() {
  float a = vAlpha * uAlpha * smoothstep(uFade.x, uFade.y, gl_FragCoord.x);
  outColour = vec4(uColour * a, a);
}`

const RIBBON_LINES = 30
const RIBBON_POINTS = 200

interface Rect { x: number; y: number; w: number; h: number }
interface Frame {
  anchor: Rect | null; focus: number; alpha: number; target: number; rate: number
  spring: number; waves: number; disperse: number; noise: number; lift: number
}
interface Jump { from: number; to: number; start: number; duration: number }
type AnchorKind = 'intro' | 'page'
type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> }

const THEMES = {
  light: { ink: [[0.353, 0.345, 1], [0.56, 0.55, 1], [0.17, 0.16, 0.66]], glow: 1, line: [0.353, 0.345, 1], lineAlpha: 0.13, size: 2.05 },
  dark: { ink: [[0.667, 0.66, 1], [0.49, 0.47, 1], [0.9, 0.9, 1]], glow: 0.55, line: [0.62, 0.61, 1], lineAlpha: 0.14, size: 2.2 },
}

// Morphs between formations while points flood out or gather in (ms).
const JUMPS: Partial<Record<StageMode, [number, number]>> = {
  leaving: [LAST_STAGE, 520], entering: [0, 850], 'page-out': [LAST_STAGE, 400], 'page-in': [0, 760], returning: [LAST_STAGE, 520], arriving: [0, 850],
}
// A little past the edges, so the flood reaches every corner.
const FLOOD_SCALE = 1.08

export interface StageAnchors { intro: () => Element | null; page: () => Element | null }

export class StageEngine {
  private readonly canvas: HTMLCanvasElement
  private readonly anchors: StageAnchors
  private gl: WebGL2RenderingContext | null = null
  private points: Program | null = null
  private lines: Program | null = null
  private pointVao: WebGLVertexArrayObject | null = null
  private lineVao: WebGLVertexArrayObject | null = null
  private stateBuffer: WebGLBuffer | null = null
  private colourBuffer: WebGLBuffer | null = null
  private readonly count: number
  private readonly positions: Float32Array
  private readonly velocities: Float32Array
  private readonly state: Float32Array
  private readonly formations: Float32Array[]
  private readonly flow: Float32Array
  private mapColour: Float32Array
  private readonly randoms: Float32Array
  private readonly stiffness: Float32Array
  private readonly order: Float32Array
  private readonly mapMix: Float32Array
  private readonly phases: Float32Array
  private mapSpacing = 0.02
  private mosaic: Mosaic | null = null
  private mode: StageMode = 'hidden'
  private modeStart = 0
  private modeAlpha = 0
  private appliedAlpha = 0
  private appliedDisperse = 0
  private modeDisperse = 0
  private fadeInAt = -Infinity
  private stage = 0
  private jump: Jump | null = null
  private settled = false
  private readonly anchorCache = new Map<AnchorKind, { element: Element; x: number; top: number; w: number; h: number; at: number }>()
  private dark = false
  private reduced = false
  private charge = () => 0
  private pointer = { x: 0, y: 0, tx: 0, ty: 0, strength: 0, target: 0 }
  private pose = { x: 0, y: 0, scale: 1 }
  private time = 0
  private last = 0
  private raf = 0
  private running = false
  private lost = false
  private disposed = false
  private cssWidth = 0
  private cssHeight = 0
  private ratio = 1

  constructor(canvas: HTMLCanvasElement, anchors: StageAnchors, count: number) {
    this.canvas = canvas
    this.anchors = anchors
    this.count = count
    const random = createRandom(20260924)
    this.formations = [leafFormation(count, random), skylineFormation(count, random)]
    const network = networkFormation(count, random)
    this.formations.push(network.positions, new Float32Array(count * 3))
    this.flow = network.flow
    this.mapColour = new Float32Array(count * 4)
    this.positions = new Float32Array(this.formations[0])
    this.velocities = new Float32Array(count * 3)
    this.state = new Float32Array(count * 5)
    this.randoms = new Float32Array(count * 4)
    this.stiffness = new Float32Array(count)
    this.order = new Float32Array(count)
    this.mapMix = new Float32Array(count)
    this.phases = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      for (let k = 0; k < 4; k++) this.randoms[i * 4 + k] = random()
      this.stiffness[i] = 0.55 + random() * 0.9
      // Formations are sorted left to right, so index order is a spatial sweep.
      this.order[i] = clamp((i / count) * 0.82 + random() * 0.17 + 0.005, 0.001, 0.999)
    }
    this.onPointer = this.onPointer.bind(this)
    this.onLost = this.onLost.bind(this)
    this.onRestored = this.onRestored.bind(this)
    this.onResize = this.onResize.bind(this)
    this.wake = this.wake.bind(this)
    this.tick = this.tick.bind(this)
  }

  /** Returns false when WebGL2 is unavailable, so the caller can show a still image. */
  start(charge: () => number) {
    this.charge = charge
    if (!this.initialise()) return false
    window.addEventListener('pointermove', this.onPointer, { passive: true })
    window.addEventListener('pointerdown', this.onPointer, { passive: true })
    window.addEventListener('scroll', this.wake, { passive: true })
    window.addEventListener('resize', this.onResize)
    this.canvas.addEventListener('webglcontextlost', this.onLost)
    this.canvas.addEventListener('webglcontextrestored', this.onRestored)
    this.wake()
    return true
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    window.removeEventListener('pointermove', this.onPointer)
    window.removeEventListener('pointerdown', this.onPointer)
    window.removeEventListener('scroll', this.wake)
    window.removeEventListener('resize', this.onResize)
    this.canvas.removeEventListener('webglcontextlost', this.onLost)
    this.canvas.removeEventListener('webglcontextrestored', this.onRestored)
    this.gl?.getExtension('WEBGL_lose_context')?.loseContext()
  }

  setMode(mode: StageMode) {
    if (mode === this.mode) return
    const now = performance.now()
    const from = this.mode
    this.mode = mode
    this.modeStart = now
    this.modeAlpha = this.appliedAlpha
    this.modeDisperse = this.appliedDisperse
    this.anchorCache.clear()
    this.unsettle()
    const jump = JUMPS[mode]
    if (jump && !this.reduced) {
      const origin = this.jump ? this.jump.to : Math.round(this.stage)
      this.jump = { from: origin, to: jump[0], start: now, duration: jump[1] }
    } else {
      this.jump = null
      // Arriving without a flood (first load, reduced motion or a skipped transition): gather from a cloud.
      const gathered = from === 'entering' || from === 'page-in' || from === 'arriving' || from === 'page'
      if (mode === 'page' && !gathered) this.assemble(now, 0)
      if (mode === 'intro' && from !== 'arriving') this.assemble(now, this.charge() * LAST_STAGE)
    }
    this.wake()
  }

  setTheme(dark: boolean) { this.dark = dark; this.wake() }
  setReducedMotion(reduced: boolean) { this.reduced = reduced; this.unsettle(); this.wake() }

  setMosaic(mosaic: Mosaic) {
    if (this.mosaic === mosaic) return
    this.mosaic = mosaic
    const formation = mosaicFormation(this.count, mosaic, createRandom(7))
    this.formations[LAST_STAGE] = formation.positions
    this.mapColour = formation.colour
    this.mapSpacing = formation.spacing
    if (this.gl && this.colourBuffer) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.colourBuffer)
      this.gl.bufferData(this.gl.ARRAY_BUFFER, this.mapColour, this.gl.STATIC_DRAW)
    }
    this.unsettle()
    this.wake()
  }

  /** Any external change schedules frames until the scene settles again. */
  wake() {
    if (this.running || this.disposed || this.lost || !this.gl) return
    this.running = true
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.tick)
  }

  private unsettle() { this.settled = false }

  private onResize() {
    this.anchorCache.clear()
    this.unsettle()
    this.wake()
  }

  private initialise() {
    const gl = this.canvas.getContext('webgl2', { alpha: true, antialias: false, depth: false, premultipliedAlpha: true, powerPreference: 'high-performance' })
    if (!gl) return false
    const points = this.program(gl, POINT_VERTEX, POINT_FRAGMENT, ['uViewProjection', 'uModel', 'uTime', 'uSize', 'uMapSize', 'uAlpha', 'uNoise', 'uDisperse', 'uDof', 'uPointer', 'uInk0', 'uInk1', 'uInk2', 'uGlow'])
    const lines = this.program(gl, LINE_VERTEX, LINE_FRAGMENT, ['uViewProjection', 'uModel', 'uTime', 'uPhase', 'uColour', 'uAlpha', 'uFade'])
    if (!points || !lines) return false
    this.gl = gl
    this.points = points
    this.lines = lines

    this.pointVao = gl.createVertexArray()
    gl.bindVertexArray(this.pointVao)
    this.stateBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.stateBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this.state.byteLength, gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 20, 0)
    gl.enableVertexAttribArray(1)
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 20, 16)
    const randomBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, randomBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this.randoms, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(2)
    gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0)
    this.colourBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.colourBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, this.mapColour, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(3)
    gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 0, 0)

    this.lineVao = gl.createVertexArray()
    gl.bindVertexArray(this.lineVao)
    const lineData = new Float32Array(2 * RIBBON_LINES * RIBBON_POINTS * 2)
    let o = 0
    for (let ribbon = 0; ribbon < 2; ribbon++) for (let line = 0; line < RIBBON_LINES; line++) for (let p = 0; p < RIBBON_POINTS; p++) {
      lineData[o++] = p / (RIBBON_POINTS - 1)
      lineData[o++] = ribbon + line / RIBBON_LINES
    }
    const lineBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, lineData, gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    gl.bindVertexArray(null)

    gl.disable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
    return true
  }

  private program(gl: WebGL2RenderingContext, vertex: string, fragment: string, names: string[]): Program | null {
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost()) {
        console.error(gl.getShaderInfoLog(shader))
        return null
      }
      return shader
    }
    const vs = compile(gl.VERTEX_SHADER, vertex), fs = compile(gl.FRAGMENT_SHADER, fragment)
    if (!vs || !fs) return null
    const program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
      console.error(gl.getProgramInfoLog(program))
      return null
    }
    return { program, uniforms: Object.fromEntries(names.map(name => [name, gl.getUniformLocation(program, name)])) }
  }

  private onLost(event: Event) {
    event.preventDefault()
    this.lost = true
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  private onRestored() {
    this.lost = false
    if (this.initialise()) this.wake()
  }

  private onPointer(event: PointerEvent) {
    if (event.pointerType === 'touch') return
    this.pointer.tx = (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1
    this.pointer.ty = 1 - (event.clientY / Math.max(1, window.innerHeight)) * 2
    this.pointer.target = 1
    this.wake()
  }

  /** Scatter points around their destination so they can gather into it. */
  private assemble(now: number, stage: number) {
    this.stage = stage
    this.fadeInAt = now
    this.unsettle()
    const k = Math.round(stage)
    const formation = this.formations[k]
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3, i4 = i * 4
      const spread = 0.22 + this.randoms[i4 + 3] * 0.7
      this.positions[i3] = formation[i3] + (this.randoms[i4] - 0.5) * 2 * spread
      this.positions[i3 + 1] = formation[i3 + 1] + (this.randoms[i4 + 1] - 0.5) * 2 * spread
      this.positions[i3 + 2] = formation[i3 + 2] + (this.randoms[i4 + 2] - 0.5) * 2 * spread
      this.velocities[i3] = this.velocities[i3 + 1] = this.velocities[i3 + 2] = 0
      this.mapMix[i] = k === LAST_STAGE ? 1 : 0
    }
  }

  /**
   * Anchor boxes are measured at most a few times a second; scrolling only
   * shifts them, so no layout is forced on every frame.
   */
  private anchor(kind: AnchorKind): Rect | null {
    const now = performance.now()
    let entry = this.anchorCache.get(kind)
    if (!entry || !entry.element.isConnected || now - entry.at > 500) {
      const element = kind === 'intro' ? this.anchors.intro() : this.anchors.page()
      if (!element) return null
      const box = element.getBoundingClientRect()
      if (box.width < 2 || box.height < 2) return null
      entry = { element, x: box.left, top: box.top + window.scrollY, w: box.width, h: box.height, at: now }
      this.anchorCache.set(kind, entry)
    }
    return { x: entry.x, y: entry.top - window.scrollY, w: entry.w, h: entry.h }
  }

  /** Short phones have no free space beside the launch copy, so the formation becomes a backdrop. */
  private launchStrength() { return this.cssWidth < 620 && this.cssHeight < 740 ? 0.28 : 1 }

  /** On narrow screens the page formation sits behind the copy, so it steps back. */
  private pageStrength() { return this.cssWidth < 760 ? 0.3 : 1 }

  private frame(now: number): Frame {
    const t = now - this.modeStart
    const fade = this.reduced ? 1 : easeOut(clamp((now - this.fadeInAt) / 1100))
    const blend = (rest: number, focus: number) => rest + (1 - rest) * focus
    const rest = (): Frame => {
      const scroll = window.scrollY
      const disperse = smooth(260, 700, scroll)
      const anchor = this.anchor('page')
      return { anchor, focus: 0, alpha: anchor ? fade * this.pageStrength() : 0, target: 0, rate: 4, spring: 1.1, waves: fade * (1 - clamp(scroll / 380)), disperse, noise: 1, lift: scroll * 0.42 }
    }
    switch (this.mode) {
      case 'intro':
        return { anchor: this.anchor('intro'), focus: 0, alpha: fade * this.launchStrength(), target: this.charge() * LAST_STAGE, rate: 4.2, spring: 1, waves: fade, disperse: 0, noise: 1, lift: 0 }
      case 'page':
        return rest()
      case 'leaving': {
        const focus = easeInOut(clamp((t - 40) / 800))
        return { anchor: this.anchor('intro'), focus, alpha: blend(this.launchStrength(), focus), target: LAST_STAGE, rate: 8, spring: 2.2, waves: 1 - clamp(t / 350), disperse: 0, noise: 1, lift: 0 }
      }
      case 'page-out':
      case 'returning': {
        const focus = easeInOut(clamp(t / (this.mode === 'page-out' ? 600 : 820)))
        const base = rest()
        return { ...base, focus, alpha: blend(this.modeAlpha, focus), target: LAST_STAGE, spring: 2.2, waves: base.waves * (1 - clamp(t / 300)), disperse: this.modeDisperse * (1 - focus) }
      }
      case 'entering':
      case 'page-in': {
        const focus = 1 - easeInOut(clamp(t / (this.mode === 'page-in' ? 1000 : 1150)))
        const anchor = this.anchor('page')
        return { anchor, focus, alpha: anchor ? blend(this.pageStrength(), focus) : 1 - clamp(t / 400), target: 0, rate: 4, spring: 1.8, waves: easeOut(clamp((t - 520) / 800)), disperse: 0, noise: 1, lift: 0 }
      }
      case 'arriving': {
        const focus = 1 - easeInOut(clamp(t / 1150))
        return { anchor: this.anchor('intro'), focus, alpha: blend(this.launchStrength(), focus), target: 0, rate: 4, spring: 1.8, waves: easeOut(clamp((t - 600) / 700)), disperse: 0, noise: 1, lift: 0 }
      }
      default:
        return { anchor: null, focus: 0, alpha: this.modeAlpha * (1 - clamp(t / 320)), target: this.stage, rate: 4, spring: 1, waves: 0, disperse: 0, noise: 0, lift: 0 }
    }
  }

  private tick(now: number) {
    if (this.disposed || this.lost || !this.gl) { this.running = false; return }
    const dt = Math.min(1 / 30, Math.max(0, (now - this.last) / 1000))
    this.last = now
    if (!this.reduced) this.time += dt
    const frame = this.frame(now)
    this.resize()
    if (this.jump && now - this.jump.start >= this.jump.duration) {
      this.stage = this.jump.to
      this.jump = null
    }
    if (!this.jump) {
      const before = this.stage
      this.stage += (frame.target - this.stage) * (this.reduced ? 1 : 1 - Math.exp(-frame.rate * dt))
      if (Math.abs(frame.target - this.stage) < 0.0005) this.stage = frame.target
      if (this.stage !== before) this.unsettle()
    }
    const pointer = this.pointer
    const follow = this.reduced ? 1 : 1 - Math.exp(-4 * dt)
    pointer.x += (pointer.tx - pointer.x) * follow
    pointer.y += (pointer.ty - pointer.y) * follow
    pointer.strength += (pointer.target - pointer.strength) * follow
    // At rest the points only breathe in the shader: skip the simulation and upload.
    const uploaded = !this.settled
    if (uploaded) this.simulate(dt, frame, now)
    const visible = this.render(frame, uploaded)
    this.appliedAlpha = frame.alpha
    this.appliedDisperse = frame.disperse
    const moving = this.mode !== 'intro' && this.mode !== 'page' && this.mode !== 'hidden'
    const fading = now - this.fadeInAt < 1300
    const idle = this.reduced && !moving && this.settled
    if ((visible || moving || fading) && !idle) {
      this.raf = requestAnimationFrame(this.tick)
    } else {
      this.running = false
    }
  }

  private resize() {
    const width = this.canvas.clientWidth, height = this.canvas.clientHeight
    const pixels = width * height
    // Dots stay crisp at 1.75x; large displays trade a little density for frame time.
    const ratio = Math.min(window.devicePixelRatio || 1, pixels > 2_000_000 ? 1.25 : 1.75)
    if (width === this.cssWidth && height === this.cssHeight && ratio === this.ratio) return
    this.cssWidth = width
    this.cssHeight = height
    this.ratio = ratio
    this.canvas.width = Math.max(1, Math.round(width * ratio))
    this.canvas.height = Math.max(1, Math.round(height * ratio))
  }

  private simulate(dt: number, frame: Frame, now: number) {
    const n = this.count, s = this.stage
    const positions = this.positions, velocities = this.velocities, state = this.state
    const flow = this.flow, formations = this.formations, order = this.order, randoms = this.randoms
    const base = 36 * frame.spring
    const mapRate = 1 - Math.exp(-5 * dt)
    const time = this.time
    const snap = this.reduced
    const jump = this.jump
    const progress = jump ? easeInOut(clamp((now - jump.start) / jump.duration)) : 0
    let energy = 0, flowing = false
    for (let i = 0; i < n; i++) {
      const i3 = i * 3, i4 = i * 4
      let k: number
      if (jump) k = progress >= order[i] ? jump.to : jump.from
      else {
        k = Math.floor(s + 1 - order[i])
        if (k < 0) k = 0; else if (k > LAST_STAGE) k = LAST_STAGE
      }
      const formation = formations[k]
      let tx = formation[i3], ty = formation[i3 + 1], tz = formation[i3 + 2]
      let alpha = 1
      let wrapped = false
      if (k === 2) {
        const fx = flow[i4], fy = flow[i4 + 1], fz = flow[i4 + 2]
        if (fx !== 0 || fy !== 0 || fz !== 0) {
          flowing = true
          const start = flow[i4 + 3]
          const phase = (start + time * 0.11) % 1
          tx += fx * (phase - start); ty += fy * (phase - start); tz += fz * (phase - start)
          alpha = smooth(0, 0.12, phase) * (1 - smooth(0.88, 1, phase))
          wrapped = phase < this.phases[i]
          this.phases[i] = phase
        }
      }
      let px = positions[i3], py = positions[i3 + 1], pz = positions[i3 + 2]
      let vx = velocities[i3], vy = velocities[i3 + 1], vz = velocities[i3 + 2]
      const dx = tx - px, dy = ty - py, dz = tz - pz
      if (snap || (wrapped && dx * dx + dy * dy + dz * dz < 0.02)) {
        px = tx; py = ty; pz = tz; vx = vy = vz = 0
      } else {
        const stiffness = base * this.stiffness[i]
        const damping = 2 * Math.sqrt(stiffness) * 0.74
        // A per-point axis bends each journey into an arc instead of a straight line.
        const ax = randoms[i4] - 0.5, ay = randoms[i4 + 1] - 0.5, az = randoms[i4 + 2] - 0.5
        const curl = stiffness * 0.55
        vx += (stiffness * dx - damping * vx + (dy * az - dz * ay) * curl) * dt
        vy += (stiffness * dy - damping * vy + (dz * ax - dx * az) * curl) * dt
        vz += (stiffness * dz - damping * vz + (dx * ay - dy * ax) * curl) * dt
        px += vx * dt; py += vy * dt; pz += vz * dt
        const e = dx * dx + dy * dy + dz * dz + (vx * vx + vy * vy + vz * vz) * 0.01
        if (e > energy) energy = e
      }
      positions[i3] = px; positions[i3 + 1] = py; positions[i3 + 2] = pz
      velocities[i3] = vx; velocities[i3 + 1] = vy; velocities[i3 + 2] = vz
      const mapTarget = k === LAST_STAGE ? 1 : 0
      const mix = snap ? mapTarget : this.mapMix[i] + (mapTarget - this.mapMix[i]) * mapRate
      if (Math.abs(mapTarget - mix) > 0.001) energy = Math.max(energy, 1)
      this.mapMix[i] = mix
      const o = i * 5
      state[o] = px; state[o + 1] = py; state[o + 2] = pz; state[o + 3] = mix; state[o + 4] = alpha
    }
    this.settled = !jump && !flowing && energy < 2e-7
  }

  private render(frame: Frame, uploaded: boolean) {
    const gl = this.gl!, width = this.canvas.width, height = this.canvas.height
    gl.viewport(0, 0, width, height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    if (frame.alpha <= 0.002 || this.cssWidth < 2 || this.cssHeight < 2) return false

    const aspect = this.cssWidth / this.cssHeight
    const worldPerPixel = WORLD_HEIGHT / this.cssHeight
    const focusScale = (WORLD_HEIGHT * aspect * FLOOD_SCALE) / FORMATION_WIDTH
    let anchorScale = focusScale * 0.4, anchorX = 0, anchorY = 0
    if (frame.anchor) {
      const a = frame.anchor
      anchorScale = Math.min(a.h / 2, a.w / FORMATION_WIDTH) * 0.86 * worldPerPixel
      anchorX = (a.x + a.w / 2 - this.cssWidth / 2) * worldPerPixel
      anchorY = -(a.y + a.h / 2 + frame.lift - this.cssHeight / 2) * worldPerPixel
    } else if (frame.focus < 1) {
      anchorScale = this.pose.scale
      anchorX = this.pose.x
      anchorY = this.pose.y
    }
    const focus = frame.focus
    const scale = Math.exp(Math.log(anchorScale) + (Math.log(focusScale) - Math.log(anchorScale)) * focus)
    const x = anchorX * (1 - focus), y = anchorY * (1 - focus)
    this.pose = { x, y, scale }
    if (Math.abs(y) - scale * 1.6 > WORLD_HEIGHT / 2 || frame.disperse >= 0.999) return false

    // Each formation has its own resting attitude; the pointer adds parallax.
    const jump = this.jump
    const s = jump ? jump.from + (jump.to - jump.from) * easeInOut(clamp((performance.now() - jump.start) / jump.duration)) : this.stage
    const time = this.time
    const weights = [0, 1, 2, 3].map(k => Math.max(0, 1 - Math.abs(s - k)))
    const yaws = [-0.3 + Math.sin(time * 0.23) * 0.24, -0.44 + Math.sin(time * 0.2) * 0.16, -0.95 + Math.sin(time * 0.16) * 0.3, -0.46 + Math.sin(time * 0.25) * 0.06]
    const pitches = [0.06 + Math.sin(time * 0.17) * 0.05, 0.15, 0.3 + Math.sin(time * 0.3) * 0.04, 0.2]
    const pointerWeight = (1 - focus) * this.pointer.strength
    let yaw = weights.reduce((sum, w, k) => sum + w * yaws[k], 0) + this.pointer.x * 0.24 * pointerWeight + frame.lift * 0.0012
    let pitch = weights.reduce((sum, w, k) => sum + w * pitches[k], 0) - this.pointer.y * 0.13 * pointerWeight
    yaw *= 1 - focus
    pitch *= 1 - focus

    const viewProjection = this.viewProjection(aspect)
    const model = this.model(x, y, scale, yaw, pitch)
    const theme = this.dark ? THEMES.dark : THEMES.light
    const ratio = this.ratio
    const pointerWorld = [this.pointer.x * aspect * WORLD_HEIGHT / 2, this.pointer.y * WORLD_HEIGHT / 2]
    const sizeScale = clamp(Math.sqrt(scale / 1.15), 0.72, 1.25)

    // Ribbons of hairlines under the formation; they fade before reaching the copy.
    if (frame.waves > 0.002 && this.lines && this.lineVao) {
      const { program, uniforms } = this.lines
      gl.useProgram(program)
      gl.uniformMatrix4fv(uniforms.uViewProjection, false, viewProjection)
      gl.uniformMatrix4fv(uniforms.uModel, false, this.model(x, y, scale, yaw * 0.25, 0))
      gl.uniform1f(uniforms.uTime, time)
      gl.uniform1f(uniforms.uPhase, s * 1.1)
      gl.uniform3fv(uniforms.uColour, theme.line)
      gl.uniform1f(uniforms.uAlpha, theme.lineAlpha * frame.waves * frame.alpha)
      const narrow = this.cssWidth < 760
      gl.uniform2f(uniforms.uFade, narrow ? -2 : width * 0.44, narrow ? -1 : width * 0.74)
      gl.bindVertexArray(this.lineVao)
      for (let line = 0; line < RIBBON_LINES * 2; line++) gl.drawArrays(gl.LINE_STRIP, line * RIBBON_POINTS, RIBBON_POINTS)
    }

    if (this.points && this.pointVao) {
      const { program, uniforms } = this.points
      gl.useProgram(program)
      gl.bindVertexArray(this.pointVao)
      if (uploaded) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.stateBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.state)
      }
      gl.uniformMatrix4fv(uniforms.uViewProjection, false, viewProjection)
      gl.uniformMatrix4fv(uniforms.uModel, false, model)
      gl.uniform1f(uniforms.uTime, time)
      gl.uniform1f(uniforms.uSize, theme.size * ratio * sizeScale)
      gl.uniform1f(uniforms.uMapSize, (this.mapSpacing * scale / worldPerPixel) * ratio * 0.5)
      gl.uniform1f(uniforms.uAlpha, frame.alpha)
      gl.uniform1f(uniforms.uNoise, this.reduced ? 0 : frame.noise)
      gl.uniform1f(uniforms.uDisperse, frame.disperse)
      gl.uniform1f(uniforms.uDof, 0.36)
      gl.uniform3f(uniforms.uPointer, pointerWorld[0], pointerWorld[1], this.reduced ? 0 : pointerWeight)
      gl.uniform3fv(uniforms.uInk0, theme.ink[0])
      gl.uniform3fv(uniforms.uInk1, theme.ink[1])
      gl.uniform3fv(uniforms.uInk2, theme.ink[2])
      gl.uniform1f(uniforms.uGlow, theme.glow)
      gl.drawArrays(gl.POINTS, 0, this.count)
    }
    gl.bindVertexArray(null)
    return true
  }

  private viewProjection(aspect: number) {
    const f = 1 / Math.tan(FOV / 2), near = 0.1, far = 60
    const m = new Float32Array(16)
    m[0] = f / aspect
    m[5] = f
    m[10] = (far + near) / (near - far)
    m[11] = -1
    m[14] = (2 * far * near) / (near - far) - CAMERA * m[10]
    m[15] = CAMERA
    return m
  }

  private model(x: number, y: number, scale: number, yaw: number, pitch: number) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch)
    const m = new Float32Array(16)
    m[0] = cy * scale; m[1] = sp * sy * scale; m[2] = -cp * sy * scale
    m[4] = 0; m[5] = cp * scale; m[6] = sp * scale
    m[8] = sy * scale; m[9] = -sp * cy * scale; m[10] = cp * cy * scale
    m[12] = x; m[13] = y; m[15] = 1
    return m
  }
}
