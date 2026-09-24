import { Fragment, memo, type CSSProperties } from 'react'

interface RevealTextProps { text: string; delay?: number; step?: number }

/** Words rise from behind their own baseline mask; screen readers get one plain string. */
export const RevealText = memo(function RevealText({ text, delay = 0, step = 42 }: RevealTextProps) {
  const words = text.split(/\s+/).filter(Boolean)
  return (
    <span className="reveal-text" style={{ '--reveal-delay': `${delay}ms`, '--reveal-step': `${step}ms` } as CSSProperties}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, index) => (
          <Fragment key={index}>
            <span className="reveal-mask"><span className="reveal-word" style={{ '--word': index } as CSSProperties}>{word}</span></span>
            {index < words.length - 1 ? ' ' : null}
          </Fragment>
        ))}
      </span>
    </span>
  )
})
