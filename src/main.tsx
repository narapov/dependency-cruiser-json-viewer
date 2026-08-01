import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClientProvider } from '@tanstack/react-query';

import './i18n';
import './Shared/styles/graphTheme.css';
import './index.css';

import { ErrorBoundaryFallback, queryClient, THEME_STORAGE_KEY } from '@/Shared';
import { muiTheme } from '@/Shared/styles/muiTheme';

import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={muiTheme} modeStorageKey={THEME_STORAGE_KEY} defaultMode="system">
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary
          FallbackComponent={ErrorBoundaryFallback}
          onError={(error, info) => {
            console.error('ErrorBoundary caught an error', error, info.componentStack);
          }}
        >
          <App />
        </ErrorBoundary>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
);
