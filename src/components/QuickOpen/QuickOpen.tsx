import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import TextField from '@mui/material/TextField'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useQuickOpenShortcut, useQuickOpenState } from './hooks'
import { QuickOpenResultsList } from './partials/QuickOpenResultsList'
import styles from './QuickOpen.module.css'

export type { QuickOpenResultItem } from './QuickOpen.types'

interface QuickOpenProps {
  sources: string[]
  onSelect: (path: string) => void
}

export function QuickOpen({ sources, onSelect }: QuickOpenProps) {
  const { open, setOpen, query, setQuery, deferredQuery, results, close } =
    useQuickOpenState(sources)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useQuickOpenShortcut(open, setOpen)

  const handleQueryChange = (value: string) => {
    setHighlightedIndex(0)
    setQuery(value)
  }

  useEffect(() => {
    if (!open) return

    const highlighted = listRef.current?.children[highlightedIndex]
    if (highlighted instanceof HTMLElement) {
      highlighted.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex, open, results.length])

  const handleSelect = (path: string) => {
    onSelect(path)
    close()
  }

  const handleKeyDown = (event: KeyboardEvent) => {
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
  }

  const focusInput = () => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    })
  }

  return (
    <Dialog
      open={open}
      onClose={close}
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
