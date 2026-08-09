import type { IModule } from 'dependency-cruiser';
import { describe, expect, it } from 'vitest';

import { CIRCULAR_EDGE_COLOR, ERROR_EDGE_COLOR, TYPE_ONLY_CIRCULAR_EDGE_COLOR, WARNING_EDGE_COLOR } from '@/Shared';

import { buildGraphEdges } from './buildGraphEdges';

function moduleAt(source: string, dependencies: IModule['dependencies'] = []): IModule {
  return { source, dependencies, dependents: [], valid: true } as IModule;
}

const typeOnlyDep = (resolved: string, circular = false) =>
  ({
    resolved,
    circular,
    dependencyTypes: ['local', 'type-only', 'import'],
  }) as IModule['dependencies'][0];

const valueDep = (resolved: string, circular = false) =>
  ({
    resolved,
    circular,
    dependencyTypes: ['local', 'import'],
  }) as IModule['dependencies'][0];

describe('buildGraphEdges', () => {
  it('creates an edge when both endpoints are selected and visible', () => {
    const modules = [moduleAt('src/foo/a.ts', [valueDep('src/foo/b.ts')]), moduleAt('src/foo/b.ts')];
    const selectedSet = new Set(['src/foo/a.ts', 'src/foo/b.ts']);
    const visibleNodeIds = new Set(['src/foo/a.ts', 'src/foo/b.ts']);

    const edges = buildGraphEdges(modules, selectedSet, new Set(['src', 'src/foo']), visibleNodeIds);

    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({
      id: 'src/foo/a.ts->src/foo/b.ts',
      source: 'src/foo/a.ts',
      target: 'src/foo/b.ts',
    });
  });

  it('skips edges when the target is not selected', () => {
    const modules = [moduleAt('src/foo/a.ts', [valueDep('src/foo/b.ts')]), moduleAt('src/foo/b.ts')];
    const selectedSet = new Set(['src/foo/a.ts']);
    const visibleNodeIds = new Set(['src/foo/a.ts']);

    expect(buildGraphEdges(modules, selectedSet, new Set(['src', 'src/foo']), visibleNodeIds)).toEqual([]);
  });

  it('skips dependencies without a resolved path', () => {
    const unresolved = { dependencyTypes: ['local', 'import'] } as IModule['dependencies'][0];
    const modules = [moduleAt('src/foo/a.ts', [unresolved]), moduleAt('src/foo/b.ts')];
    const selectedSet = new Set(['src/foo/a.ts', 'src/foo/b.ts']);
    const visibleNodeIds = new Set(['src/foo/a.ts', 'src/foo/b.ts']);

    expect(buildGraphEdges(modules, selectedSet, new Set(['src', 'src/foo']), visibleNodeIds)).toEqual([]);
  });

  it('aggregates collapsed file deps onto folder representatives', () => {
    const modules = [moduleAt('src/foo/a.ts', [valueDep('src/bar/c.ts')]), moduleAt('src/bar/c.ts')];
    const selectedSet = new Set(['src/foo/a.ts', 'src/bar/c.ts']);
    const visibleNodeIds = new Set(['src', 'src/foo', 'src/bar']);

    const edges = buildGraphEdges(modules, selectedSet, new Set(['src']), visibleNodeIds);

    expect(edges).toEqual([
      expect.objectContaining({
        source: 'src/foo',
        target: 'src/bar',
      }),
    ]);
  });

  it('skips self-loop edges when both ends collapse to the same representative', () => {
    const modules = [moduleAt('src/foo/a.ts', [valueDep('src/foo/b.ts')]), moduleAt('src/foo/b.ts')];
    const selectedSet = new Set(['src/foo/a.ts', 'src/foo/b.ts']);
    const visibleNodeIds = new Set(['src', 'src/foo']);

    expect(buildGraphEdges(modules, selectedSet, new Set(['src']), visibleNodeIds)).toEqual([]);
  });

  it('merges type-only and value imports into a solid edge', () => {
    const modules = [
      moduleAt('src/foo/a.ts', [typeOnlyDep('src/foo/b.ts'), valueDep('src/foo/b.ts')]),
      moduleAt('src/foo/b.ts'),
    ];
    const selectedSet = new Set(['src/foo/a.ts', 'src/foo/b.ts']);
    const visibleNodeIds = new Set(['src/foo/a.ts', 'src/foo/b.ts']);

    const [edge] = buildGraphEdges(modules, selectedSet, new Set(['src', 'src/foo']), visibleNodeIds);

    expect(edge?.data?.typeOnly).toBe(false);
    expect(edge?.style?.strokeDasharray).toBeUndefined();
  });

  it('styles value-circular edges with bright red and width 2', () => {
    const modules = [moduleAt('src/foo/a.ts', [valueDep('src/foo/b.ts', true)]), moduleAt('src/foo/b.ts')];
    const selectedSet = new Set(['src/foo/a.ts', 'src/foo/b.ts']);
    const visibleNodeIds = new Set(['src/foo/a.ts', 'src/foo/b.ts']);

    const [edge] = buildGraphEdges(modules, selectedSet, new Set(['src', 'src/foo']), visibleNodeIds);

    expect(edge?.style?.stroke).toBe(CIRCULAR_EDGE_COLOR);
    expect(edge?.style?.strokeWidth).toBe(2);
    expect(edge?.style?.strokeDasharray).toBeUndefined();
    expect(edge?.data?.circular).toBe(true);
    expect(edge?.data?.title).toBe('src/foo/a.ts → src/foo/b.ts (circular)');
  });

  it('styles type-only circular edges with light red and dash', () => {
    const modules = [moduleAt('src/foo/a.ts', [typeOnlyDep('src/foo/b.ts', true)]), moduleAt('src/foo/b.ts')];
    const selectedSet = new Set(['src/foo/a.ts', 'src/foo/b.ts']);
    const visibleNodeIds = new Set(['src/foo/a.ts', 'src/foo/b.ts']);

    const [edge] = buildGraphEdges(modules, selectedSet, new Set(['src', 'src/foo']), visibleNodeIds);

    expect(edge?.style?.stroke).toBe(TYPE_ONLY_CIRCULAR_EDGE_COLOR);
    expect(edge?.style?.strokeWidth).toBe(2);
    expect(edge?.style?.strokeDasharray).toBe('6 4');
    expect(edge?.data?.typeOnly).toBe(true);
    expect(edge?.data?.circular).toBe(true);
    expect(edge?.data?.title).toBe('src/foo/a.ts → src/foo/b.ts (type-only) (circular)');
  });

  it('styles couldNotResolve edges with error color', () => {
    const dep = {
      ...valueDep('missing-module'),
      couldNotResolve: true,
    } as IModule['dependencies'][0];
    const modules = [moduleAt('src/foo/a.ts', [dep]), moduleAt('missing-module')];
    const selectedSet = new Set(['src/foo/a.ts', 'missing-module']);
    const visibleNodeIds = new Set(['src/foo/a.ts', 'missing-module']);

    const [edge] = buildGraphEdges(modules, selectedSet, new Set(['src', 'src/foo']), visibleNodeIds);

    expect(edge?.style?.stroke).toBe(ERROR_EDGE_COLOR);
    expect(edge?.style?.strokeWidth).toBe(2);
    expect(edge?.data?.couldNotResolve).toBe(true);
    expect(edge?.data?.title).toBe('src/foo/a.ts → missing-module (unresolved)');
  });

  it('styles error-rule edges and puts rule names in the title', () => {
    const dep = {
      ...valueDep('src/foo/b.ts'),
      valid: false,
      rules: [
        { name: 'shared-only', severity: 'error' },
        { name: 'no-orphans', severity: 'warn' },
      ],
    } as IModule['dependencies'][0];
    const modules = [moduleAt('src/foo/a.ts', [dep]), moduleAt('src/foo/b.ts')];
    const selectedSet = new Set(['src/foo/a.ts', 'src/foo/b.ts']);
    const visibleNodeIds = new Set(['src/foo/a.ts', 'src/foo/b.ts']);

    const [edge] = buildGraphEdges(modules, selectedSet, new Set(['src', 'src/foo']), visibleNodeIds);

    expect(edge?.style?.stroke).toBe(ERROR_EDGE_COLOR);
    expect(edge?.data?.severity).toBe('error');
    expect(edge?.data?.ruleNames).toEqual(['no-orphans', 'shared-only']);
    expect(edge?.data?.title).toBe('src/foo/a.ts → src/foo/b.ts (no-orphans, shared-only)');
  });

  it('styles warn-rule edges with warning color', () => {
    const dep = {
      ...valueDep('src/foo/b.ts'),
      valid: false,
      rules: [{ name: 'not-in-allowed', severity: 'warn' }],
    } as IModule['dependencies'][0];
    const modules = [moduleAt('src/foo/a.ts', [dep]), moduleAt('src/foo/b.ts')];
    const selectedSet = new Set(['src/foo/a.ts', 'src/foo/b.ts']);
    const visibleNodeIds = new Set(['src/foo/a.ts', 'src/foo/b.ts']);

    const [edge] = buildGraphEdges(modules, selectedSet, new Set(['src', 'src/foo']), visibleNodeIds);

    expect(edge?.style?.stroke).toBe(WARNING_EDGE_COLOR);
    expect(edge?.data?.severity).toBe('warn');
  });

  it('prefers couldNotResolve over circular for stroke color', () => {
    const dep = {
      ...valueDep('missing-module', true),
      couldNotResolve: true,
    } as IModule['dependencies'][0];
    const modules = [moduleAt('src/foo/a.ts', [dep]), moduleAt('missing-module')];
    const selectedSet = new Set(['src/foo/a.ts', 'missing-module']);
    const visibleNodeIds = new Set(['src/foo/a.ts', 'missing-module']);

    const [edge] = buildGraphEdges(modules, selectedSet, new Set(['src', 'src/foo']), visibleNodeIds);

    expect(edge?.style?.stroke).toBe(ERROR_EDGE_COLOR);
    expect(edge?.data?.circular).toBe(true);
    expect(edge?.data?.couldNotResolve).toBe(true);
    expect(edge?.data?.title).toBe('src/foo/a.ts → missing-module (circular) (unresolved)');
  });

  it('prefers circular over warn for stroke color', () => {
    const dep = {
      ...valueDep('src/foo/b.ts', true),
      valid: false,
      rules: [{ name: 'not-in-allowed', severity: 'warn' }],
    } as IModule['dependencies'][0];
    const modules = [moduleAt('src/foo/a.ts', [dep]), moduleAt('src/foo/b.ts')];
    const selectedSet = new Set(['src/foo/a.ts', 'src/foo/b.ts']);
    const visibleNodeIds = new Set(['src/foo/a.ts', 'src/foo/b.ts']);

    const [edge] = buildGraphEdges(modules, selectedSet, new Set(['src', 'src/foo']), visibleNodeIds);

    expect(edge?.style?.stroke).toBe(CIRCULAR_EDGE_COLOR);
    expect(edge?.data?.severity).toBe('warn');
    expect(edge?.data?.title).toBe('src/foo/a.ts → src/foo/b.ts (circular) (not-in-allowed)');
  });

  it('rolls violation flags up onto collapsed folder edges', () => {
    const dep = {
      ...valueDep('src/bar/c.ts'),
      valid: false,
      rules: [{ name: 'shared-only', severity: 'error' }],
    } as IModule['dependencies'][0];
    const modules = [moduleAt('src/foo/a.ts', [dep]), moduleAt('src/bar/c.ts')];
    const selectedSet = new Set(['src/foo/a.ts', 'src/bar/c.ts']);
    const visibleNodeIds = new Set(['src', 'src/foo', 'src/bar']);

    const [edge] = buildGraphEdges(modules, selectedSet, new Set(['src']), visibleNodeIds);

    expect(edge).toMatchObject({
      source: 'src/foo',
      target: 'src/bar',
    });
    expect(edge?.style?.stroke).toBe(ERROR_EDGE_COLOR);
    expect(edge?.data?.severity).toBe('error');
    expect(edge?.data?.ruleNames).toEqual(['shared-only']);
  });
});
