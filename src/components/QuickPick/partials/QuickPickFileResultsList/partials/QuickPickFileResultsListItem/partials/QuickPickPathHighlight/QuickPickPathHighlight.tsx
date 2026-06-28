import { styled } from '@mui/material/styles'
import { highlightBaseStyles } from '../../helpers/highlightBaseStyles'

export const QuickPickPathHighlight = styled('span')(({ theme }) => ({
  ...highlightBaseStyles(theme),
  color: theme.palette.text.secondary,
}))
