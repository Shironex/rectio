export interface GraphNode {
  name: string;
  registryDependencies: readonly string[];
}

/**
 * The requested items plus everything they depend on, dependencies first. Throws on an unknown
 * item (naming who asked for it) and on a cycle (naming the whole loop). Order between unrelated
 * items follows the request order, so output is stable.
 */
export function resolveGraph<T extends GraphNode>(
  roots: readonly string[],
  lookup: (name: string) => T | undefined,
): T[] {
  const order: T[] = [];
  const done = new Set<string>();
  const stack: string[] = [];

  const visit = (name: string, requestedBy: string | undefined) => {
    if (done.has(name)) return;
    const loopStart = stack.indexOf(name);
    if (loopStart !== -1) {
      throw new Error(`dependency cycle: ${[...stack.slice(loopStart), name].join(' -> ')}`);
    }
    const node = lookup(name);
    if (node === undefined) {
      throw new Error(
        requestedBy === undefined
          ? `unknown item "${name}"`
          : `unknown item "${name}" (a dependency of "${requestedBy}")`,
      );
    }
    stack.push(name);
    for (const dep of node.registryDependencies) visit(dep, name);
    stack.pop();
    done.add(name);
    order.push(node);
  };

  for (const root of roots) visit(root, undefined);
  return order;
}
