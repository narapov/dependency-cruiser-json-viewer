// @vitest-environment jsdom

import type { IFlattenedRuleSet, IModule, IViolation } from 'dependency-cruiser';
import { useTranslation } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { renderHook, screen } from '@testing-library/react';

import { renderWithTheme } from '@/testsUtils';

import { ApplicableRulesPanel } from './ApplicableRulesPanel';

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

const modules = [{ source: 'src/domain/a.ts', dependencies: [], dependents: [], valid: true }] as IModule[];

describe('ApplicableRulesPanel', () => {
  it('renders applicable rules under with/without violation sections', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <ApplicableRulesPanel
        path="src/domain/a.ts"
        modules={modules}
        ruleSetUsed={ruleSet}
        violations={violations}
        onClose={vi.fn()}
        onShowInGraph={vi.fn()}
        onSelectViolationPaths={vi.fn()}
      />,
    );

    expect(screen.getByText(i18n.current.t('applicableRulesPanel.title'))).toBeInTheDocument();
    expect(screen.getByText(`${i18n.current.t('rules.withViolations')} (1)`)).toBeInTheDocument();
    expect(screen.getByText(`${i18n.current.t('rules.withoutViolations')} (1)`)).toBeInTheDocument();
    expect(screen.getByText('domain-only-domain')).toBeInTheDocument();
    expect(screen.getByText('no-circular')).toBeInTheDocument();
  });

  it('shows empty state when no rules apply', () => {
    const { result: i18n } = renderHook(() => useTranslation());

    renderWithTheme(
      <ApplicableRulesPanel
        path="src/other/a.ts"
        modules={[{ source: 'src/other/a.ts', dependencies: [], dependents: [], valid: true }] as IModule[]}
        ruleSetUsed={{
          forbidden: [
            {
              name: 'domain-only',
              severity: 'error',
              from: { path: '^src/domain/' },
              to: {},
            },
          ],
        }}
        violations={undefined}
        onClose={vi.fn()}
        onShowInGraph={vi.fn()}
        onSelectViolationPaths={vi.fn()}
      />,
    );

    expect(screen.getByText(i18n.current.t('applicableRulesPanel.empty'))).toBeInTheDocument();
    expect(screen.queryByText(`${i18n.current.t('rules.withViolations')} (0)`)).not.toBeInTheDocument();
  });
});
