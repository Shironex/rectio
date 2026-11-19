'use client';

import { DownloadSimpleIcon, PrinterIcon, ShareNetworkIcon } from '@phosphor-icons/react';
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@rectio/ui';

const ACTIONS = [
  { label: 'Download PDF', shortcut: 'mod+s', icon: DownloadSimpleIcon },
  { label: 'Print invoice', shortcut: 'mod+p', icon: PrinterIcon },
  { label: 'Share a link', shortcut: undefined, icon: ShareNetworkIcon },
] as const;

export default function TooltipDemo() {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1" role="toolbar" aria-label="Invoice 2041">
        {ACTIONS.map(({ label, shortcut, icon: Icon }) => (
          <Tooltip key={label}>
            <TooltipTrigger render={<Button variant="ghost" iconOnly aria-label={label} />}>
              <Icon aria-hidden weight="bold" className="size-4" />
            </TooltipTrigger>
            <TooltipContent {...(shortcut === undefined ? {} : { shortcut })}>
              {label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}
