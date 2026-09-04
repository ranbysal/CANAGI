import { ArrowDown } from 'lucide-react'

export function Intro() {
  const enter = () => document.getElementById('explore')?.scrollIntoView({ behavior: 'smooth' })

  return (
    <section className="intro-screen" id="top" aria-labelledby="intro-title">
      <div className="intro-copy">
        <p className="eyebrow">CANADA · WORK · ARTIFICIAL INTELLIGENCE</p>
        <h1 id="intro-title">CANAGI</h1>
        <p className="intro-deck">What AI means for Canada&apos;s next generation of work</p>
        <p className="intro-byline">
          An interactive view of employment, opportunity, and technological change.
        </p>
        <p className="intro-date">SEPTEMBER 2026</p>
        <button className="enter-button" type="button" onClick={enter}>
          Explore the job market
          <ArrowDown size={17} aria-hidden="true" />
        </button>
      </div>
      <div className="intro-art" aria-hidden="true">
        <img src="/assets/canada-workforce.webp" alt="" width="1672" height="941" />
      </div>
    </section>
  )
}
