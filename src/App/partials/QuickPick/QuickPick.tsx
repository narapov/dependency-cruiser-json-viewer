import { useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent, type Ref } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import TextField from '@mui/material/TextField';

import { useQuickPickShortcut, useQuickPickState } from './hooks';
import { QuickPickCommandResultsList } from './partials/QuickPickCommandResultsList';
import { QuickPickEmptyMessage } from './partials/QuickPickEmptyMessage';
import { QuickPickFileResultsList } from './partials/QuickPickFileResultsList';
import type { QuickPickCommand, QuickPickHandle } from './types';

export type { QuickPickCommand, QuickPickFileItem, QuickPickHandle } from './QuickPick.types';

interface QuickPickProps {
  ref?: Ref<QuickPickHandle>;
  sources: string[];
  commands: QuickPickCommand[];
  onSelectPath: (path: string) => void;
}

export function QuickPick({ ref, sources, commands, onSelectPath }: QuickPickProps) {
  const { t } = useTranslation();
  const {
    open,
    query,
    setQuery,
    normalizedQuery,
    normalizedDeferredQuery,
    isCommandMode,
    fileResults,
    commandResults,
    results,
    close,
    openFileMode,
    toggleFileMode,
    openCommandMode,
  } = useQuickPickState(sources, commands);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const resetHighlight = () => {
    setHighlightedIndex(0);
  };

  const handleClose = () => {
    resetHighlight();
    close();
  };

  const handleOpenFileMode = () => {
    resetHighlight();
    openFileMode();
  };

  const handleOpenCommandMode = () => {
    resetHighlight();
    openCommandMode();
  };

  const handleToggleFileMode = () => {
    resetHighlight();
    toggleFileMode();
  };

  useImperativeHandle(ref, () => ({
    openFileMode: handleOpenFileMode,
    openCommandMode: handleOpenCommandMode,
  }));

  useQuickPickShortcut({
    open,
    onToggleFileMode: handleToggleFileMode,
    onOpenCommandMode: handleOpenCommandMode,
  });

  const handleQueryChange = (value: string) => {
    resetHighlight();
    setQuery(value);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    const highlighted = listRef.current?.children[highlightedIndex];
    if (highlighted instanceof HTMLElement) {
      highlighted.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, open, results.length]);

  const handleSelectPath = (path: string) => {
    onSelectPath(path);
    handleClose();
  };

  const handleSelectCommand = (command: QuickPickCommand) => {
    command.onExecute();
    handleClose();
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'Tab': {
        event.preventDefault();
        return;
      }
      case 'ArrowDown': {
        event.preventDefault();
        if (results.length === 0) {
          return;
        }
        setHighlightedIndex(index => Math.min(index + 1, results.length - 1));
        return;
      }
      case 'ArrowUp': {
        event.preventDefault();
        if (results.length === 0) {
          return;
        }
        setHighlightedIndex(index => Math.max(index - 1, 0));
        return;
      }
      case 'Enter': {
        event.preventDefault();
        if (isCommandMode) {
          const command = commandResults[highlightedIndex];
          if (command) {
            handleSelectCommand(command);
          }
        } else {
          const item = fileResults[highlightedIndex];
          if (item) {
            handleSelectPath(item.key);
          }
        }
        return;
      }
      default: {
        return;
      }
    }
  };

  const focusInput = () => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      if (isCommandMode) {
        inputRef.current?.setSelectionRange(1, 1);
      } else {
        inputRef.current?.select();
      }
    });
  };

  const placeholder = isCommandMode ? t('quickPick.commandPlaceholder') : t('quickPick.filePlaceholder');

  const renderResults = () => {
    if (results.length === 0) {
      return <QuickPickEmptyMessage isCommandMode={isCommandMode} normalizedQuery={normalizedQuery} />;
    }

    if (isCommandMode) {
      return (
        <QuickPickCommandResultsList
          results={commandResults}
          query={normalizedDeferredQuery}
          highlightedIndex={highlightedIndex}
          listRef={listRef}
          onHighlightIndex={setHighlightedIndex}
          onSelect={handleSelectCommand}
        />
      );
    }

    return (
      <QuickPickFileResultsList
        results={fileResults}
        query={normalizedDeferredQuery}
        highlightedIndex={highlightedIndex}
        listRef={listRef}
        onHighlightIndex={setHighlightedIndex}
        onSelect={handleSelectPath}
      />
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      sx={{ '& .MuiDialog-container': { alignItems: 'flex-start', pt: '12vh' } }}
      slotProps={{ transition: { onEntered: focusInput } }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'min(420px, 70vh)',
            overflow: 'hidden',
          }}
          onKeyDown={handleKeyDown}
        >
          <Box sx={{ px: 1.5, pt: 1.5, pb: 1, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              inputRef={inputRef}
              placeholder={placeholder}
              value={query}
              onChange={event => handleQueryChange(event.target.value)}
              variant="outlined"
              fullWidth
              autoComplete="off"
              slotProps={{ htmlInput: { spellCheck: 'false', style: { fontSize: 14 } } }}
            />
          </Box>
          {renderResults()}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
