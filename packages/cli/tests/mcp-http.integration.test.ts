/** The pro gate against the dev registry server, which does check keys. */
import { serveRegistry, type RunningRegistry } from '@rectio/registry/serve';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createRegistryClient } from '../src/core/registry-client.ts';
import { getItemSource, guard, type McpDeps } from '../src/mcp/tools.ts';
import { buildTestRegistry, capture, tempDir } from './helpers.ts';

let registry: ReturnType<typeof buildTestRegistry>;
let server: RunningRegistry;
let cwd: ReturnType<typeof tempDir>;

beforeAll(async () => {
  registry = buildTestRegistry();
  server = await serveRegistry({ dir: registry.dir, licenseKeys: ['valid-key'] });
  cwd = tempDir('rectio-mcp-http-');
});
afterAll(async () => {
  await server.close();
  registry.cleanup();
  cwd.cleanup();
});

const deps = (key?: string): McpDeps => ({
  client: createRegistryClient(server.url),
  env: capture(cwd.dir, key === undefined ? {} : { RECTIO_LICENSE_KEY: key }).ctx.env,
  cwd: cwd.dir,
});

describe('get_item_source over HTTP', () => {
  it('serves pro source for a valid key', async () => {
    const { text } = await getItemSource(deps('valid-key'), { name: 'ledger-summary' });
    expect(text).toContain('export function LedgerSummary');
  });

  it('turns a refused key into a tool error with no source', async () => {
    const result = await guard(() =>
      getItemSource(deps('revoked-key'), { name: 'ledger-summary' }),
    );
    expect(result.isError).toBe(true);
    expect(result.text).toContain('refused the license key');
    expect(result.text).not.toContain('LedgerSummary');
    expect(result.text).not.toContain('revoked-key');
  });

  it('never asks the server for pro source without a key', async () => {
    const result = await getItemSource(deps(), { name: 'ledger-summary' });
    expect(result.isError).toBe(true);
    expect(result.text).toContain('RECTIO_LICENSE_KEY');
  });
});
