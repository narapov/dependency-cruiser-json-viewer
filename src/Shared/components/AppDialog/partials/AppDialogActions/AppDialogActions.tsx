import DialogActions from '@mui/material/DialogActions';
import { styled } from '@mui/material/styles';

/** Dialog actions with standard horizontal and bottom padding. */
export const AppDialogActions = styled(DialogActions)(({ theme }) => ({
  paddingLeft: theme.spacing(3),
  paddingRight: theme.spacing(3),
  paddingBottom: theme.spacing(2),
}));
