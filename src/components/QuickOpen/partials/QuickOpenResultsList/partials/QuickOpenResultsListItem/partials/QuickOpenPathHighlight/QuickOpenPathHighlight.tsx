import { styled } from '@mui/material/styles'
import { highlightBaseStyles } from '../../helpers/highlightBaseStyles'

export const QuickOpenPathHighlight = styled('span')(({ theme }) => ({
  ...highlightBaseStyles(theme),
  color: theme.palette.text.secondary,
}))
