import { Avatar as BaseAvatar } from '@base-ui/react/avatar';
import { cn } from '@rectio/ui';

import { initials } from './saas';

export type AvatarSize = 'sm' | 'md' | 'lg';

const SIZES: Record<AvatarSize, string> = {
  sm: 'size-6 text-xs',
  md: 'size-8 text-sm',
  lg: 'size-14 text-xl',
};

export interface AvatarProps {
  /** The person or team; its initials stand in until (or instead of) the picture. */
  name: string;
  src?: string | undefined;
  size?: AvatarSize;
  /** Hidden from assistive technology when the name is already written beside it. */
  decorative?: boolean;
  className?: string;
}

/**
 * A person's picture, or their initials on a quiet tile when there is none. The block-local piece
 * stands in for a shared Avatar component and takes the same props a shared one would.
 */
export function Avatar({ name, src, size = 'md', decorative = true, className }: AvatarProps) {
  return (
    <BaseAvatar.Root
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : name}
      role={decorative ? undefined : 'img'}
      data-slot="avatar"
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full select-none',
        'bg-surface-sunken font-medium text-fg-muted ring-1 ring-line-strong ring-inset',
        SIZES[size],
        className,
      )}
    >
      {src !== undefined && (
        <BaseAvatar.Image src={src} alt="" className="absolute inset-0 size-full object-cover" />
      )}
      <BaseAvatar.Fallback className="leading-none tracking-tight">
        {initials(name)}
      </BaseAvatar.Fallback>
    </BaseAvatar.Root>
  );
}
