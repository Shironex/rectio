import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

/** A 16px decorative icon, the size the sidebar, menus and buttons expect. */
export function icon(Icon: PhosphorIcon, className = 'size-4') {
  return <Icon aria-hidden weight="regular" className={className} />;
}
