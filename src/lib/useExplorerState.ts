import { useCallback, useEffect, useRef, useState } from 'react'
import { parseExplorerState, serializeExplorerState, type ExplorerState } from './careers'

const hasOverlay = (state: ExplorerState) => Boolean(state.detail || state.comparison)
function writeUrl(state: ExplorerState, push = false) {
  const search = serializeExplorerState(state)
  const hash = window.location.hash || '#careers'
  const url = `${window.location.pathname}${search ? `?${search}` : ''}${hash}`
  const marker = push ? { ...window.history.state, canagiOverlay: true } : window.history.state
  window.history[push ? 'pushState' : 'replaceState'](marker, '', url)
}

/** A single, URL-backed state model for both views. Modal entries support native Back. */
export function useExplorerState(validIds: Set<string> | undefined) {
  const [state, setState] = useState(() => parseExplorerState(window.location.search))
  const current = useRef(state)
  const ids = useRef(validIds)
  const commit = useCallback((next: ExplorerState, push = false) => {
    current.current = next
    setState(next)
    writeUrl(next, push)
  }, [])

  useEffect(() => {
    ids.current = validIds
    if (!validIds) return
    const parsed = parseExplorerState(window.location.search, validIds)
    current.current = parsed
    setState(parsed)
    if (window.location.search) writeUrl(parsed)
  }, [validIds])

  useEffect(() => {
    const onPop = () => {
      const next = parseExplorerState(window.location.search, ids.current)
      if (hasOverlay(current.current) && !hasOverlay(next)) {
        next.compared = current.current.compared
        writeUrl(next)
      }
      current.current = next
      setState(next)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const update = useCallback((patch: Partial<ExplorerState>, push = false) => commit({ ...current.current, ...patch }, push), [commit])
  const toggleCompare = useCallback((id: string) => {
    const selected = current.current.compared
    const compared = selected.includes(id) ? selected.filter(value => value !== id) : selected.length < 3 ? [...selected, id] : selected
    update({ compared, comparison: current.current.comparison && compared.length >= 2 })
  }, [update])
  const closeOverlay = useCallback(() => {
    if (window.history.state?.canagiOverlay) window.history.back()
    else update({ detail: null, comparison: false })
  }, [update])

  return { state, update, toggleCompare, closeOverlay }
}
