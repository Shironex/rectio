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
  registry = await serveRegistry({ dir: out, licenseKeys: ['good-key'] });
});

afterAll(async () => {
  await registry.close();
  cleanup();
});

function get(path: string, key?: string) {
  const init = key === undefined ? {} : { headers: { authorization: `Bearer ${key}` } };
  // The server listens on a random loopback port, so the origin cannot be a literal.
  // eslint-disable-next-line noctcore-security/no-user-controlled-fetch-url
  return fetch(`${registry.url}/${path}`, init);
}

describe('the dev registry server', () => {
  it('serves the index and free items to anyone', async () => {
    expect((await get('index.json')).status).toBe(200);
    expect((await get('items/badge.json')).status).toBe(200);
  });

  it('refuses pro items without a key or with a wrong one', async () => {
    expect((await get('pro/items/ledger-card.json')).status).toBe(401);
    expect((await get('pro/items/ledger-card.json', 'bad-key')).status).toBe(401);
  });

  it('serves pro items with a valid key', async () => {
    const res = await get('pro/items/ledger-card.json', 'good-key');
    expect(res.status).toBe(200);
    expect(((await res.json()) as { tier: string }).tier).toBe('pro');
  });

  it('does not serve files outside the folder or that are not JSON', async () => {
    expect((await get('..%2F..%2Fpackage.json')).status).toBe(404);
    expect((await get('items/missing.json')).status).toBe(404);
  });
});
