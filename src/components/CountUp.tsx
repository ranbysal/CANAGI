import { useEffect, useState } from 'react'

const NUMBER = /^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/

function parse(value: string) {
  const match = NUMBER.exec(value)
  if (!match) return null
  const [, prefix, digits, suffix] = match
  return { prefix, suffix, target: parseFloat(digits.replace(/,/g, '')), decimals: digits.includes('.') ? digits.split('.')[1].length : 0, grouped: digits.includes(',') }
}

/** Numbers count up from zero when they first appear; the final text is announced once. */
export function CountUp({ value, delay = 0, duration = 1150 }: { value: string; delay?: number; duration?: number }) {
  const [shown, setShown] = useState(() => {
    const parts = parse(value)
    return parts && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? `${parts.prefix}${(0).toFixed(parts.decimals)}${parts.suffix}` : value
  })
  useEffect(() => {
    const parts = parse(value)
    if (!parts || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(value); return }
    const format = (n: number) => parts.grouped ? n.toLocaleString('en-CA', { minimumFractionDigits: parts.decimals, maximumFractionDigits: parts.decimals }) : n.toFixed(parts.decimals)
    const start = performance.now() + delay
    let frame = 0
    const step = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - start) / duration))
      const eased = 1 - Math.pow(1 - t, 4)
      setShown(t >= 1 ? value : `${parts.prefix}${format(parts.target * eased)}${parts.suffix}`)
      if (t < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [value, delay, duration])
  return <span className="count-up"><span className="sr-only">{value}</span><span aria-hidden="true">{shown}</span></span>
}
