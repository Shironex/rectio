'use client';

import { ArrowLeftIcon, ArrowSquareOutIcon, BookOpenTextIcon } from '@phosphor-icons/react';
import { Button } from '@rectio/ui';
import Link from 'next/link';
import { useRef, useState, useSyncExternalStore } from 'react';

import { CopyCommand } from '@/components/landing/copy-command';
import type { PreviewPage } from '@/lib/previews-url';
import { useSiteMode } from '@/lib/use-site-mode';
import { deviceWidth, initialDevice, pathInPreview, routeFor, type DeviceId } from '@/lib/viewer';

import { PreviewFrame, type Look } from './preview-frame';
import { useElementSize } from './use-element-size';
import { ViewerControls } from './viewer-controls';

const noop = () => () => undefined;

/**
 * The page asked for in the address when the viewer opened (`?page=/invoices`), read once per
 * viewer: the address follows the frame afterwards, and must not reload it.
 */
let opening: { at: string; page: string | null } | undefined;
function startPage(): string | null {
  if (opening?.at !== location.pathname) {
    const asked = new URLSearchParams(location.search).get('page');
    opening = {
      at: location.pathname,
      page: asked?.startsWith('/') === true && !asked.startsWith('//') ? asked : null,
    };
  }
  return opening.page;
}

export interface ViewerTemplate {
  name: string;
  title: string;
  category: string;
  command: string;
  docsHref: string;
  base: string;
  pages: PreviewPage[];
}

const urlOf = (base: string, path: string) => (path === '/' ? `${base}/` : `${base}${path}`);

/**
 * A template, live: the real static build in a frame at desktop, tablet or phone width, any of its
 * pages, in light and dark, with the way to open it whole, its docs and its install command.
 * The page on show is kept in the address (`?page=/invoices`), so a view can be shared.
 */
export function TemplateViewer({ template }: { template: ViewerTemplate }) {
  const { base, pages } = template;
  const routes = pages.map((p) => p.route);
  const first = pages[0]?.path ?? '/';
  const siteMode = useSiteMode();
  const [chosenLook, setLook] = useState<Look | null>(null);
  const look = chosenLook ?? { mode: siteMode };
  const stageRef = useRef<HTMLDivElement>(null);
  const stage = useElementSize(stageRef);
  const [chosenDevice, setDevice] = useState<DeviceId | null>(null);
  // Until the visitor picks a width, the widest one that fits the stage unscaled.
  const device = chosenDevice ?? initialDevice(stage.width);
  const start = useSyncExternalStore(noop, startPage, () => null);
  // A page picked in the controls: a fresh load each time, even of the page already on show.
  const [opened, setOpened] = useState<{ path: string; n: number } | null>(null);
  const [navigated, setNavigated] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const src = urlOf(base, opened?.path ?? start ?? first);
  const path = navigated ?? opened?.path ?? start ?? first;

  function onNavigate(pathname: string, title: string) {
    const next = pathInPreview(base, pathname);
    setNavigated(next);
    setPageTitle(title.split(' | ')[0]?.trim() ?? '');
    const url = new URL(location.href);
    if (next === first) url.searchParams.delete('page');
    else url.searchParams.set('page', next);
    history.replaceState(history.state, '', url);
  }

  const fullScreenLink = <a href={urlOf(base, path)} target="_blank" rel="noopener noreferrer" />;

  return (
    <div className="site-viewer flex flex-col">
      <div className="mx-auto flex w-full max-w-screen-2xl flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 max-sm:flex-1">
          <Link
            href="/templates"
            className="site-press inline-flex size-11 shrink-0 items-center justify-center rounded-control border border-line text-fg-muted pointer-fine:hover:bg-surface-hover pointer-fine:hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:size-9"
          >
            <ArrowLeftIcon aria-hidden weight="bold" className="size-4 rtl:-scale-x-100" />
            <span className="sr-only">All templates</span>
          </Link>
          <div className="flex min-w-0 flex-col">
            <h1 className="flex items-center gap-2 font-display text-xl font-heading tracking-tight text-fg">
              <span className="truncate">{template.title}</span>
            </h1>
            <p className="text-sm text-fg-muted">
              {template.category}, <span className="numeric">{pages.length}</span>{' '}
              {pages.length === 1 ? 'page' : 'pages'}
            </p>
          </div>
        </div>
        <ViewerControls
          action={
            <Button nativeButton={false} render={fullScreenLink} className="shrink-0 sm:hidden">
              <ArrowSquareOutIcon aria-hidden weight="bold" className="size-4" />
              Full screen
              <span className="sr-only"> (opens in a new tab)</span>
            </Button>
          }
          className="min-w-0 flex-1 max-sm:order-last max-sm:basis-full"
          pages={pages}
          route={routeFor(routes, path)}
          title={path === '/' ? 'Home' : pageTitle}
          onRoute={(page) => {
            setOpened((current) => ({ path: page.path, n: (current?.n ?? 0) + 1 }));
            setNavigated(null);
          }}
          device={device}
          onDevice={setDevice}
          look={look}
          onLook={setLook}
        />
        <div className="flex items-center gap-2 max-sm:ms-auto">
          <Button
            variant="secondary"
            nativeButton={false}
            render={<Link href={template.docsHref} />}
            className="max-sm:size-11 max-sm:px-0"
          >
            <BookOpenTextIcon aria-hidden weight="bold" className="size-4" />
            <span className="max-sm:sr-only">Docs</span>
          </Button>
          <Button nativeButton={false} render={fullScreenLink} className="max-sm:hidden">
            <ArrowSquareOutIcon aria-hidden weight="bold" className="size-4" />
            Open full screen
            <span className="sr-only"> (opens in a new tab)</span>
          </Button>
        </div>
      </div>
      <div className="site-panel flex min-h-0 flex-1 flex-col border-t border-line">
        <div
          ref={stageRef}
          className="site-viewer-stage flex justify-center px-4 pt-4 pb-4 sm:px-6"
        >
          <PreviewFrame
            key={opened?.n ?? 0}
            src={src}
            fullScreen={urlOf(base, path)}
            width={deviceWidth(device)}
            stage={stage}
            look={look}
            title={`${template.title} template, live`}
            onNavigate={onNavigate}
            onLookChange={setLook}
          />
        </div>
        <div className="mx-auto flex w-full max-w-screen-2xl flex-wrap items-center gap-x-4 gap-y-2 px-4 pb-4 sm:px-6">
          <CopyCommand command={template.command} />
          <p className="text-sm text-fg-muted">
            The command writes the whole app into a new folder, as your own source.
          </p>
        </div>
      </div>
    </div>
  );
}
