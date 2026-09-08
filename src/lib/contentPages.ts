import { hasExplorerParams } from './careers'

export type ContentPage = 'overview' | 'careers' | 'fields'
export type SitePage = 'home' | ContentPage
export const PAGE_HASH: Record<SitePage, string> = {
  home: '#top', overview: '#visualizer', careers: '#careers', fields: '#careers/fields',
}

/** Explicit page addresses take priority over retained search and comparison state. */
export function pageFromLocation(hash: string, search: string): SitePage {
  if (hash === '#top') return 'home'
  if (hash === '#visualizer' || hash === '#methodology') return 'overview'
  if (hash === '#careers') return 'careers'
  if (hash === '#careers/fields') return 'fields'
  // Keep links shared before the pages were separated useful.
  if (new URLSearchParams(search).get('view') === 'fields') return 'fields'
  if (hasExplorerParams(search)) return 'careers'
  return hash === '#explore' ? 'overview' : 'home'
}

export function pageAddress(page: SitePage, pathname: string, search: string) {
  return `${pathname}${search}${PAGE_HASH[page]}`
}
