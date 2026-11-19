import { Avatar as SharedAvatar, cn } from '@rectio/ui';

export type AvatarSize = 'sm' | 'md' | 'lg';

// The blocks use three steps; the large one is the profile picture size.
const SIZES = { sm: 'sm', md: 'md', lg: 'xl' } as const;

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
 * The shared Avatar with the blocks' defaults: most avatars sit beside the written name, so they
 * are decorative unless told otherwise, and carry a hairline ring that holds a photo's edge.
 */
export function Avatar({ name, src, size = 'md', decorative = true, className }: AvatarProps) {
  return (
    <SharedAvatar
      name={name}
      src={src}
      size={SIZES[size]}
      className={cn('ring-1 ring-line ring-inset', className)}
      {...(decorative
        ? { role: 'presentation', 'aria-hidden': true, 'aria-label': undefined }
        : {})}
    />
  );
}
