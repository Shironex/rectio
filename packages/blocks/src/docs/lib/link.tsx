import { createContext, use, type ComponentProps, type ReactNode } from 'react';

/** The props a router link receives: an anchor's props with an `href`. */
export type DocsLinkRenderProps = ComponentProps<'a'> & { href: string; children?: ReactNode };

/** Draws an internal link, such as `(props) => <NextLink {...props} />`. */
export type DocsLinkRender = (props: DocsLinkRenderProps) => ReactNode;

const plainLink: DocsLinkRender = (props) => <a {...props} />;

const LinkContext = createContext<DocsLinkRender>(plainLink);

/**
 * Every link the docs blocks draw goes through `DocsLink`, so one provider swaps in a router's
 * link component (Next, React Router, TanStack, Remix) for the whole kit:
 *
 *   <DocsLinkProvider render={(props) => <NextLink {...props} />}>…</DocsLinkProvider>
 *
 * Without a provider a link is a plain anchor. External links are always plain anchors that open
 * in a new tab.
 */
export function DocsLinkProvider({
  render,
  children,
}: {
  render: DocsLinkRender;
  children: ReactNode;
}) {
  return <LinkContext value={render}>{children}</LinkContext>;
}

export interface DocsLinkProps extends ComponentProps<'a'> {
  href: string;
  /** Leaves the docs: a plain anchor that opens in a new tab, never the router's link. */
  external?: boolean | undefined;
}

export function DocsLink({ href, external = false, children, ...props }: DocsLinkProps) {
  const render = use(LinkContext);
  if (external || /^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" {...props}>
        {children}
      </a>
    );
  }
  return render({ href, children, ...props });
}

/** The focus ring every docs link shares. */
export const linkFocus =
  'rounded-control outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus';
