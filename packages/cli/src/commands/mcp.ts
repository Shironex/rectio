import { readFileSync } from 'node:fs';

import { readConfig, registryUrl } from '../core/config.ts';
import type { CliContext } from '../core/context.ts';
import { createRegistryClient } from '../core/registry-client.ts';
import { createMcpServer, serveStdio } from '../mcp/server.ts';

export interface McpOptions {
  registry?: string;
}

function cliVersion(): string {
  const url = new URL('../../package.json', import.meta.url);
  return (JSON.parse(readFileSync(url, 'utf8')) as { version: string }).version;
}

/**
 * `rectio mcp`: a read-only MCP server on stdio, over the same registry client and config lookup
 * as the other commands. Never write to stdout here: it is the protocol channel.
 */
export async function runMcp(ctx: CliContext, options: McpOptions = {}): Promise<void> {
  const client = createRegistryClient(registryUrl(ctx, options.registry, readConfig(ctx.cwd)));
  const server = createMcpServer(
    {
      client,
      cwd: ctx.cwd,
      ...(options.registry === undefined ? {} : { registryFlag: options.registry }),
    },
    cliVersion(),
  );
  await serveStdio(server);
}
