'use client';

import {
  CopyIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  FunnelSimpleIcon,
  PencilSimpleIcon,
  PlusIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import {
  AmountInput,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldLabel,
  Input,
  Menu,
  MenuContent,
  MenuGroup,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
  ThemeScope,
  ToastProvider,
  useToast,
} from '@rectio/ui';
import { memo, useEffect, useEffectEvent, useState, type ReactNode } from 'react';

import { PREVIEW_ID } from './model';

type Mode = 'light' | 'dark';

/**
 * A stage the overlays open inside. Its transform makes it the containing block of their fixed
 * positioning, so a dialog, a menu and a toast stay in the preview instead of covering the page;
 * the stage is its own ThemeScope, so they portal into it and keep the generated theme.
 */
function Stage({
  mode,
  label,
  children,
  height = 'h-96',
  className,
}: {
  mode: Mode;
  label: string;
  children: ReactNode;
  /** A height utility: the stage clips what opens inside it. */
  height?: string;
  className?: string;
}) {
  return (
    <figure className={`flex min-w-0 flex-col gap-2 ${className ?? ''}`}>
      <ThemeScope
        theme={PREVIEW_ID}
        mode={mode}
        className={`relative transform-gpu overflow-hidden rounded-panel border border-line ${height}`}
      >
        {children}
      </ThemeScope>
      <figcaption className="text-xs text-fg-subtle">{label}</figcaption>
    </figure>
  );
}

function DialogStage({ mode }: { mode: Mode }) {
  const [open, setOpen] = useState(true);
  return (
    <Stage
      mode={mode}
      label="Dialog over a page, with its scrim"
      height="h-120"
      className="md:col-span-2"
    >
      <div className="flex flex-col gap-3 p-5">
        <div className="h-3 w-32 rounded-full bg-surface-placeholder" />
        <div className="h-3 w-48 rounded-full bg-surface-placeholder" />
        <Dialog open={open} onOpenChange={setOpen} modal={false}>
          <DialogTrigger render={<Button size="sm" className="mt-2 w-fit" />}>
            <PlusIcon aria-hidden weight="bold" className="size-3.5" />
            Add expense
          </DialogTrigger>
          <DialogContent initialFocus={false} className="mx-auto">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setOpen(false);
              }}
            >
              <DialogHeader>
                <DialogTitle>Add expense</DialogTitle>
                <DialogDescription>Goes into the March report as a draft line.</DialogDescription>
              </DialogHeader>
              <DialogBody>
                <Field>
                  <FieldLabel>Merchant</FieldLabel>
                  <Input defaultValue="Deutsche Bahn" />
                </Field>
                <Field>
                  <FieldLabel>Amount, EUR</FieldLabel>
                  <AmountInput currency="EUR" locale="en-IE" defaultValue={89.9} />
                </Field>
              </DialogBody>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
                <Button type="submit">Save expense</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Stage>
  );
}

/** Shows one toast while the stage is open, and takes it away again on leaving. */
function StandingToast() {
  const toast = useToast();
  // The manager is a new object each render; an effect event reads the current one without
  // re-running the effect, so the toast is added once.
  const show = useEffectEvent(() =>
    toast.add({
      type: 'success',
      title: 'Invoice 2041 sent',
      description: 'Northwind Traders, due 14 April.',
      actionProps: { children: 'Undo' },
    }),
  );
  const hide = useEffectEvent((id: string) => {
    toast.close(id);
  });
  useEffect(() => {
    const id = show();
    return () => {
      hide(id);
    };
  }, []);
  return null;
}

/**
 * Opening a menu moves focus into it. Shown in place, it would pull focus away from whatever the
 * person was using (the preview tabs), so focus goes back there once the menu has opened.
 */
function useKeepFocus() {
  const [before] = useState<Element | null>(() =>
    typeof document === 'undefined' ? null : document.activeElement,
  );
  useEffect(() => {
    if (!(before instanceof HTMLElement)) return;
    const restore = () => {
      if (document.activeElement?.closest('[role=menu]')) before.focus({ preventScroll: true });
    };
    restore();
    document.addEventListener('focusin', restore);
    // Only the opening moves focus; after that the menu is the person's to use.
    const stop = window.setTimeout(() => {
      document.removeEventListener('focusin', restore);
    }, 600);
    return () => {
      window.clearTimeout(stop);
      document.removeEventListener('focusin', restore);
    };
  }, [before]);
}

function MenuStage({ mode }: { mode: Mode }) {
  const [open, setOpen] = useState(true);
  useKeepFocus();
  return (
    <Stage mode={mode} label="Menu">
      <div className="p-5">
        <Menu open={open} onOpenChange={setOpen} modal={false}>
          <MenuTrigger render={<Button variant="secondary" size="sm" />}>
            <DotsThreeIcon aria-hidden weight="bold" className="size-4" />
            Invoice 2041
          </MenuTrigger>
          <MenuContent align="start">
            <MenuGroup label="Invoice">
              <MenuItem icon={<PencilSimpleIcon weight="bold" />} shortcut="mod+e">
                Edit
              </MenuItem>
              <MenuItem icon={<CopyIcon weight="bold" />} shortcut="mod+d">
                Duplicate
              </MenuItem>
              <MenuItem icon={<DownloadSimpleIcon weight="bold" />}>Export as PDF</MenuItem>
            </MenuGroup>
            <MenuSeparator />
            <MenuItem tone="danger" icon={<TrashIcon weight="bold" />}>
              Delete draft
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
    </Stage>
  );
}

function PopoverStage({ mode }: { mode: Mode }) {
  const [open, setOpen] = useState(true);
  return (
    <Stage mode={mode} label="Popover and toast">
      <ToastProvider timeout={0}>
        <StandingToast />
        <div className="flex justify-end p-5">
          <Popover open={open} onOpenChange={setOpen} modal={false}>
            <PopoverTrigger render={<Button variant="secondary" size="sm" />}>
              <FunnelSimpleIcon aria-hidden weight="bold" className="size-4" />
              Filter
            </PopoverTrigger>
            <PopoverContent initialFocus={false} align="end" className="w-64">
              <PopoverTitle>Filter payables</PopoverTitle>
              <PopoverDescription>Show the bills of one supplier.</PopoverDescription>
              <Field>
                <FieldLabel>Supplier</FieldLabel>
                <Input defaultValue="Brennan Logistics" />
              </Field>
              <div className="flex justify-end gap-2 pt-1">
                <PopoverClose render={<Button variant="ghost" size="sm" />}>Cancel</PopoverClose>
                <Button size="sm">Apply</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </ToastProvider>
    </Stage>
  );
}

export const OverlaysScreen = memo(function OverlaysScreen({ mode }: { mode: Mode }) {
  return (
    <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-2">
      <DialogStage mode={mode} />
      <MenuStage mode={mode} />
      <PopoverStage mode={mode} />
    </div>
  );
});
