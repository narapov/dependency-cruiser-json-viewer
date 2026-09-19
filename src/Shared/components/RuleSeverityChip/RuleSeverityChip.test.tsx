// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { renderHook, screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { RuleSeverityChip } from './RuleSeverityChip';

describe('RuleSeverityChip', () => {
  it('renders the translated severity label', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<RuleSeverityChip severity="error" />);

    expect(screen.getByText(i18n.current.t('rules.severity.error'))).toBeInTheDocument();
  });
});
