import {
  Anchor,
  LinkProvider,
  type AnchorProps,
  type LinkRender,
  type LinkRenderProps,
} from '@rectio/ui';
import type { ReactNode } from 'react';

/** The props a router link receives: an anchor's props with an `href`. */
export type DocsLinkRenderProps = LinkRenderProps;

/** Draws an internal link, such as `(props) => <NextLink {...props} />`. */
export type DocsLinkRender = LinkRender;

/**
 * The kit's `LinkProvider` under the docs blocks' older name: one provider swaps in a router's link
 * component (Next, React Router, TanStack, Remix) for every component and block:
 *
 *   <DocsLinkProvider render={(props) => <NextLink {...props} />}>…</DocsLinkProvider>
 *
 * Without a provider a link is a plain anchor.
 */
export function DocsLinkProvider({
  render,
  children,
}: {
  render: DocsLinkRender;
  children: ReactNode;
}) {
  return <LinkProvider render={render}>{children}</LinkProvider>;
}

export interface DocsLinkProps extends Omit<AnchorProps, 'newTabHint'> {
  href: string;
  /** Leaves the docs: a plain anchor that opens in a new tab, never the router's link. */
  external?: boolean | undefined;
}

/**
 * A docs link: through the router inside the site; a web address opens in a new tab. The blocks
 * word the new tab hint themselves, so the kit's own hint stays off.
 */
export function DocsLink({ href, external = false, ...props }: DocsLinkProps) {
  return (
    <Anchor href={href} external={external || /^https?:\/\//.test(href)} newTabHint="" {...props} />
  );
}

/** The focus ring every docs link shares. */
export const linkFocus =
  'rounded-control outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus';
