/** Format prose for display without changing source records or identifiers. */
export function displayCopy(text: string) {
  return text.replace(/[\u2013\u2014]/g, ' to ').replace(/\s+-\s+/g, ', ').replace(/([A-Za-z])-(?=[A-Za-z])/g, '$1 ')
}

const proseFields = new Set(['title', 'name', 'label', 'description', 'explanation', 'note', 'reason', 'rationale'])
export function displayRecord<T>(value: T): T {
  if (Array.isArray(value)) return value.map(item => displayRecord(item)) as T
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
    typeof item === 'string' && proseFields.has(key) ? displayCopy(item) : displayRecord(item),
  ])) as T
  return value
}
