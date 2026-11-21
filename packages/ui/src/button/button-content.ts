import type { Button as BaseButton } from '@base-ui/react/button';
import { Children, Fragment, isValidElement, type ComponentProps, type ReactNode } from 'react';

/** How a button reads its children and its render prop. Plain, so a server can run it too. */

/**
 * Splits a leading icon off a button's children, so the loading spinner can take its slot and the
 * button keeps its width. An element counts as the icon only when a label follows it, or when it
 * is all an icon-only button holds; a lone component child is treated as the label.
 */
export function splitLeadingIcon(
  children: ReactNode,
  iconOnly = false,
): { icon: ReactNode; label: ReactNode } {
  let items = Children.toArray(children);
  const [only] = items;
  if (
    items.length === 1 &&
    isValidElement<{ children?: ReactNode }>(only) &&
    only.type === Fragment
  ) {
    items = Children.toArray(only.props.children);
  }
  const [first, ...rest] = items;
  const isIcon =
    isValidElement(first) &&
    (typeof first.type !== 'string' || first.type === 'svg') &&
    (rest.length > 0 || iconOnly);
  return isIcon ? { icon: first, label: rest } : { icon: null, label: items };
}

/**
 * Whether `render` draws a native <button>: an element tells by its type, so a link or a router
 * link is not one; a render function cannot tell, so it stays native unless `nativeButton` says.
 */
export function inferNativeButton(render: ComponentProps<typeof BaseButton>['render']): boolean {
  if (render === undefined || typeof render === 'function') return true;
  return isValidElement(render) && render.type === 'button';
}
