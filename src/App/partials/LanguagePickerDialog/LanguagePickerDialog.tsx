import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGE_OPTIONS, type LanguageOptionValue } from '../../../i18n'

interface LanguagePickerDialogProps {
  open: boolean
  onClose: () => void
}

function getLanguageIndex(language: LanguageOptionValue | undefined): number {
  if (language == null) return 0
  const index = LANGUAGE_OPTIONS.findIndex((option) => option.value === language)
  return index === -1 ? 0 : index
}

export function LanguagePickerDialog({ open, onClose }: LanguagePickerDialogProps) {
  const { i18n, t } = useTranslation()
  const currentLanguage = i18n.language as LanguageOptionValue
  const [highlightedIndex, setHighlightedIndex] = useState(() => getLanguageIndex(currentLanguage))
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setHighlightedIndex(getLanguageIndex(currentLanguage))
  }, [open, currentLanguage])

  useEffect(() => {
    if (!open) return

    const highlighted = listRef.current?.children[highlightedIndex]
    if (highlighted instanceof HTMLElement) {
      highlighted.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightedIndex, open])

  const focusList = () => {
    requestAnimationFrame(() => {
      containerRef.current?.focus()
    })
  }

  const handleSelect = (value: LanguageOptionValue) => {
    void i18n.changeLanguage(value)
    onClose()
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((index) => Math.min(index + 1, LANGUAGE_OPTIONS.length - 1))
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((index) => Math.max(index - 1, 0))
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const option = LANGUAGE_OPTIONS[highlightedIndex]
      if (option) handleSelect(option.value)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      sx={{ '& .MuiDialog-container': { alignItems: 'flex-start', pt: '12vh' } }}
      slotProps={{ transition: { onEntered: focusList } }}
    >
      <DialogTitle sx={{ pb: 1, fontSize: 16 }}>{t('language.setLanguage')}</DialogTitle>
      <DialogContent sx={{ p: 0, pb: 1 }}>
        <Box
          ref={containerRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          sx={{ outline: 'none' }}
        >
          <Box
            component="ul"
            ref={listRef}
            role="listbox"
            aria-label={t('language.languageOptions')}
            sx={{
              m: 0,
              py: 0.5,
              px: 0,
              listStyle: 'none',
            }}
          >
            {LANGUAGE_OPTIONS.map((option, index) => {
              const isActive = currentLanguage === option.value
              const highlighted = index === highlightedIndex

              return (
                <Box
                  key={option.value}
                  component="li"
                  role="option"
                  aria-selected={highlighted}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => handleSelect(option.value)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    py: 0.75,
                    cursor: 'pointer',
                    fontSize: 13,
                    bgcolor: highlighted ? 'action.selected' : 'transparent',
                    fontWeight: isActive ? 600 : 400,
                    '&:hover': {
                      bgcolor: highlighted ? 'action.selected' : 'action.hover',
                    },
                  }}
                >
                  <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 'inherit' }}>
                    {t(option.labelKey)}
                  </Typography>
                  {isActive && (
                    <Typography
                      component="span"
                      sx={{ ml: 1, fontSize: 'inherit', color: 'text.secondary' }}
                    >
                      {t('language.active')}
                    </Typography>
                  )}
                </Box>
              )
            })}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
