import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent, type Ref } from 'react'
import { useQuickPickShortcut, useQuickPickState } from './hooks'
import { QuickPickCommandResultsList } from './partials/QuickPickCommandResultsList'
import { QuickPickFileResultsList } from './partials/QuickPickFileResultsList'
import type { QuickPickCommand, QuickPickHandle } from './types'

export type { QuickPickCommand, QuickPickFileItem, QuickPickHandle } from './QuickPick.types'

interface QuickPickProps {
  ref?: Ref<QuickPickHandle>
  sources: string[]
  commands: QuickPickCommand[]
  onSelectPath: (path: string) => void
}

export function QuickPick({ ref, sources, commands, onSelectPath }: QuickPickProps) {
  const {
    open,
    query,
    setQuery,
    deferredQuery,
    deferredCommandQuery,
    isCommandMode,
    fileResults,
    commandResults,
    results,
    close,
    openFileMode,
    toggleFileMode,
    openCommandMode,
  } = useQuickPickState(sources, commands)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  useImperativeHandle(ref, () => ({
    openFileMode,
    openCommandMode,
  }))

  useQuickPickShortcut({ open, onToggleFileMode: toggleFileMode, onOpenCommandMode: openCommandMode })

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

  const handleSelectPath = (path: string) => {
    onSelectPath(path)
    close()
  }

  const handleSelectCommand = (command: QuickPickCommand) => {
    command.onExecute()
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
      if (isCommandMode) {
        const command = commandResults[highlightedIndex]
        if (command) handleSelectCommand(command)
      } else {
        const item = fileResults[highlightedIndex]
        if (item) handleSelectPath(item.key)
      }
    }
  }

  const focusInput = () => {
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      if (isCommandMode) {
        inputRef.current?.setSelectionRange(1, 1)
      } else {
        inputRef.current?.select()
      }
    })
  }

  const placeholder = isCommandMode
    ? 'Type the name of a command to run...'
    : 'Search files and folders...'

  const emptyMessage = isCommandMode
    ? deferredCommandQuery.trim()
      ? 'No matching commands'
      : 'Type to filter commands'
    : query.trim()
      ? 'No matching files or folders'
      : 'Start typing to search'

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
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'min(420px, 70vh)',
            overflow: 'hidden',
          }}
          onKeyDown={handleKeyDown}
        >
          <Box sx={{ px: 1.5, pt: 1.5, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              inputRef={inputRef}
              placeholder={placeholder}
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              variant="outlined"
              fullWidth
              autoComplete="off"
              slotProps={{ htmlInput: { spellCheck: 'false', style: { fontSize: 14 } } }}
            />
          </Box>
          {results.length === 0 ? (
            <Typography
              sx={{ px: 1.5, py: 2, color: 'text.secondary', fontSize: 13, textAlign: 'center' }}
            >
              {emptyMessage}
            </Typography>
          ) : isCommandMode ? (
            <QuickPickCommandResultsList
              results={commandResults}
              query={deferredCommandQuery}
              highlightedIndex={highlightedIndex}
              listRef={listRef}
              onHighlightIndex={setHighlightedIndex}
              onSelect={handleSelectCommand}
            />
          ) : (
            <QuickPickFileResultsList
              results={fileResults}
              query={deferredQuery}
              highlightedIndex={highlightedIndex}
              listRef={listRef}
              onHighlightIndex={setHighlightedIndex}
              onSelect={handleSelectPath}
            />
          )}
        </Box>
      </DialogContent>
    </Dialog>
  )
}
