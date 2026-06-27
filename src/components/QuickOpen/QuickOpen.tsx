import { Input, Modal, type InputRef } from 'antd'
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import type { TreeNodeData } from '../Tree'
import { flattenTreeNodes, searchTreeNodes } from '../../lib/searchTreeNodes'
import { QuickOpenResultsList } from './components/QuickOpenResultsList'
import styles from './QuickOpen.module.css'

interface QuickOpenProps {
  open: boolean
  treeData: TreeNodeData[]
  onClose: () => void
  onSelect: (path: string) => void
}

export function QuickOpen({ open, treeData, onClose, onSelect }: QuickOpenProps) {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const inputRef = useRef<InputRef>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const allItems = useMemo(() => flattenTreeNodes(treeData), [treeData])
  const results = useMemo(
    () => searchTreeNodes(allItems, deferredQuery),
    [allItems, deferredQuery],
  )

  const reset = useCallback(() => {
    setQuery('')
    setHighlightedIndex(0)
  }, [])

  useEffect(() => {
    if (!open) return
    reset()
  }, [open, reset])

  useEffect(() => {
    setHighlightedIndex(0)
  }, [deferredQuery])

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

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      closable={false}
      centered={false}
      width={600}
      style={{ top: '12vh', paddingBottom: 0 }}
      styles={{ body: { padding: 0 }, container: { padding: 0, overflow: 'hidden' } }}
      mask={{ closable: true }}
      destroyOnHidden
      afterOpenChange={(visible) => {
        if (!visible) return
        requestAnimationFrame(() => {
          inputRef.current?.focus()
          inputRef.current?.select()
        })
      }}
    >
      <div className={styles.panel} onKeyDown={handleKeyDown}>
        <div className={styles.inputWrap}>
          <Input
            ref={inputRef}
            className={styles.input}
            placeholder="Search files and folders..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            variant="borderless"
            autoComplete="off"
            spellCheck={false}
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
    </Modal>
  )
}
