'use client';

import {
  DesktopIcon,
  DeviceMobileIcon,
  DeviceTabletIcon,
  MoonIcon,
  SunIcon,
} from '@phosphor-icons/react';
import { Select, SelectContent, SelectItem, SelectTrigger, cn } from '@rectio/ui';
import type { ReactNode } from 'react';

import { Segmented } from '@/components/segmented';
import type { PreviewPage } from '@/lib/previews-url';
import { MODES, THEMES, type Mode } from '@/lib/site';
import { DEVICES, type DeviceId } from '@/lib/viewer';

import type { Look } from './preview-frame';

const DEVICE_ICON = { desktop: DesktopIcon, tablet: DeviceTabletIcon, phone: DeviceMobileIcon };
const MODE_ICON = { light: SunIcon, dark: MoonIcon };
const MODE_LABEL: Record<Mode, string> = { light: 'Light', dark: 'Dark' };

/** What the viewer frames: which page, at which width, in which look. */
export function ViewerControls({
  pages,
  route,
  title,
  onRoute,
  device,
  onDevice,
  look,
  onLook,
  action,
  className,
}: {
  pages: readonly PreviewPage[];
  /** The declared route on show, or undefined when the template is on a page it does not list. */
  route: string | undefined;
  /** What the page on show calls itself: the trigger names the real record, not the route. */
  title: string;
  onRoute: (page: PreviewPage) => void;
  device: DeviceId;
  onDevice: (device: DeviceId) => void;
  look: Look;
  onLook: (look: Look) => void;
  /** Sits beside the page picker on a phone, where it is the main way to see the template. */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-2', className)}>
      <div className="flex min-w-0 items-center gap-2 max-sm:w-full">
        <Select
          value={route ?? null}
          items={pages.map((page) => ({ value: page.route, label: page.label }))}
          onValueChange={(value) => {
            const page = pages.find((p) => p.route === value);
            if (page !== undefined) onRoute(page);
          }}
        >
          <SelectTrigger aria-label="Page" className="min-w-0 flex-1 sm:w-60 sm:flex-none">
            <span className="truncate">
              {title !== ''
                ? title
                : (pages.find((p) => p.route === route)?.label ?? 'Another page')}
            </span>
            {route?.includes('[') === true && (
              <span className="ms-auto shrink-0 font-mono text-xs text-fg-subtle max-sm:hidden">
                {route}
              </span>
            )}
          </SelectTrigger>
          <SelectContent>
            {pages.map((page) => (
              <SelectItem
                key={page.route}
                value={page.route}
                hint={<span className="font-mono text-xs">{page.route}</span>}
              >
                {page.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {action}
      </div>
      <Segmented
        touch
        label="Width"
        value={device}
        onChange={onDevice}
        className="max-sm:hidden"
        options={DEVICES.map((d) => {
          const Icon = DEVICE_ICON[d.id];
          return {
            value: d.id,
            label: (
              <>
                <Icon aria-hidden weight="bold" className="size-3.5" />
                <span className="max-2xl:sr-only">{d.label}</span>
              </>
            ),
          };
        })}
      />
      {/* The site's own theme switch sits in the bar above: a framed, named group says this one
          changes the template. */}
      <div
        role="group"
        aria-label="Template look"
        className="flex items-center gap-2 rounded-control border border-dashed border-line-strong py-1 ps-3 pe-1 sm:ms-auto"
      >
        <span className="text-sm text-fg-muted">Template</span>
        <Segmented
          touch
          label="Template theme"
          value={look.theme}
          onChange={(theme) => {
            onLook({ ...look, theme });
          }}
          options={THEMES.map((t) => ({ value: t.id, label: t.name }))}
        />
        <Segmented
          touch
          label="Template mode"
          value={look.mode}
          onChange={(mode) => {
            onLook({ ...look, mode });
          }}
          options={MODES.map((m) => {
            const Icon = MODE_ICON[m];
            return {
              value: m,
              label: (
                <>
                  <Icon aria-hidden weight="bold" className="size-3.5" />
                  <span className="sr-only">{MODE_LABEL[m]}</span>
                </>
              ),
            };
          })}
        />
      </div>
    </div>
  );
}
