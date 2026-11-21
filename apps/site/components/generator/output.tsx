'use client';

import { CheckIcon, CopyIcon, LinkSimpleIcon } from '@phosphor-icons/react';
import { Button } from '@rectio/ui';
import { CODE_PARAM } from '@rectio/tokens/generator';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { CopyCommand } from '@/components/landing/copy-command';
import { withBase } from '@/lib/base-path';
import type { SkinTemplate } from '@/lib/generator-template';

import { SKIN_PARAM } from './use-skin';

const PAGE = '/docs/theming/generator';

const noop = () => () => undefined;
const browserOrigin = () => window.location.origin;
const serverOrigin = () => '';

/** Says "Copied" for a moment after a successful copy. */
function useCopy() {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => {
      setCopied(false);
    }, 1600);
    return () => {
      window.clearTimeout(id);
    };
  }, [copied]);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(true);
      },
      () => {
        // Clipboard refused (permissions, insecure origin): the text stays selectable.
      },
    );
  };
  return { copied, copy };
}

/** The share link for a code (and the previewed skin), on this site's origin and base path. */
export function shareUrl(origin: string, code: string, skin?: string): string {
  const skinPart = skin === undefined ? '' : `&${SKIN_PARAM}=${skin}`;
  return `${origin}${withBase(PAGE)}?${CODE_PARAM}=${code}${skinPart}`;
}

export function Output({
  code,
  css,
  name,
  skin,
}: {
  code: string;
  css: string;
  name: string;
  /** The skin the preview shows, installed beside the theme. */
  skin?: SkinTemplate | undefined;
}) {
  // The origin is only known in the browser; the static HTML carries the bare path until then.
  const origin = useSyncExternalStore(noop, browserOrigin, serverOrigin);
  const link = shareUrl(origin, code, skin?.id);
  const share = useCopy();
  const cssCopy = useCopy();
  const skinCopy = useCopy();
  const command = `pnpm dlx @rectio/cli add '${link}'${skin === undefined ? '' : ` skin-${skin.id}`}`;
  const lines = css.split('\n').length;

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="generator-install" className="flex flex-col gap-3">
        <h2
          id="generator-install"
          className="font-display text-xl font-heading tracking-tight text-fg"
        >
          Install with the CLI
        </h2>
        <p className="max-w-prose text-base text-fg-muted">
          In a project set up with <code className="font-mono text-sm text-fg">rectio init</code>,
          this writes <code className="font-mono text-sm text-fg">themes/{name}.css</code>
          {skin === undefined ? null : (
            <>
              {' '}
              and <code className="font-mono text-sm text-fg">skins/{skin.id}.css</code>
            </>
          )}
          , adds the fonts and locks the theme code, so{' '}
          <code className="font-mono text-sm text-fg">rectio diff</code> and{' '}
          <code className="font-mono text-sm text-fg">rectio update</code> follow it. The link is
          read on your machine; nothing is fetched from it.
        </p>
        <CopyCommand command={command} className="w-full" />
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              share.copy(link);
            }}
          >
            {share.copied ? (
              <CheckIcon aria-hidden weight="bold" className="size-3.5 text-positive-strong" />
            ) : (
              <LinkSimpleIcon aria-hidden weight="bold" className="size-3.5" />
            )}
            {share.copied ? 'Link copied' : 'Copy share link'}
          </Button>
          <p className="text-sm text-fg-muted">
            Opens this editor with every setting restored. The address bar holds the same link.
          </p>
        </div>
      </section>

      <section aria-labelledby="generator-css" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2
              id="generator-css"
              className="font-display text-xl font-heading tracking-tight text-fg"
            >
              Theme CSS
            </h2>
            <p className="text-sm text-fg-muted">
              The same file the CLI writes, {lines} lines. Import it after the kit&apos;s tokens.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              cssCopy.copy(css);
            }}
          >
            {cssCopy.copied ? (
              <CheckIcon aria-hidden weight="bold" className="size-3.5 text-positive-strong" />
            ) : (
              <CopyIcon aria-hidden weight="bold" className="size-3.5" />
            )}
            {cssCopy.copied ? 'CSS copied' : 'Copy CSS'}
          </Button>
        </div>
        <pre
          tabIndex={0}
          aria-label="Theme CSS"
          className="max-h-96 overflow-auto rounded-control border border-line bg-surface-sunken p-4 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <code>{css}</code>
        </pre>
        <span role="status" className="sr-only">
          {share.copied
            ? 'Share link copied'
            : cssCopy.copied
              ? 'Theme CSS copied'
              : skinCopy.copied
                ? 'Skin CSS copied'
                : ''}
        </span>
      </section>

      {skin === undefined ? null : (
        <section aria-labelledby="generator-skin" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2
                id="generator-skin"
                className="font-display text-xl font-heading tracking-tight text-fg"
              >
                {skin.title}
              </h2>
              <p className="max-w-3xl text-sm text-fg-muted">
                {skin.description} Import it after the theme and set{' '}
                <code className="font-mono text-xs text-fg">data-skin=&quot;{skin.id}&quot;</code>{' '}
                beside{' '}
                <code className="font-mono text-xs text-fg">data-theme=&quot;{name}&quot;</code>.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                skinCopy.copy(skin.css);
              }}
            >
              {skinCopy.copied ? (
                <CheckIcon aria-hidden weight="bold" className="size-3.5 text-positive-strong" />
              ) : (
                <CopyIcon aria-hidden weight="bold" className="size-3.5" />
              )}
              {skinCopy.copied ? 'CSS copied' : 'Copy CSS'}
            </Button>
          </div>
          <pre
            tabIndex={0}
            aria-label={`${skin.title} CSS`}
            className="max-h-72 overflow-auto rounded-control border border-line bg-surface-sunken p-4 font-mono text-xs leading-relaxed break-all whitespace-pre-wrap text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <code>{skin.css}</code>
          </pre>
        </section>
      )}
    </div>
  );
}
