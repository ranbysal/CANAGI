import { Fragment, memo, type CSSProperties } from 'react'

interface AnimatedTextProps {
  text: string
  delay?: number
  duration?: number
  limit?: number
}

/** Reserve the complete layout; reveal complete glyphs without any masks. */
export const AnimatedText = memo(function AnimatedText({ text, delay, duration = 440, limit = 240 }: AnimatedTextProps) {
  const count = Math.min(Array.from(text).length, limit)
  const step = Math.min(24, duration / Math.max(1, count))
  let index = 0
  const style = {
    '--char-step': `${step.toFixed(2)}ms`,
    ...(delay === undefined ? {} : { '--text-delay': `${delay}ms` }),
  } as CSSProperties
  return (
    <span className="animated-text" style={style}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.split(/(\s+)/).map((word, wordIndex) => {
          if (/^\s+$/.test(word)) return <Fragment key={wordIndex}>{word}</Fragment>
          return (
            <span className="animated-word" key={wordIndex}>
              {Array.from(word).map((letter, letterIndex) => (
                <span className="animated-char" style={{ '--char-index': Math.min(index++, limit) } as CSSProperties} key={letterIndex}>{letter}</span>
              ))}
            </span>
          )
        })}
      </span>
    </span>
  )
})
