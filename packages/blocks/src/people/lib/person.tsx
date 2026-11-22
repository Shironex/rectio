import { Avatar, cn, type AvatarSize } from '@rectio/ui';

/**
 * A person's picture or initials beside their written name. Decorative, since the name is always
 * printed next to it, with a hairline ring that holds a photo's edge on any surface.
 */
export function PersonAvatar({
  name,
  src,
  size = 'md',
  className,
}: {
  name: string;
  src?: string | undefined;
  size?: AvatarSize | undefined;
  className?: string | undefined;
}) {
  return (
    <Avatar
      name={name}
      src={src}
      size={size}
      role="presentation"
      aria-hidden
      aria-label={undefined}
      className={cn('shrink-0 ring-1 ring-line ring-inset', className)}
    />
  );
}
