import Dialog, { type DialogProps } from '@mui/material/Dialog';
import { styled } from '@mui/material/styles';

const AppDialogRoot = styled(Dialog)({
  variants: [
    {
      props: { fullScreen: false },
      style: {
        '& .MuiDialog-container': { alignItems: 'flex-start', paddingTop: '12vh' },
      },
    },
  ],
});

/** App dialog shell with top-anchored positioning and fullWidth by default. */
export function AppDialog(props: DialogProps) {
  const { fullWidth = true, fullScreen = false, ...rest } = props;

  return <AppDialogRoot fullWidth={fullWidth} fullScreen={fullScreen} {...rest} />;
}
