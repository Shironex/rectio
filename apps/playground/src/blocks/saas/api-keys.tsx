import { ApiKeys as PlainApiKeys, type ApiKey, type ApiKeyScopeOption } from '@rectio/blocks';
import { ApiKeys as MotionApiKeys } from '@rectio/blocks/motion';
import { useState } from 'react';

import { NOW, ago, type DemoProps } from './demo';

const SCOPES: ApiKeyScopeOption[] = [
  { value: 'read', label: 'Read only', description: 'List and fetch records, nothing changes' },
  { value: 'write', label: 'Read and write', description: 'Create and update records' },
  {
    value: 'admin',
    label: 'Full access',
    description: 'Everything, including members and billing',
  },
];

const KEYS: ApiKey[] = [
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
    lastUsedAt: ago(60 * 30),
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
    lastUsedAt: ago(60 * 24 * 41),
    revokedAt: new Date(2026, 1, 2),
  },
];

export function ApiKeysDemo({ motion, empty, locale }: DemoProps) {
  const ApiKeys = motion ? MotionApiKeys : PlainApiKeys;
  const [keys, setKeys] = useState(empty ? [] : KEYS);
  const [revealed, setRevealed] = useState<{ name: string; value: string } | undefined>();
  return (
    <ApiKeys
      keys={keys}
      scopes={SCOPES}
      now={NOW}
      locale={locale}
      createdKey={revealed}
      onCreatedKeyDismiss={() => {
        setRevealed(undefined);
      }}
      onCreate={(draft) => {
        const prefix = `fh_live_${Math.random().toString(36).slice(2, 6)}`;
        setKeys([{ id: prefix, prefix, createdAt: NOW, ...draft }, ...keys]);
        setRevealed({ name: draft.name, value: `${prefix}_8Hc2vQxN4tLr9ZpWm7Ks1YdE` });
      }}
      onRevoke={(id) => {
        setKeys(keys.map((k) => (k.id === id ? { ...k, revokedAt: NOW } : k)));
      }}
    />
  );
}
