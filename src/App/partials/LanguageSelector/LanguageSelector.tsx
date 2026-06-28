import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Tooltip from '@mui/material/Tooltip'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGE_OPTIONS, type LanguageOptionValue } from '../../../i18n'

export function LanguageSelector() {
  const { i18n, t } = useTranslation()
  const currentLanguage = i18n.language as LanguageOptionValue
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = anchorEl != null

  const currentOption = LANGUAGE_OPTIONS.find((option) => option.value === currentLanguage)
  const currentLabel = currentOption ? t(currentOption.labelKey) : currentLanguage.toUpperCase()

  const handleSelect = (value: LanguageOptionValue) => {
    void i18n.changeLanguage(value)
    setAnchorEl(null)
  }

  return (
    <>
      <Tooltip title={currentLabel}>
        <Button
          size="small"
          aria-label={t('language.label')}
          aria-haspopup="true"
          aria-expanded={open}
          onClick={(event) => setAnchorEl(event.currentTarget)}
          sx={{minWidth: 'auto'}}
        >
          {currentLanguage.toUpperCase()}
        </Button>
      </Tooltip>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        {LANGUAGE_OPTIONS.map(({ value, labelKey }) => (
          <MenuItem
            key={value}
            selected={value === currentLanguage}
            onClick={() => handleSelect(value)}
            sx={{ fontWeight: value === currentLanguage ? 600 : 400 }}
          >
            {t(labelKey)}
          </MenuItem>
        ))}
      </Menu>
    </>
  )
}
