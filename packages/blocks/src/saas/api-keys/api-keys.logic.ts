import { daysBetween } from '../../lib/finance';

export interface ApiKey {
  id: string;
  name: string;
  /** The public start of the key, safe to show, such as "fh_live_3kq9". The rest stays secret. */
  prefix: string;
  /** The value of one of the `scopes` options. */
  scope: string;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  revokedAt?: Date;
}

export interface ApiKeyScopeOption {
  value: string;
  label: string;
  /** What the key can do, shown in the scope picker. */
  description?: string;
  /** The riskiest scope, such as full access: its chip is drawn stronger with a shield. */
  elevated?: boolean;
}

export type ApiKeyExpiry = 'never' | '30' | '90' | '365';

export const API_KEY_EXPIRY_LABELS: Record<ApiKeyExpiry, string> = {
  '30': '30 days',
  '90': '90 days',
  '365': '1 year',
  never: 'Never',
};

export interface ApiKeyDraft {
  name: string;
  scope: string;
  /** Undefined for a key that never expires. */
  expiresAt?: Date;
}

export type ApiKeyStatus = 'active' | 'expiring' | 'expired' | 'revoked';

/** Revoked wins, then expired; a key that expires within a week is expiring. */
export function apiKeyStatus(key: ApiKey, now: Date): ApiKeyStatus {
  if (key.revokedAt !== undefined) return 'revoked';
  if (key.expiresAt === undefined) return 'active';
  const days = daysBetween(now, key.expiresAt);
  if (key.expiresAt.getTime() <= now.getTime()) return 'expired';
  return days <= 7 ? 'expiring' : 'active';
}

/** The prefix followed by a fixed run of dots, so the length of the secret never shows. */
export function maskApiKey(prefix: string): string {
  return `${prefix}${'•'.repeat(8)}`;
}

/** The expiry date an option means, counted from `now`; undefined for never. */
export function apiKeyExpiryDate(expiry: ApiKeyExpiry, now: Date): Date | undefined {
  if (expiry === 'never') return undefined;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + Number(expiry));
}

/** Why a new key's name cannot be used, or null. Names are compared without case or spaces. */
export function apiKeyNameError(name: string, keys: readonly ApiKey[]): string | null {
  const trimmed = name.trim();
  if (trimmed === '') return 'Name the key after where it is used, such as "Billing worker".';
  if (trimmed.length > 60) return 'Keep the name under 60 characters.';
  const taken = keys.some(
    (key) => key.revokedAt === undefined && key.name.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  return taken
    ? 'A key with this name exists. Pick a name that says where this one is used.'
    : null;
}

/** Live keys first, newest first; revoked keys last. */
export function sortApiKeys(keys: readonly ApiKey[]): ApiKey[] {
  return [...keys].sort(
    (a, b) =>
      Number(a.revokedAt !== undefined) - Number(b.revokedAt !== undefined) ||
      b.createdAt.getTime() - a.createdAt.getTime(),
  );
}
