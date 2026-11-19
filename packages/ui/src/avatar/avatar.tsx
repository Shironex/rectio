import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import type { ComponentProps } from 'react';

import { cn } from '../lib/cn';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'away' | 'busy' | 'offline';

const SIZES: Record<AvatarSize, string> = {
  xs: 'size-5 text-xs',
  sm: 'size-6 text-xs',
  md: 'size-8 text-sm',
  lg: 'size-10 text-base',
  xl: 'size-14 text-xl',
};

/** The status dot grows with the avatar and keeps a ring of the surface around it. */
const DOT_SIZES: Record<AvatarSize, string> = {
  xs: 'size-1.5 ring-1',
  sm: 'size-2 ring-2',
  md: 'size-2.5 ring-2',
  lg: 'size-3 ring-2',
  xl: 'size-3.5 ring-2',
};

/**
 * Each status differs in shape as well as colour: online is solid, away has a hollow centre, busy
 * carries a bar, offline is an outline. The words are always in the accessible name.
 */
const STATUS: Record<AvatarStatus, string> = {
  online: 'bg-positive',
  away: 'bg-warning after:absolute after:inset-1/4 after:rounded-full after:bg-surface',
  busy: 'bg-negative after:absolute after:inset-x-1/5 after:top-1/2 after:h-px after:-translate-y-1/2 after:bg-negative-contrast',
  offline: 'border-2 border-fg-subtle bg-surface',
};

const STATUS_WORDS: Record<AvatarStatus, string> = {
  online: 'online',
  away: 'away',
  busy: 'busy',
  offline: 'offline',
};

/** Six identity tints. A name always lands on the same one, so a person keeps their colour. */
const TINTS = [
  'bg-identity-1-subtle text-identity-1-strong',
  'bg-identity-2-subtle text-identity-2-strong',
  'bg-identity-3-subtle text-identity-3-strong',
  'bg-identity-4-subtle text-identity-4-strong',
  'bg-identity-5-subtle text-identity-5-strong',
  'bg-identity-6-subtle text-identity-6-strong',
] as const;

/** A stable small hash of a name (FNV-1a), so the tint never depends on render order. */
export function identityTint(name: string): number {
  let hash = 0x811c9dc5;
  for (const char of name.trim().toLowerCase()) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return Math.abs(hash) % TINTS.length;
}

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** The first character a reader would see, whole: a letter with its accents, never half of one. */
const firstGrapheme = (word: string | undefined): string =>
  word === undefined
    ? ''
    : (graphemes.segment(word)[Symbol.iterator]().next().value?.segment ?? '');

/** `Ana María Ruiz` -> `AR`; `Treasury` -> `T`. Whole characters, in any script. */
export function initials(name: string, max: 1 | 2 = 2): string {
  const words = name.trim().split(/\s+/u).filter(Boolean);
  const letters =
    max === 2 && words.length > 1
      ? firstGrapheme(words[0]) + firstGrapheme(words.at(-1))
      : firstGrapheme(words[0]);
  return letters.toLocaleUpperCase();
}

export interface AvatarProps extends Omit<ComponentProps<typeof BaseAvatar.Root>, 'className'> {
  className?: string | undefined;
  /** The person or team. Names the avatar for assistive technology and gives the initials. */
  name: string;
  /** A photo. Until it loads, or if it fails, the initials show on the name's tint. */
  src?: string | undefined;
  size?: AvatarSize | undefined;
  /** Square corners, for teams, companies and other things that are not a person. */
  square?: boolean | undefined;
  status?: AvatarStatus | undefined;
  /** Words for the status in the accessible name. Defaults to online, away, busy or offline. */
  statusLabel?: string | undefined;
}

/**
 * A person or a team as a photo or initials. One accessible name covers the picture and the
 * status ("Ana Ruiz, online"), so a list of avatars reads as a list of people.
 */
export function Avatar({
  name,
  src,
  size = 'md',
  square = false,
  status,
  statusLabel,
  className,
  ...props
}: AvatarProps) {
  const shape = square
    ? size === 'lg' || size === 'xl'
      ? 'rounded-panel'
      : 'rounded-control'
    : 'rounded-full';
  const label = status === undefined ? name : `${name}, ${statusLabel ?? STATUS_WORDS[status]}`;
  return (
    <BaseAvatar.Root
      role="img"
      aria-label={label}
      data-slot="avatar"
      data-size={size}
      data-status={status}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center align-middle select-none',
        SIZES[size],
        shape,
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          'flex size-full items-center justify-center overflow-hidden font-medium',
          shape,
          TINTS[identityTint(name)],
        )}
      >
        {src !== undefined && (
          <BaseAvatar.Image src={src} alt="" className="size-full object-cover" />
        )}
        <BaseAvatar.Fallback aria-hidden className="leading-none tracking-tight">
          {initials(name, size === 'xs' ? 1 : 2)}
        </BaseAvatar.Fallback>
      </span>
      {status !== undefined && (
        <span
          aria-hidden
          data-slot="avatar-status"
          className={cn(
            'absolute end-0 bottom-0 rounded-full ring-surface',
            DOT_SIZES[size],
            STATUS[status],
          )}
        />
      )}
    </BaseAvatar.Root>
  );
}
