// @vitest-environment jsdom

import { useTranslation } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { renderHook, screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { RuleViolationsCountChip } from './RuleViolationsCountChip';

describe('RuleViolationsCountChip', () => {
  it('renders the translated violations count', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(<RuleViolationsCountChip count={3} />);

    expect(screen.getByText(i18n.current.t('rules.violationsCount', { count: 3 }))).toBeInTheDocument();
  });

  it('renders nothing when count is 0', () => {
    const { container } = renderWithTheme(<RuleViolationsCountChip count={0} />);

    expect(container).toBeEmptyDOMElement();
  });
});
