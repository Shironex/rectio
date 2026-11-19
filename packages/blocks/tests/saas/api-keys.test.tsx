import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  ApiKeys,
  apiKeyExpiryDate,
  apiKeyNameError,
  apiKeyStatus,
  maskApiKey,
  sortApiKeys,
  type ApiKey,
} from '../../src/index';

const NOW = new Date(2026, 2, 19, 14, 20);
const SCOPES = [
  { value: 'read', label: 'Read only' },
  { value: 'write', label: 'Read and write' },
];
const KEYS: ApiKey[] = [
  {
    id: 'a',
    name: 'Billing worker',
    prefix: 'fh_live_a',
    scope: 'write',
    createdAt: new Date(2026, 0, 2),
  },
  {
    id: 'b',
    name: 'Sync',
    prefix: 'fh_live_b',
    scope: 'read',
    createdAt: new Date(2026, 1, 2),
    expiresAt: new Date(2026, 2, 23),
  },
  {
    id: 'c',
    name: 'Old',
    prefix: 'fh_live_c',
    scope: 'read',
    createdAt: new Date(2026, 2, 1),
    revokedAt: new Date(2026, 2, 5),
  },
];

const [ACTIVE, SYNC, OLD] = KEYS as [ApiKey, ApiKey, ApiKey];

describe('api key logic', () => {
  it('reads a key status from revocation and expiry', () => {
    expect(apiKeyStatus(ACTIVE, NOW)).toBe('active');
    expect(apiKeyStatus(SYNC, NOW)).toBe('expiring');
    expect(apiKeyStatus(OLD, NOW)).toBe('revoked');
    expect(apiKeyStatus({ ...ACTIVE, expiresAt: new Date(2026, 2, 1) }, NOW)).toBe('expired');
  });

  it('masks, dates, names and sorts keys', () => {
    expect(maskApiKey('fh_live_a')).toBe('fh_live_a••••••••');
    expect(apiKeyExpiryDate('30', NOW)).toEqual(new Date(2026, 3, 18));
    expect(apiKeyExpiryDate('never', NOW)).toBeUndefined();
    expect(apiKeyNameError('  ', KEYS)).toMatch(/^Name the key/);
    expect(apiKeyNameError('billing WORKER', KEYS)).toMatch(/exists/);
    expect(apiKeyNameError('Old', KEYS)).toBeNull();
    expect(sortApiKeys(KEYS).map((k) => k.id)).toEqual(['b', 'a', 'c']);
  });
});

describe('ApiKeys', () => {
  it('creates a key with a name, the first scope and a 90 day expiry', async () => {
    const onCreate = vi.fn();
    render(<ApiKeys keys={KEYS} scopes={SCOPES} now={NOW} onCreate={onCreate} />);
    await userEvent.click(screen.getByRole('button', { name: 'Create key' }));
    await userEvent.click(screen.getByRole('button', { name: 'Create key' }));
    expect(onCreate).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText('Name'), 'Ops dashboard');
    await userEvent.click(screen.getByRole('button', { name: 'Create key' }));
    expect(onCreate).toHaveBeenCalledWith({
      name: 'Ops dashboard',
      scope: 'read',
      expiresAt: new Date(2026, 5, 17),
    });
  });

  it('shows a created key once and copies it', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText');
    const onCreatedKeyDismiss = vi.fn();
    render(
      <ApiKeys
        keys={KEYS}
        scopes={SCOPES}
        now={NOW}
        createdKey={{ name: 'Ops', value: 'fh_live_x_secret' }}
        onCreatedKeyDismiss={onCreatedKeyDismiss}
      />,
    );
    expect(screen.getByText('fh_live_x_secret')).toBeInTheDocument();
    expect(screen.getByText(/only time you will see it/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Copy key' }));
    expect(writeText).toHaveBeenCalledWith('fh_live_x_secret');
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(onCreatedKeyDismiss).toHaveBeenCalled();
  });

  it('confirms before revoking', async () => {
    const onRevoke = vi.fn();
    render(<ApiKeys keys={KEYS} scopes={SCOPES} now={NOW} onRevoke={onRevoke} />);
    expect(screen.queryByRole('button', { name: 'Revoke Old' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Revoke Sync' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Revoke key' }));
    expect(onRevoke).toHaveBeenCalledWith('b');
  });

  it('shows the empty note with no keys', () => {
    render(<ApiKeys keys={[]} scopes={SCOPES} now={NOW} />);
    expect(screen.getByText('No API keys yet')).toBeInTheDocument();
  });
});
