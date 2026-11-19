import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import * as z from 'zod';

import {
  ITEM_TYPES,
  TIERS,
  getAddCommand,
  getDocs,
  getItem,
  getItemSource,
  getTokens,
  guard,
  listItems,
  searchItems,
  type McpDeps,
  type ToolResult,
} from './tools.ts';

const READ_ONLY = { readOnlyHint: true, destructiveHint: false, idempotentHint: true } as const;

const itemName = z
  .string()
  .min(1)
  .describe('Registry item name, kebab-case, for example "data-table"');
const limit = z.number().int().min(1).max(200).optional().describe('Maximum rows to return');

const asContent = (result: ToolResult): CallToolResult => ({
  content: [{ type: 'text', text: result.text }],
  ...(result.isError === true ? { isError: true } : {}),
});

/**
 * The rectio MCP server: read-only tools over the registry. This is the only file that touches
 * the MCP SDK's server API, so moving between SDK major versions stays a one-file change.
 */
export function createMcpServer(deps: McpDeps, version: string): McpServer {
  const server = new McpServer({ name: 'rectio', version });
  const run = (work: () => Promise<ToolResult>) => guard(work).then(asContent);

  server.registerTool(
    'list_items',
    {
      title: 'List rectio items',
      description:
        'List items in the rectio registry (components, blocks, themes, libs, hooks, styles), one line each: name, type, tier (free or pro), version, title. Use this to see what exists; use search_items when you know what you need. Never returns source.',
      inputSchema: {
        type: z.enum(ITEM_TYPES).optional().describe('Only items of this type'),
        tier: z.enum(TIERS).optional().describe('Only free or only pro items'),
        limit,
      },
      annotations: READ_ONLY,
    },
    (args) => run(() => listItems(deps, args)),
  );

  server.registerTool(
    'search_items',
    {
      title: 'Search rectio items',
      description:
        'Find rectio items by words in their name, title, categories or description, for example "money", "date picker" or "table". Every word must match. Best first. Use before building a UI piece by hand, since a ready component may exist.',
      inputSchema: {
        query: z.string().min(1).describe('One or more words'),
        type: z.enum(ITEM_TYPES).optional().describe('Only items of this type'),
        tier: z.enum(TIERS).optional().describe('Only free or only pro items'),
        limit,
      },
      annotations: READ_ONLY,
    },
    (args) => run(() => searchItems(deps, args)),
  );

  server.registerTool(
    'get_item',
    {
      title: 'Get a rectio item',
      description:
        'Details of one item: description, versions, items installed with it, npm packages, requirements, and its file list with install targets and sizes. Pro items show metadata only unless a license key is configured. Does not return source: use get_item_source for that.',
      inputSchema: { name: itemName },
      annotations: READ_ONLY,
    },
    (args) => run(() => getItem(deps, args)),
  );

  server.registerTool(
    'get_item_source',
    {
      title: 'Get rectio item source',
      description:
        'The source code of an item, so you can read how a component is built and which props it takes before using or extending it. Optionally one file. Pro items need a valid license key; without one this returns a message saying how to get a key and no source. Source can be long: pass file to read one file.',
      inputSchema: {
        name: itemName,
        file: z
          .string()
          .optional()
          .describe('One file: its path from get_item, for example "ui/button.tsx"'),
      },
      annotations: READ_ONLY,
    },
    (args) => run(() => getItemSource(deps, args)),
  );

  server.registerTool(
    'get_tokens',
    {
      title: 'Get rectio theme tokens',
      description:
        'Design token names and values of a theme in one mode, each with the Tailwind utility that reads it. Call this before writing styles so generated code uses semantic utilities such as bg-surface and text-fg, not hex values. Filter to a family (surface, text, accent, radius, motion, font, ...) to keep the answer short.',
      inputSchema: {
        theme: z
          .string()
          .optional()
          .describe('Theme id such as "default" or "ledger" (default: "default")'),
        mode: z.enum(['light', 'dark']).optional().describe('Color mode (default: light)'),
        filter: z
          .string()
          .optional()
          .describe('Only token names containing this text, for example "surface"'),
      },
      annotations: READ_ONLY,
    },
    (args) => run(() => getTokens(deps, args)),
  );

  server.registerTool(
    'get_docs',
    {
      title: 'Get rectio usage docs',
      description:
        'Usage notes. With an item name: the registry notes for it plus its exports, requirements and dependencies. Without: the general rules for using rectio (workflow, token-only styling, theming, license).',
      inputSchema: { item: itemName.optional() },
      annotations: READ_ONLY,
    },
    (args) => run(() => getDocs(deps, args)),
  );

  server.registerTool(
    'get_add_command',
    {
      title: 'Get the rectio add command',
      description:
        'The exact `rectio add` command that installs the given items (dependencies are added automatically), plus what else it installs and whether a license key is needed. This server never writes files: show the command to the user or run it yourself in the project folder.',
      inputSchema: {
        items: z.array(itemName).min(1).describe('Item names to add'),
        overwrite: z
          .boolean()
          .optional()
          .describe('Add --overwrite to replace files the user edited'),
        dry_run: z.boolean().optional().describe('Add --dry-run to preview without writing'),
      },
      annotations: READ_ONLY,
    },
    (args) => run(() => getAddCommand(deps, args)),
  );

  return server;
}

/** Serves the tools over stdio until the client disconnects. stdout carries the protocol only. */
export async function serveStdio(server: McpServer): Promise<void> {
  await server.connect(new StdioServerTransport());
}
