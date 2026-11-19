/** The CLI against the dev registry server over HTTP, the way it will talk to the hosted one. */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { serveRegistry, type RunningRegistry } from '@rectio/registry/serve';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { runAdd } from '../src/commands/add.ts';
import { runInit } from '../src/commands/init.ts';
import { VITE_APP, buildTestRegistry, capture, tempDir, writeTree } from './helpers.ts';

let registry: ReturnType<typeof buildTestRegistry>;
let server: RunningRegistry;
let app: ReturnType<typeof tempDir>;

beforeAll(async () => {
  registry = buildTestRegistry();
  server = await serveRegistry({ dir: registry.dir, licenseKeys: ['valid-key'] });
  app = tempDir('rectio-cli-http-');
  writeTree(app.dir, VITE_APP);
  await runInit(capture(app.dir).ctx, { registry: server.url, install: false });
});

afterAll(async () => {
  await server.close();
  registry.cleanup();
  app.cleanup();
});

const summary = () => join(app.dir, 'src/components/blocks/ledger-summary.tsx');

describe('an HTTP registry', () => {
  it('serves free items without a key', async () => {
    await runAdd(capture(app.dir).ctx, ['button'], { install: false });
    expect(existsSync(join(app.dir, 'src/components/ui/button.tsx'))).toBe(true);
  });

  it('turns a refused key into a clear error and writes nothing', async () => {
    const { ctx } = capture(app.dir, { RECTIO_LICENSE_KEY: 'revoked-key' });
    await expect(runAdd(ctx, ['ledger-summary'], { install: false })).rejects.toThrow(
      'the registry refused the license key for pro/items/ledger-summary.json (401)',
    );
    expect(existsSync(summary())).toBe(false);
    expect(existsSync(join(app.dir, 'src/components/ui/money.tsx'))).toBe(false);
  });

  it('installs a pro item with a valid key', async () => {
    const { ctx } = capture(app.dir, { RECTIO_LICENSE_KEY: 'valid-key' });
    await runAdd(ctx, ['ledger-summary'], { install: false });
    expect(existsSync(summary())).toBe(true);
  });

  it('reports an unreachable registry', async () => {
    const { ctx } = capture(app.dir);
    await expect(
      runAdd(ctx, ['money'], { install: false, registry: 'http://127.0.0.1:9' }),
    ).rejects.toThrow('could not reach the registry at http://127.0.0.1:9');
  });
});
