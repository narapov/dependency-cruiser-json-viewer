import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { QuickPickFileResultsList } from '../../../QuickPick';
import { usePathSearchState } from '../../hooks';

interface PathSearchBodyProps {
  sources: string[];
  exactSourcesOnly?: boolean;
  onSelect: (path: string) => void;
}

/** Fuzzy file/folder search field and results list (QuickPick file-mode chrome). */
export function PathSearchBody(props: PathSearchBodyProps) {
  const { sources, exactSourcesOnly = false, onSelect } = props;

  const { t } = useTranslation();
  const { query, setQuery, deferredQuery, results } = usePathSearchState({ sources, exactSourcesOnly });
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, []);

  useEffect(() => {
    const highlighted = listRef.current?.children[highlightedIndex];
    if (highlighted instanceof HTMLElement) {
      highlighted.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, results.length]);

  const handleQueryChange = (value: string) => {
    setHighlightedIndex(0);
    setQuery(value);
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
        const item = results[highlightedIndex];
        if (item) {
          onSelect(item.key);
        }
        return;
      }
      default: {
        return;
      }
    }
  };

  return (
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
          placeholder={t('quickPick.filePlaceholder')}
          value={query}
          onChange={event => handleQueryChange(event.target.value)}
          variant="outlined"
          fullWidth
          autoComplete="off"
          slotProps={{ htmlInput: { spellCheck: 'false', style: { fontSize: 14 } } }}
        />
      </Box>
      {results.length === 0 ? (
        <Typography sx={{ px: 1.5, py: 2, color: 'text.secondary', fontSize: 13, textAlign: 'center' }}>
          {query.trim() ? t('quickPick.noMatchingFiles') : t('quickPick.startTyping')}
        </Typography>
      ) : (
        <QuickPickFileResultsList
          results={results}
          query={deferredQuery}
          highlightedIndex={highlightedIndex}
          listRef={listRef}
          onHighlightIndex={setHighlightedIndex}
          onSelect={onSelect}
        />
      )}
    </Box>
  );
}
