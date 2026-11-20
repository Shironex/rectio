/** The MCP tools against the dev registry server over HTTP. */
import { rmSync } from 'node:fs';
import { join } from 'node:path';

import { serveRegistry, type RunningRegistry } from '@rectio/registry/serve';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createRegistryClient } from '../src/core/registry-client.ts';
import { getItemSource, guard, type McpDeps } from '../src/mcp/tools.ts';
import { buildTestRegistry, tempDir } from './helpers.ts';

let registry: ReturnType<typeof buildTestRegistry>;
let server: RunningRegistry;
let cwd: ReturnType<typeof tempDir>;

beforeAll(async () => {
  registry = buildTestRegistry();
  server = await serveRegistry({ dir: registry.dir });
  cwd = tempDir('rectio-mcp-http-');
});
afterAll(async () => {
  await server.close();
  registry.cleanup();
  cwd.cleanup();
});

const deps = (): McpDeps => ({ client: createRegistryClient(server.url), cwd: cwd.dir });

describe('get_item_source over HTTP', () => {
  it('serves the source of a block without a key', async () => {
    const { text, isError } = await getItemSource(deps(), { name: 'ledger-summary' });
    expect(isError).toBeUndefined();
    expect(text).toContain('export function LedgerSummary');
  });

  it('turns a missing item file into a tool error', async () => {
    rmSync(join(registry.dir, 'items/toast.json'));
    const result = await guard(() => getItemSource(deps(), { name: 'toast' }));
    expect(result.isError).toBe(true);
    expect(result.text).toContain('items/toast.json was not found in the registry');
  });
});
