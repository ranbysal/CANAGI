import { ArrowDown } from 'lucide-react'
import { useEffect, useRef, useSyncExternalStore, type CSSProperties, type RefObject } from 'react'
import { AnimatedText } from './AnimatedText'
import { RevealText } from './RevealText'
import { StageHud } from './StageHud'
import { motionState, subscribeMotion } from '../lib/motionStore'

const TITLE = 'CANAGI'
const readSupport = () => motionState.webgl

const finePointer = () => window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches

/** Letters near the pointer gain weight, like ink pooling under a nib. */
function useTitleResponse(ref: RefObject<HTMLSpanElement | null>, disabled: boolean) {
  useEffect(() => {
    const title = ref.current
    if (!title || disabled || !finePointer()) return
    const letters = Array.from(title.children) as HTMLElement[]
    let frame = 0, x = -1e4, y = -1e4
    const apply = () => {
      frame = 0
      for (const letter of letters) {
        const box = letter.getBoundingClientRect()
        const dx = x - (box.left + box.width / 2), dy = (y - (box.top + box.height / 2)) * 1.4
        const sigma = box.height * 0.75
        letter.style.setProperty('--wght', (300 + 260 * Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma))).toFixed(0))
      }
    }
    const onMove = (event: PointerEvent) => { x = event.clientX; y = event.clientY; frame ||= requestAnimationFrame(apply) }
    const onLeave = (event: MouseEvent) => { if (!event.relatedTarget) { x = y = -1e4; frame ||= requestAnimationFrame(apply) } }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('mouseout', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('mouseout', onLeave)
      letters.forEach(letter => letter.style.removeProperty('--wght'))
    }
  }, [ref, disabled])
}

/** The primary action leans toward a nearby pointer and settles back when it leaves. */
function useMagnet(ref: RefObject<HTMLButtonElement | null>, disabled: boolean) {
  useEffect(() => {
    const button = ref.current
    if (!button || disabled || !finePointer()) return
    let frame = 0
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const box = button.getBoundingClientRect()
        const dx = event.clientX - (box.left + box.width / 2), dy = event.clientY - (box.top + box.height / 2)
        const near = Math.hypot(dx / (box.width / 2 + 70), dy / (box.height / 2 + 60)) < 1
        button.style.setProperty('--pull-x', near ? `${(dx * 0.16).toFixed(1)}px` : '0px')
        button.style.setProperty('--pull-y', near ? `${(dy * 0.28).toFixed(1)}px` : '0px')
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      button.style.removeProperty('--pull-x')
      button.style.removeProperty('--pull-y')
    }
  }, [ref, disabled])
}

export function Intro({ onEnter, busy, jobs }: { onEnter: () => void; busy: boolean; jobs: number | null }) {
  const titleRef = useRef<HTMLSpanElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const webgl = useSyncExternalStore(subscribeMotion, readSupport, () => true)
  useTitleResponse(titleRef, busy)
  useMagnet(buttonRef, busy)
  return (
    <section className="intro-screen" id="top" aria-labelledby="intro-title">
      <div className="intro-copy">
        <p className="eyebrow"><AnimatedText text="CANADA · WORK · ARTIFICIAL INTELLIGENCE" delay={180} duration={320} /></p>
        <h1 id="intro-title" className="intro-title" tabIndex={-1}>
          <span className="sr-only">{TITLE}</span>
          <span className="title-letters" ref={titleRef} aria-hidden="true">
            {Array.from(TITLE).map((letter, index) => <span className="title-letter" style={{ '--letter': index } as CSSProperties} key={index}>{letter}</span>)}
          </span>
        </h1>
        <p className="intro-deck"><RevealText text="What AI means for Canada's next generation of work" delay={380} /></p>
        <p className="intro-byline"><RevealText text="Explore 516 occupations, compare career fields, and understand the work behind the numbers." delay={560} step={14} /></p>
        <p className="intro-date"><AnimatedText text="SEPTEMBER 2026 · SOURCE DATES & SCORING EXPLAINED INSIDE" delay={760} duration={290} /></p>
        <div className="entry-action">
          <button className="enter-button" ref={buttonRef} type="button" onClick={onEnter} aria-busy={busy} disabled={busy}>
            <span className="enter-label">Explore the job market</span>
            <span className="enter-arrow"><ArrowDown size={16} aria-hidden="true" /></span>
          </button>
        </div>
      </div>
      <div className="intro-art" aria-hidden="true">
        {!webgl && <img src="/assets/canada-workforce.webp" alt="" width="1672" height="941" />}
        <StageHud jobs={jobs} />
      </div>
      <div className="stage-rail">
        <span className="stage-rail-label">Scroll to explore</span>
        <span className="stage-rail-track" aria-hidden="true">{[0, 1, 2].map(segment => <i key={segment} style={{ '--segment': segment } as CSSProperties} />)}</span>
      </div>
    </section>
  )
}
