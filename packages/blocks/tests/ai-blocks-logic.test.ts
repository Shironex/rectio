import { describe, expect, it } from 'vitest';

import {
  applyStreamEvent,
  assistantSizes,
  cleanTitle,
  countTone,
  estimateTokens,
  filterChats,
  focusAfterRemoval,
  groupChats,
  insertCommand,
  matchCommands,
  shortcutAction,
  slashQuery,
  streamStatus,
  type AiChatSummary,
  type AiChatTurn,
  type AiComposerCommand,
  type AiStreamEvent,
} from '../src/ai';

const USER: AiChatTurn = { id: 'u1', role: 'user', content: 'Hi' };

describe('applyStreamEvent', () => {
  it('builds a reply from start, reasoning, a tool, text, a source and done', () => {
    let turns: AiChatTurn[] = [USER];
    const at = new Date(2026, 10, 22, 9);
    turns = applyStreamEvent(turns, { type: 'start', id: 'a1', createdAt: at });
    expect(streamStatus(turns)).toBe('streaming');
    turns = applyStreamEvent(turns, { type: 'reasoning', id: 'a1', delta: 'Checking ' });
    turns = applyStreamEvent(turns, { type: 'reasoning', id: 'a1', delta: 'the ledger' });
    turns = applyStreamEvent(turns, {
      type: 'tool',
      id: 'a1',
      tool: { id: 't1', name: 'search', status: 'running' },
    });
    turns = applyStreamEvent(turns, {
      type: 'tool',
      id: 'a1',
      tool: { id: 't1', name: 'search', status: 'done', result: 3 },
    });
    turns = applyStreamEvent(turns, { type: 'text', id: 'a1', delta: 'Three ' });
    turns = applyStreamEvent(turns, { type: 'text', id: 'a1', delta: 'are late.' });
    turns = applyStreamEvent(turns, { type: 'source', id: 'a1', source: { id: 's', title: 'AP' } });
    turns = applyStreamEvent(turns, { type: 'source', id: 'a1', source: { id: 's', title: 'AP' } });
    turns = applyStreamEvent(turns, { type: 'done', id: 'a1' });
    const reply = turns[1];
    expect(reply).toMatchObject({
      role: 'assistant',
      content: 'Three are late.',
      createdAt: at,
      status: undefined,
      reasoning: { text: 'Checking the ledger', status: 'done' },
    });
    expect(reply?.tools).toEqual([{ id: 't1', name: 'search', status: 'done', result: 3 }]);
    expect(reply?.sources).toHaveLength(1);
    expect(streamStatus(turns)).toBe('idle');
  });

  it('never mutates its input and ignores a repeated start or an unknown turn', () => {
    const turns: readonly AiChatTurn[] = Object.freeze([USER]);
    const started = applyStreamEvent(turns, { type: 'start', id: 'a1' });
    expect(turns).toHaveLength(1);
    // Nothing to change: the same array comes back, so a setState updater skips the render.
    expect(applyStreamEvent(started, { type: 'start', id: 'a1' })).toBe(started);
    expect(applyStreamEvent(started, { type: 'text', id: 'nope', delta: 'x' })).toBe(started);
  });

  it('ignores every late event once a reply is done, stopped or failed', () => {
    const LATE: AiStreamEvent[] = [
      { type: 'text', id: 'a1', delta: 'LATE' },
      { type: 'reasoning', id: 'a1', delta: 'zzz' },
      { type: 'reasoning-end', id: 'a1', duration: 9 },
      { type: 'tool', id: 'a1', tool: { id: 'late', name: 'n', status: 'running' } },
      { type: 'source', id: 'a1', source: { id: 'late', title: 'Late' } },
      { type: 'done', id: 'a1' },
      { type: 'stopped', id: 'a1' },
      { type: 'error', id: 'a1', error: 'Late failure' },
    ];
    let live = applyStreamEvent([USER], { type: 'start', id: 'a1' });
    live = applyStreamEvent(live, { type: 'text', id: 'a1', delta: 'Hel' });
    const ends: AiStreamEvent[] = [
      { type: 'done', id: 'a1' },
      { type: 'stopped', id: 'a1' },
      { type: 'error', id: 'a1', error: 'Rate limited' },
    ];
    for (const end of ends) {
      const settled = applyStreamEvent(live, end);
      for (const late of LATE) {
        expect(applyStreamEvent(settled, late), `${late.type} after ${end.type}`).toBe(settled);
      }
    }
  });

  it("ignores reply events that name one of the reader's own turns", () => {
    const turns: AiChatTurn[] = [USER];
    expect(applyStreamEvent(turns, { type: 'text', id: USER.id, delta: ' injected' })).toBe(turns);
    expect(
      applyStreamEvent(turns, {
        type: 'tool',
        id: USER.id,
        tool: { id: 't', name: 'x', status: 'running' },
      }),
    ).toBe(turns);
    expect(applyStreamEvent(turns, { type: 'reasoning', id: USER.id, delta: 'x' })).toBe(turns);
  });

  it('settles running reasoning and tools when a reply stops or fails', () => {
    let turns = applyStreamEvent([USER], { type: 'start', id: 'a1' });
    turns = applyStreamEvent(turns, { type: 'reasoning', id: 'a1', delta: 'Hmm' });
    turns = applyStreamEvent(turns, {
      type: 'tool',
      id: 'a1',
      tool: { id: 't', name: 'x', status: 'running' },
    });
    const stopped = applyStreamEvent(turns, { type: 'stopped', id: 'a1' });
    expect(stopped[1]).toMatchObject({ status: 'stopped', reasoning: { status: 'done' } });
    expect(stopped[1]?.tools?.[0]?.status).toBe('failed');
    const failed = applyStreamEvent(turns, { type: 'error', id: 'a1', error: 'Rate limited' });
    expect(failed[1]).toMatchObject({
      status: 'error',
      error: 'Rate limited',
      reasoning: { status: 'failed' },
    });
  });
});

const SUMMARIZE: AiComposerCommand = {
  id: '1',
  name: 'summarize',
  description: 'Summarize the thread',
};
const COMMANDS: AiComposerCommand[] = [
  SUMMARIZE,
  { id: '2', name: 'chart', description: 'Draw a chart', keywords: ['graph'] },
  { id: '3', name: 'reconcile', description: 'Match bank lines to the ledger' },
];

describe('composer logic', () => {
  it('finds the slash word only at the start of a word', () => {
    expect(slashQuery('/sum', 4)).toEqual({ start: 0, query: 'sum' });
    expect(slashQuery('please /ch', 10)).toEqual({ start: 7, query: 'ch' });
    expect(slashQuery('a/b', 3)).toBeNull();
    expect(slashQuery('/sum more', 9)).toBeNull();
    expect(slashQuery('/', 1)).toEqual({ start: 0, query: '' });
    expect(slashQuery('/sum', 99)).toEqual({ start: 0, query: 'sum' });
  });

  it('ranks names that start with the query first, then other matches', () => {
    expect(matchCommands(COMMANDS, '').map((c) => c.name)).toEqual([
      'summarize',
      'chart',
      'reconcile',
    ]);
    expect(matchCommands(COMMANDS, 'GRAPH').map((c) => c.name)).toEqual(['chart']);
    expect(matchCommands(COMMANDS, 'r').map((c) => c.name)).toEqual([
      'reconcile',
      'summarize',
      'chart',
    ]);
    expect(matchCommands(COMMANDS, 'ledger').map((c) => c.name)).toEqual(['reconcile']);
    expect(matchCommands(COMMANDS, '', 1)).toHaveLength(1);
  });

  it('replaces the slash word with the command and places the caret after it', () => {
    const slash = slashQuery('Please /su the rest', 10);
    expect(slash).not.toBeNull();
    if (slash === null) return;
    expect(insertCommand('Please /su the rest', slash, SUMMARIZE)).toEqual({
      text: 'Please /summarize the rest',
      caret: 18,
    });
  });

  it('estimates tokens and reads the count against its limit', () => {
    expect(estimateTokens('   ')).toBe(0);
    expect(estimateTokens('abcdefgh')).toBe(2);
    expect(countTone(10, undefined)).toBe('quiet');
    expect(countTone(89, 100)).toBe('quiet');
    expect(countTone(90, 100)).toBe('near');
    expect(countTone(101, 100)).toBe('over');
    expect(countTone(5, 0)).toBe('quiet');
  });
});

const NOW = new Date(2026, 10, 22, 12);
const CHATS: AiChatSummary[] = [
  { id: 'a', title: 'Q3 close checklist', updatedAt: new Date(2026, 10, 22, 9) },
  { id: 'b', title: 'Overdue invoices', updatedAt: new Date(2026, 10, 21, 18) },
  { id: 'c', title: 'Runway scenarios', updatedAt: new Date(2026, 10, 17, 10), pinned: true },
  { id: 'd', title: 'Vendor payment terms', updatedAt: new Date(2026, 10, 18, 10) },
  { id: 'e', title: 'Board deck notes', updatedAt: new Date(2026, 9, 2) },
  { id: 'f', title: 'No date' },
  { id: 'g', title: 'Late today', updatedAt: new Date(2026, 10, 22, 11) },
];

describe('workspace logic', () => {
  it('groups pinned first, then by day, newest first', () => {
    const groups = groupChats(CHATS, NOW);
    expect(groups.map((g) => [g.key, g.chats.map((c) => c.id)])).toEqual([
      ['pinned', ['c']],
      ['today', ['g', 'a']],
      ['yesterday', ['b']],
      ['week', ['d']],
      ['older', ['e', 'f']],
    ]);
  });

  it('counts a time ahead of the clock as today and leaves out empty groups', () => {
    const groups = groupChats([{ id: 'x', title: 'X', updatedAt: new Date(2026, 10, 25) }], NOW);
    expect(groups).toEqual([
      { key: 'today', chats: [{ id: 'x', title: 'X', updatedAt: new Date(2026, 10, 25) }] },
    ]);
  });

  it('filters by every word of the query, in any case', () => {
    expect(filterChats(CHATS, '  overdue  INV ').map((c) => c.id)).toEqual(['b']);
    expect(filterChats(CHATS, '')).toHaveLength(CHATS.length);
    expect(filterChats(CHATS, 'zzz')).toEqual([]);
  });

  it('moves focus to the next chat after a delete, else the one before', () => {
    expect(focusAfterRemoval(['a', 'b', 'c'], 'b')).toBe('c');
    expect(focusAfterRemoval(['a', 'b', 'c'], 'c')).toBe('b');
    expect(focusAfterRemoval(['a'], 'a')).toBeNull();
    expect(focusAfterRemoval(['a'], 'z')).toBeNull();
  });

  it('cleans a typed title and drops empty or unchanged ones', () => {
    expect(cleanTitle('  New\n  name ', 'Old')).toBe('New name');
    expect(cleanTitle('   ', 'Old')).toBeNull();
    expect(cleanTitle('Old', 'Old')).toBeNull();
    expect(Array.from(cleanTitle('😀'.repeat(200), 'Old') ?? '')).toHaveLength(120);
  });
});

describe('assistant sidebar logic', () => {
  it('opens, then brings focus in, then closes from inside', () => {
    expect(shortcutAction(false, false)).toBe('open');
    expect(shortcutAction(true, false)).toBe('focus');
    expect(shortcutAction(true, true)).toBe('close');
  });

  it('keeps the sizes consistent', () => {
    expect(assistantSizes(32, 22, 50)).toEqual({ defaultSize: 32, minSize: 22, maxSize: 50 });
    expect(assistantSizes(90, 60, 30)).toEqual({ defaultSize: 60, minSize: 60, maxSize: 60 });
    expect(assistantSizes(Number.NaN, 1, 99)).toEqual({
      defaultSize: 32,
      minSize: 10,
      maxSize: 80,
    });
  });
});
