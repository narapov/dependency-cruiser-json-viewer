import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import TextField from '@mui/material/TextField'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { QuickOpenResultsList } from './partials/QuickOpenResultsList'
import type { QuickOpenResultItem } from './QuickOpen.types'
import styles from './QuickOpen.module.css'

export type { QuickOpenResultItem } from './QuickOpen.types'

interface QuickOpenProps {
  open: boolean
  query: string
  deferredQuery: string
  results: QuickOpenResultItem[]
  onQueryChange: (query: string) => void
  onClose: () => void
  onSelect: (path: string) => void
}

export function QuickOpen({
  open,
  query,
  deferredQuery,
  results,
  onQueryChange,
  onClose,
  onSelect,
}: QuickOpenProps) {
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const handleQueryChange = useCallback(
    (value: string) => {
      setHighlightedIndex(0)
      onQueryChange(value)
    },
    [onQueryChange],
  )

  useEffect(() => {
    if (!open) return

    const highlighted = listRef.current?.children[highlightedIndex]
    if (highlighted instanceof HTMLElement) {
      highlighted.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex, open, results.length])

  const handleSelect = useCallback(
    (path: string) => {
      onSelect(path)
      onClose()
    },
    [onClose, onSelect],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault()
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        if (results.length === 0) return
        setHighlightedIndex((index) => Math.min(index + 1, results.length - 1))
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (results.length === 0) return
        setHighlightedIndex((index) => Math.max(index - 1, 0))
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        const item = results[highlightedIndex]
        if (item) handleSelect(item.key)
      }
    },
    [handleSelect, highlightedIndex, results],
  )

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }, [])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{ '& .MuiDialog-container': { alignItems: 'flex-start', pt: '12vh' } }}
      slotProps={{ transition: { onEntered: focusInput } }}
    >
      <DialogContent sx={{ p: 0 }}>
        <div className={styles.panel} onKeyDown={handleKeyDown}>
          <div className={styles.inputWrap}>
            <TextField
              inputRef={inputRef}
              className={styles.input}
              placeholder="Search files and folders..."
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              variant="standard"
              fullWidth
              autoComplete="off"
              slotProps={{ htmlInput: { spellCheck: 'false' } }}
            />
          </div>
          {results.length === 0 ? (
            <div className={styles.empty}>
              {query.trim() ? 'No matching files or folders' : 'Start typing to search'}
            </div>
          ) : (
            <QuickOpenResultsList
              results={results}
              query={deferredQuery}
              highlightedIndex={highlightedIndex}
              listRef={listRef}
              onHighlightIndex={setHighlightedIndex}
              onSelect={handleSelect}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
