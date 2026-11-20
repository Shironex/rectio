/** `rectio mcp` as a user's editor runs it: the built bin as a child process, a real SDK client. */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { buildTestRegistry, tempDir } from './helpers.ts';

const cliBin = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'bin.js');
const TOOLS = [
  'get_add_command',
  'get_docs',
  'get_item',
  'get_item_source',
  'get_tokens',
  'list_items',
  'search_items',
];

let registry: ReturnType<typeof buildTestRegistry>;
let cwd: ReturnType<typeof tempDir>;
let client: Client;

function textOf(result: Awaited<ReturnType<Client['callTool']>>): string {
  const content = result.content as { type: string; text?: string }[];
  return content.map((c) => c.text ?? '').join('\n');
}

/** The parent environment minus anything that could carry a real key or a pnpm run's settings. */
function childEnvironment(): Record<string, string> {
  const kept: Record<string, string> = {};
  for (const [name, value] of Object.entries(process.env)) {
    if (value === undefined || name.startsWith('RECTIO_') || /^npm_/i.test(name)) continue;
    kept[name] = value;
  }
  return kept;
}

beforeAll(async () => {
  registry = buildTestRegistry();
  cwd = tempDir('rectio-mcp-stdio-');
  client = new Client({ name: 'rectio-test', version: '0.0.0' });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [cliBin, 'mcp', '--registry', registry.dir],
      cwd: cwd.dir,
      env: childEnvironment(),
      stderr: 'pipe',
    }),
  );
});

afterAll(async () => {
  await client.close();
  registry.cleanup();
  cwd.cleanup();
});

describe('rectio mcp over stdio', () => {
  it('lists the seven read-only tools with descriptions and input schemas', async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(TOOLS);
    for (const tool of tools) {
      expect(tool.description?.length ?? 0).toBeGreaterThan(40);
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.annotations?.readOnlyHint).toBe(true);
    }
  });

  it('answers a call end to end', async () => {
    const result = await client.callTool({ name: 'search_items', arguments: { query: 'money' } });
    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toMatch(/\nmoney \| component \| \d+\.\d+\.\d+ \|/);
  });

  it('returns the source of a block without a key', async () => {
    const result = await client.callTool({
      name: 'get_item_source',
      arguments: { name: 'ledger-summary' },
    });
    expect(result.isError).toBeFalsy();
    expect(textOf(result)).toContain('export function LedgerSummary');
  });

  it('rejects bad input through the schema', async () => {
    const result = await client.callTool({ name: 'list_items', arguments: { type: 'gold' } });
    expect(result.isError).toBe(true);
  });
});

describe('rectio mcp and the update check', () => {
  it('keeps stdout to the protocol and prints no notice, even with a newer version cached', async () => {
    const xdg = tempDir('rectio-mcp-xdg-');
    mkdirSync(join(xdg.dir, 'rectio'), { recursive: true });
    writeFileSync(
      join(xdg.dir, 'rectio', 'update-check.json'),
      JSON.stringify({ checkedAt: Date.now(), latest: '99.0.0' }),
    );
    const env = childEnvironment();
    delete env.CI;
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [cliBin, 'mcp', '--registry', registry.dir],
      cwd: cwd.dir,
      env: { ...env, XDG_CACHE_HOME: xdg.dir },
      stderr: 'pipe',
    });
    let stderr = '';
    transport.stderr?.on('data', (chunk: Buffer) => (stderr += chunk.toString()));
    const second = new Client({ name: 'rectio-test-update', version: '0.0.0' });
    // The SDK client rejects any stdout line that is not JSON-RPC, so a working round trip means
    // stdout stayed clean.
    await second.connect(transport);
    const { tools } = await second.listTools();
    expect(tools).toHaveLength(TOOLS.length);
    await second.close();
    xdg.cleanup();
    expect(stderr).not.toContain('is available');
  });
});
