/** The CLI against the dev registry server over HTTP, the way it will talk to the hosted one. */
import { existsSync, rmSync } from 'node:fs';
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
  server = await serveRegistry({ dir: registry.dir });
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
  it('serves a component without a key', async () => {
    await runAdd(capture(app.dir).ctx, ['button'], { install: false });
    expect(existsSync(join(app.dir, 'src/components/ui/button.tsx'))).toBe(true);
  });

  it('installs a block and its dependencies without a key', async () => {
    await runAdd(capture(app.dir).ctx, ['ledger-summary'], { install: false });
    expect(existsSync(summary())).toBe(true);
    expect(existsSync(join(app.dir, 'src/components/ui/money.tsx'))).toBe(true);
  });

  it('turns a missing item file into a clear error and writes nothing', async () => {
    rmSync(join(registry.dir, 'items/toast.json'));
    await expect(runAdd(capture(app.dir).ctx, ['toast'], { install: false })).rejects.toThrow(
      `items/toast.json was not found in the registry at ${server.url}`,
    );
    expect(existsSync(join(app.dir, 'src/components/ui/toast.tsx'))).toBe(false);
  });

  it('reports an unreachable registry', async () => {
    const { ctx } = capture(app.dir);
    await expect(
      runAdd(ctx, ['money'], { install: false, registry: 'http://127.0.0.1:9' }),
    ).rejects.toThrow('could not reach the registry at http://127.0.0.1:9');
  });
});
