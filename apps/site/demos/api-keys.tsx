'use client';

import { ApiKeys, type ApiKey, type ApiKeyDraft, type ApiKeyScopeOption } from '@rectio/blocks';
import { useState } from 'react';

export const NOW = new Date(2026, 2, 19, 14, 20);
const ago = (minutes: number) => new Date(NOW.getTime() - minutes * 60_000);

export const SCOPES: ApiKeyScopeOption[] = [
  { value: 'read', label: 'Read only', description: 'Reads data, changes nothing' },
  { value: 'write', label: 'Read and write', description: 'Creates and edits records' },
  { value: 'admin', label: 'Full access', description: 'Also manages members and billing' },
];

export const KEYS: ApiKey[] = [
  {
    id: 'k1',
    name: 'Billing worker',
    prefix: 'fh_live_3kq9',
    scope: 'write',
    createdAt: new Date(2026, 0, 14),
    lastUsedAt: ago(4),
    expiresAt: new Date(2026, 6, 14),
  },
  {
    id: 'k2',
    name: 'Warehouse sync',
    prefix: 'fh_live_p2m7',
    scope: 'read',
    createdAt: new Date(2025, 11, 2),
    lastUsedAt: ago(1500),
    expiresAt: new Date(2026, 2, 23),
  },
  {
    id: 'k3',
    name: 'Ops dashboard',
    prefix: 'fh_live_x81c',
    scope: 'admin',
    createdAt: new Date(2026, 2, 3),
  },
  {
    id: 'k4',
    name: 'Old import script',
    prefix: 'fh_live_a0d4',
    scope: 'write',
    createdAt: new Date(2025, 5, 9),
    lastUsedAt: ago(40000),
    revokedAt: new Date(2026, 1, 20),
  },
];

/** The demo's own key store: a real app creates the key on the server and passes the secret back once. */
export function useDemoKeys(initial: ApiKey[]) {
  const [keys, setKeys] = useState(initial);
  const [createdKey, setCreatedKey] = useState<{ name: string; value: string } | undefined>();
  return {
    keys,
    createdKey,
    onCreate: (draft: ApiKeyDraft) => {
      const prefix = `fh_live_${Math.random().toString(36).slice(2, 6)}`;
      setKeys([{ id: prefix, prefix, createdAt: NOW, ...draft }, ...keys]);
      setCreatedKey({
        name: draft.name,
        value: `${prefix}_${Math.random().toString(36).slice(2, 26)}`,
      });
    },
    onRevoke: (id: string) => {
      setKeys(keys.map((k) => (k.id === id ? { ...k, revokedAt: NOW } : k)));
    },
    onCreatedKeyDismiss: () => {
      setCreatedKey(undefined);
    },
  };
}

export default function ApiKeysDemo() {
  const store = useDemoKeys(KEYS);
  return (
    <div className="w-full">
      <ApiKeys {...store} scopes={SCOPES} now={NOW} locale="en-GB" />
    </div>
  );
}
