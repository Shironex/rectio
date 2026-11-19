import { describe, expect, it } from 'vitest';

import { resolveGraph, type GraphNode } from '../src/index.ts';

const nodes: GraphNode[] = [
  { name: 'cn', registryDependencies: [] },
  { name: 'tokens', registryDependencies: ['theme-default'] },
  { name: 'theme-default', registryDependencies: [] },
  { name: 'theme-scope', registryDependencies: ['tokens', 'cn'] },
  { name: 'button', registryDependencies: ['tokens', 'cn'] },
  { name: 'dialog', registryDependencies: ['tokens', 'cn', 'theme-scope'] },
  { name: 'money', registryDependencies: ['tokens', 'cn'] },
];
const lookup = (list: GraphNode[]) => (name: string) => list.find((n) => n.name === name);
const names = (list: GraphNode[]) => list.map((n) => n.name);

describe('resolveGraph', () => {
  it('orders dependencies before dependents, each item once', () => {
    const order = names(resolveGraph(['button', 'dialog', 'money'], lookup(nodes)));
    expect(order).toEqual([
      'theme-default',
      'tokens',
      'cn',
      'button',
      'theme-scope',
      'dialog',
      'money',
    ]);
  });

  it('is stable for a repeated request', () => {
    expect(names(resolveGraph(['money', 'money'], lookup(nodes)))).toEqual([
      'theme-default',
      'tokens',
      'cn',
      'money',
    ]);
  });

  it('names who asked for an unknown item', () => {
    const broken = [...nodes, { name: 'chart', registryDependencies: ['axis'] }];
    expect(() => resolveGraph(['chart'], lookup(broken))).toThrow(
      'unknown item "axis" (a dependency of "chart")',
    );
    expect(() => resolveGraph(['nope'], lookup(nodes))).toThrow('unknown item "nope"');
  });

  it('reports the whole cycle', () => {
    const cyclic: GraphNode[] = [
      { name: 'a', registryDependencies: ['b'] },
      { name: 'b', registryDependencies: ['c'] },
      { name: 'c', registryDependencies: ['a'] },
    ];
    expect(() => resolveGraph(['a'], lookup(cyclic))).toThrow('dependency cycle: a -> b -> c -> a');
  });
});
