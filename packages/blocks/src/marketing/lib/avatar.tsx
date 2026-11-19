import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import { cn } from '@rectio/ui';

/**
 * A person's photo, or their initials on a soft tint while it loads or when there is none.
 * Internal to the marketing blocks until the kit's own Avatar lands; swap it in then.
 */
const TINTS = [
  'bg-accent-subtle text-accent-strong',
  'bg-positive-subtle text-positive-strong',
  'bg-info-subtle text-info-strong',
  'bg-warning-subtle text-warning-strong',
] as const;

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** The same name always gets the same tint, so a person reads the same across a page. */
function tintOf(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 997;
  return TINTS[hash % TINTS.length] ?? TINTS[0];
}

const SIZE = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg' };

export function Avatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string;
  /** A photo. Without one the initials show. */
  src?: string | undefined;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  return (
    <BaseAvatar.Root
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-medium select-none',
        SIZE[size],
        tintOf(name),
        className,
      )}
    >
      {src !== undefined && (
        <BaseAvatar.Image src={src} alt={name} className="size-full object-cover" />
      )}
      <BaseAvatar.Fallback aria-label={name} role="img">
        <span aria-hidden>{initials(name)}</span>
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}
