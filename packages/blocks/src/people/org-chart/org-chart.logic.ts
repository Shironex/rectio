/**
 * An organisation from a flat list of people, each naming their manager. Built once in linear
 * time, so an org of thousands is ready in a few milliseconds; the chart only draws the branches
 * that are open. A manager who is not in the list, or a loop of managers, never hides anyone: those
 * people become roots. Server safe.
 */

export interface OrgPerson {
  /**
   * Unique across the list. When two people share an id, the first one is charted and the later
   * ones are left out (a tree cannot hold one id in two places), so make ids unique upstream.
   */
  id: string;
  name: string;
  /** Job title, such as `Head of Finance`. */
  title?: string | undefined;
  /** The id of their manager; null or missing at the top. */
  managerId?: string | null | undefined;
  avatar?: string | undefined;
  department?: string | undefined;
  location?: string | undefined;
  email?: string | undefined;
}

export interface OrgModel {
  byId: ReadonlyMap<string, OrgPerson>;
  /** People at the top: no manager, a manager not in the list, or the start of a loop. */
  roots: readonly OrgPerson[];
  /** Direct reports by manager id, in the order given. */
  reports: ReadonlyMap<string, readonly OrgPerson[]>;
  /** Everyone below a person, at any depth. */
  teamSize: ReadonlyMap<string, number>;
  /** The manager each person sits under in the chart, after loops are broken. */
  parent: ReadonlyMap<string, string | null>;
}

export function buildOrg(people: readonly OrgPerson[]): OrgModel {
  const byId = new Map<string, OrgPerson>();
  for (const person of people) if (!byId.has(person.id)) byId.set(person.id, person);

  // Each person's parent, with unknown managers and loops cut to null.
  const parent = new Map<string, string | null>();
  const state = new Map<string, 'visiting' | 'done'>();
  for (const start of byId.keys()) {
    if (state.get(start) === 'done') continue;
    const path: string[] = [];
    let id: string | null = start;
    while (id !== null && state.get(id) === undefined) {
      state.set(id, 'visiting');
      path.push(id);
      const manager: string | null | undefined = byId.get(id)?.managerId;
      id = manager != null && byId.has(manager) && manager !== id ? manager : null;
    }
    // Stopped on someone still being visited: the chain loops back. Cut the loop at that person.
    if (id !== null && state.get(id) === 'visiting') parent.set(id, null);
    for (const visited of path) {
      state.set(visited, 'done');
      if (parent.has(visited)) continue;
      const manager = byId.get(visited)?.managerId;
      parent.set(
        visited,
        manager != null && byId.has(manager) && manager !== visited ? manager : null,
      );
    }
  }

  const reports = new Map<string, OrgPerson[]>();
  const roots: OrgPerson[] = [];
  for (const person of byId.values()) {
    const manager = parent.get(person.id) ?? null;
    if (manager === null) roots.push(person);
    else {
      const list = reports.get(manager);
      if (list === undefined) reports.set(manager, [person]);
      else list.push(person);
    }
  }

  // Team sizes bottom up: walk the tree depth first from every root, then add children to parents
  // in reverse order of the walk, so every child is counted before its manager.
  const order: string[] = [];
  const stack = roots.map((root) => root.id);
  while (stack.length > 0) {
    const id = stack.pop();
    if (id === undefined) break;
    order.push(id);
    for (const report of reports.get(id) ?? []) stack.push(report.id);
  }
  const teamSize = new Map<string, number>();
  for (let index = order.length - 1; index >= 0; index -= 1) {
    const id = order[index] ?? '';
    let size = 0;
    for (const report of reports.get(id) ?? []) size += 1 + (teamSize.get(report.id) ?? 0);
    teamSize.set(id, size);
  }
  return { byId, roots, reports, teamSize, parent };
}

/** The managers above a person, from the top down; empty for a root or an unknown id. */
export function managerChain(model: OrgModel, id: string): string[] {
  const chain: string[] = [];
  let current = model.parent.get(id) ?? null;
  while (current !== null && chain.length <= model.byId.size) {
    chain.unshift(current);
    current = model.parent.get(current) ?? null;
  }
  return chain;
}

const fold = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

/**
 * People whose name, title or department matches the query, best first: a name that starts with
 * it, then a word in the name, then anything else that holds it. Accents are ignored, so `zoe`
 * finds Zoë. At most `limit` results; pass `Infinity` for all of them, to count them.
 */
export function searchOrg(model: OrgModel, query: string, limit = 8): OrgPerson[] {
  const needle = fold(query.trim());
  if (needle === '') return [];
  const scored: { person: OrgPerson; score: number }[] = [];
  for (const person of model.byId.values()) {
    const name = fold(person.name);
    const rest = fold(`${person.title ?? ''} ${person.department ?? ''}`);
    const score = name.startsWith(needle)
      ? 0
      : name.split(/\s+/).some((word) => word.startsWith(needle))
        ? 1
        : name.includes(needle)
          ? 2
          : rest.includes(needle)
            ? 3
            : -1;
    if (score >= 0) scored.push({ person, score });
  }
  return scored
    .sort((a, b) => a.score - b.score || a.person.name.localeCompare(b.person.name))
    .slice(0, limit)
    .map(({ person }) => person);
}
