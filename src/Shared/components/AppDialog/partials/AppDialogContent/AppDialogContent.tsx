import DialogContent from '@mui/material/DialogContent';
import { styled } from '@mui/material/styles';

/** Dialog content with standard top padding; override sx for flush layouts. */
export const AppDialogContent = styled(DialogContent)(({ theme }) => ({
  paddingTop: theme.spacing(1),
}));
