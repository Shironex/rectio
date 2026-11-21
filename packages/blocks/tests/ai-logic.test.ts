import { describe, expect, it } from 'vitest';

import { announcedTurn, awaitingReply, chatRows, type AiChatTurn } from '../src/ai';

const user = (id: string, createdAt?: Date): AiChatTurn => ({
  id,
  role: 'user',
  content: 'Hi',
  createdAt,
});
const assistant = (id: string, extra: Partial<AiChatTurn> = {}): AiChatTurn => ({
  id,
  role: 'assistant',
  content: 'Hello',
  ...extra,
});

describe('chatRows', () => {
  it('puts a day separator before the first turn of each day and marks the last reply', () => {
    const rows = chatRows([
      user('u1', new Date(2026, 10, 20, 9)),
      assistant('a1', { createdAt: new Date(2026, 10, 20, 9, 1) }),
      user('u2', new Date(2026, 10, 21, 8)),
      assistant('a2'),
    ]);
    expect(rows.map((row) => (row.kind === 'day' ? 'day' : row.key))).toEqual([
      'day',
      'u1',
      'a1',
      'day',
      'u2',
      'a2',
    ]);
    const latest = rows.filter((row) => row.kind === 'turn' && row.latest).map((row) => row.key);
    expect(latest).toEqual(['a2']);
  });

  it('never starts a day for turns without a time', () => {
    expect(chatRows([user('u1'), assistant('a1')]).every((row) => row.kind === 'turn')).toBe(true);
  });
});

describe('awaitingReply', () => {
  it('shows the dots after sending and while a reply is still empty, never when idle', () => {
    expect(awaitingReply([user('u1')], 'submitting')).toBe(true);
    expect(awaitingReply([user('u1'), assistant('a1', { content: '' })], 'streaming')).toBe(true);
    expect(awaitingReply([user('u1'), assistant('a1', { content: 'Th' })], 'streaming')).toBe(
      false,
    );
    expect(
      awaitingReply(
        [user('u1'), assistant('a1', { content: '', reasoning: { text: '', status: 'thinking' } })],
        'streaming',
      ),
    ).toBe(false);
    expect(awaitingReply([user('u1')], 'idle')).toBe(false);
  });

  it('follows the last reply for announcements', () => {
    expect(announcedTurn([assistant('a1'), user('u2'), assistant('a2'), user('u3')])?.id).toBe(
      'a2',
    );
    expect(announcedTurn([user('u1')])).toBeUndefined();
  });
});
