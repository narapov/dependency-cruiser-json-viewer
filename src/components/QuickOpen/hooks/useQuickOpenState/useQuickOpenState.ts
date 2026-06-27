import { useDeferredValue, useState } from 'react'
import { buildSearchItems, searchPaths } from '../../helpers'

export function useQuickOpenState(sources: string[]) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const allItems = buildSearchItems(sources)
  const results = searchPaths(allItems, deferredQuery)

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  return {
    open,
    setOpen,
    query,
    setQuery,
    deferredQuery,
    results,
    close,
  }
}
