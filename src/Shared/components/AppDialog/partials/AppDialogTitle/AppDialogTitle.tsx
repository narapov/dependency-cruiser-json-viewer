import DialogTitle from '@mui/material/DialogTitle';
import { styled } from '@mui/material/styles';

/** Compact dialog title used across app modals. */
export const AppDialogTitle = styled(DialogTitle)(({ theme }) => ({
  paddingBottom: theme.spacing(1),
  fontSize: 16,
}));
