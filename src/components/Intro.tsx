import { ArrowDown } from 'lucide-react'
import { AnimatedText } from './AnimatedText'

export function Intro({ onEnter, busy }: { onEnter: () => void; busy: boolean }) {
  return (
    <section className="intro-screen" id="top" aria-labelledby="intro-title">
      <div className="intro-copy">
        <p className="eyebrow"><AnimatedText text="CANADA · WORK · ARTIFICIAL INTELLIGENCE" delay={180} duration={320} /></p>
        <h1 id="intro-title" tabIndex={-1}><AnimatedText text="CANAGI" delay={240} duration={350} /></h1>
        <p className="intro-deck"><AnimatedText text="What AI means for Canada's next generation of work" delay={280} duration={380} /></p>
        <p className="intro-byline"><AnimatedText text="Explore 516 occupations, compare career fields, and understand the work behind the numbers." delay={320} duration={390} /></p>
        <p className="intro-date"><AnimatedText text="SEPTEMBER 2026 · SOURCE DATES & SCORING EXPLAINED INSIDE" delay={360} duration={290} /></p>
        <div className="entry-action">
          <button className="enter-button" type="button" onClick={onEnter} aria-busy={busy} disabled={busy}>
            <span>Explore the job market</span>
            <ArrowDown size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="intro-art" aria-hidden="true">
        <img src="/assets/canada-workforce.webp" alt="" width="1672" height="941" />
      </div>
      <p className="scroll-hint"><span>scroll to enter</span></p>
    </section>
  )
}
