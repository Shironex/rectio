import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildRegistry, writeRegistry } from '../src/build/index.ts';
import { serveRegistry, type RunningRegistry } from '../src/serve.ts';
import { FIXTURE_SOURCES, fixtureConfig, tempTree } from './helpers.ts';

let registry: RunningRegistry;
let cleanup: () => void;

beforeAll(async () => {
  const tree = tempTree(FIXTURE_SOURCES);
  cleanup = tree.cleanup;
  const out = join(tree.dir, 'out');
  writeRegistry(out, buildRegistry(fixtureConfig(tree.dir)));
  registry = await serveRegistry({ dir: out });
});

afterAll(async () => {
  await registry.close();
  cleanup();
});

function get(path: string) {
  // The server listens on a random loopback port, so the origin cannot be a literal.
  // eslint-disable-next-line noctcore-security/no-user-controlled-fetch-url
  return fetch(`${registry.url}/${path}`, { signal: AbortSignal.timeout(10_000) });
}

describe('the dev registry server', () => {
  it('serves the index and every item to anyone, without a key', async () => {
    expect((await get('index.json')).status).toBe(200);
    expect((await get('items/badge.json')).status).toBe(200);
    const res = await get('pro/items/ledger-card.json');
    expect(res.status).toBe(200);
    expect(((await res.json()) as { name: string }).name).toBe('ledger-card');
  });

  it('does not serve files outside the folder or that are not JSON', async () => {
    expect((await get('..%2F..%2Fpackage.json')).status).toBe(404);
    expect((await get('items/missing.json')).status).toBe(404);
  });
});
