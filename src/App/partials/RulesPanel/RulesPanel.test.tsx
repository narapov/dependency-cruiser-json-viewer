// @vitest-environment jsdom

import type { IFlattenedRuleSet, IViolation } from 'dependency-cruiser';
import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { fireEvent, renderHook, screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { RulesPanel } from './RulesPanel';

const ruleSet: IFlattenedRuleSet = {
  forbidden: [
    {
      name: 'domain-only-domain',
      severity: 'error',
      from: { path: '^src/domain/' },
      to: { pathNot: '^src/domain/' },
    },
    {
      name: 'no-circular',
      severity: 'warn',
      from: {},
      to: { circular: true },
    },
  ],
};

const violations: IViolation[] = [
  {
    type: 'dependency',
    rule: { name: 'domain-only-domain', severity: 'error' },
    from: 'src/domain/a.ts',
    to: 'src/App/App.tsx',
  },
];

describe('RulesPanel', () => {
  it('renders rule names under with/without violation sections', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <RulesPanel
        ruleSetUsed={ruleSet}
        violations={violations}
        sources={['src/domain/a.ts', 'src/App/App.tsx']}
        onSelectViolationPaths={vi.fn()}
      />,
    );

    expect(screen.getByText(`${i18n.current.t('rules.withViolations')} (1)`)).toBeInTheDocument();
    expect(screen.getByText(`${i18n.current.t('rules.withoutViolations')} (1)`)).toBeInTheDocument();
    expect(screen.getByText('domain-only-domain')).toBeInTheDocument();
    expect(screen.getByText('no-circular')).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('rules.violationsCount', { count: 1 }))).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('rules.violationsCount', { count: 0 }))).toBeInTheDocument();
  });

  it('filters rules by name', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <RulesPanel
        ruleSetUsed={ruleSet}
        violations={violations}
        sources={['src/domain/a.ts', 'src/App/App.tsx']}
        onSelectViolationPaths={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: i18n.current.t('rules.filterPlaceholder') }), {
      target: { value: 'circular' },
    });

    expect(screen.queryByText('domain-only-domain')).not.toBeInTheDocument();
    expect(screen.getByText('no-circular')).toBeInTheDocument();
    expect(screen.queryByText(`${i18n.current.t('rules.withViolations')} (1)`)).not.toBeInTheDocument();
    expect(screen.getByText(`${i18n.current.t('rules.withoutViolations')} (1)`)).toBeInTheDocument();
  });

  it('shows no-matches message when filter excludes all rules', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <RulesPanel
        ruleSetUsed={ruleSet}
        violations={violations}
        sources={['src/domain/a.ts', 'src/App/App.tsx']}
        onSelectViolationPaths={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: i18n.current.t('rules.filterPlaceholder') }), {
      target: { value: 'zzz-missing' },
    });

    expect(screen.getByText(i18n.current.t('rules.noMatches'))).toBeInTheDocument();
  });

  it('does not expand a rule with no violations', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <RulesPanel
        ruleSetUsed={ruleSet}
        violations={violations}
        sources={['src/domain/a.ts', 'src/App/App.tsx']}
        onSelectViolationPaths={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('no-circular'));

    expect(screen.queryByText(i18n.current.t('rules.noViolations'))).not.toBeInTheDocument();
  });

  it('calls onSelectViolationPaths when a violation is clicked', () => {
    const onSelectViolationPaths = vi.fn();

    renderWithTheme(
      <RulesPanel
        ruleSetUsed={ruleSet}
        violations={violations}
        sources={['src/domain/a.ts', 'src/App/App.tsx']}
        onSelectViolationPaths={onSelectViolationPaths}
      />,
    );

    fireEvent.click(screen.getByText('domain-only-domain'));
    fireEvent.click(screen.getByText('src/domain/a.ts → src/App/App.tsx'));

    expect(onSelectViolationPaths).toHaveBeenCalledWith(['src/domain/a.ts', 'src/App/App.tsx']);
  });

  it('opens rule JSON dialog from the view button', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <RulesPanel
        ruleSetUsed={ruleSet}
        violations={violations}
        sources={['src/domain/a.ts']}
        onSelectViolationPaths={vi.fn()}
      />,
    );

    const jsonButtons = screen.getAllByRole('button', { name: i18n.current.t('rules.viewJson') });
    fireEvent.click(jsonButtons[0]!);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(i18n.current.t('rules.jsonTitle', { name: 'domain-only-domain' }))).toBeInTheDocument();
    expect(screen.getByText(/"name": "domain-only-domain"/)).toBeInTheDocument();
  });
});
