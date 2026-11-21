'use client';

import { createContext, use, type ComponentProps, type ReactElement, type ReactNode } from 'react';

import { isExternalHref, isHashHref } from './href';

/** The props a router link receives: an anchor's props with an `href`. */
export type LinkRenderProps = ComponentProps<'a'> & { href: string; children?: ReactNode };

/** Draws an internal link, such as `(props) => <NextLink {...props} />`. */
export type LinkRender = (props: LinkRenderProps) => ReactNode;

const plainLink: LinkRender = (props) => <a {...props} />;

const LinkContext = createContext<LinkRender>(plainLink);

export interface LinkProviderProps {
  /** Draws every internal link the kit renders, such as `(props) => <NextLink {...props} />`. */
  render: LinkRender;
  children: ReactNode;
}

/**
 * Sends every link the components and blocks draw through your router's link component, so they
 * follow its base path and change pages on the client. Wrap the app once, in a client module:
 *
 *   <LinkProvider render={(props) => <NextLink {...props} />}>{children}</LinkProvider>
 *
 * Without a provider a link is a plain anchor. Links that leave the app (`https:`, `mailto:`,
 * `tel:`) and links within the page (`#pricing`) are always plain anchors.
 */
export function LinkProvider({ render, children }: LinkProviderProps) {
  return <LinkContext value={render}>{children}</LinkContext>;
}

/** The link renderer of the nearest `LinkProvider`, or a plain anchor without one. */
export function useLinkRender(): LinkRender {
  return use(LinkContext);
}

export interface AnchorProps extends ComponentProps<'a'> {
  href: string;
  /**
   * Opens in a new tab: adds `target="_blank"`, `rel="noopener noreferrer"` and a visually hidden
   * hint after the label. Never goes through the router.
   */
  external?: boolean | undefined;
  /** The hidden hint read after an external link's label. Default " (opens in a new tab)". */
  newTabHint?: string | undefined;
}

/**
 * The one place the kit renders a navigational link. Internal addresses go through the app's
 * router link from `LinkProvider`; addresses that leave the app, links within the page and
 * external links stay plain anchors.
 */
export function Anchor({
  href,
  external = false,
  newTabHint = ' (opens in a new tab)',
  children,
  ...props
}: AnchorProps) {
  const render = useLinkRender();
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
        {newTabHint !== '' && <span className="sr-only">{newTabHint}</span>}
      </a>
    );
  }
  if (isExternalHref(href) || isHashHref(href)) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
  return render({ href, children, ...props });
}

/**
 * The element a Base UI link part renders: the caller's own `render` when given, otherwise the
 * kit's `Anchor` for an `href`, so the part follows a `LinkProvider`. Spread the result.
 */
export function anchorRender<T>(
  render: T | undefined,
  href: string | undefined,
): { render?: T | ReactElement<AnchorProps> } {
  if (render !== undefined) return { render };
  return href === undefined ? {} : { render: <Anchor href={href} /> };
}
