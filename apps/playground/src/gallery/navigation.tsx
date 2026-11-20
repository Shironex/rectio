import {
  ArrowsDownUpIcon,
  ChartLineUpIcon,
  CopyIcon,
  DownloadSimpleIcon,
  FileTextIcon,
  FunnelIcon,
  PencilSimpleIcon,
  ReceiptIcon,
  TrashIcon,
  WalletIcon,
} from '@phosphor-icons/react';
import * as moving from '@rectio/motion/navigation';
import {
  Breadcrumb,
  Button,
  Checkbox,
  CommandMenu,
  CommandMenuTrigger,
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  HoverCard,
  HoverCardContent as PlainHoverCardContent,
  HoverCardTrigger,
  Kbd,
  KbdShortcut,
  Menu,
  MenuCheckboxItem,
  Money,
  MenuContent as PlainMenuContent,
  MenuGroup,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent as PlainMenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  NavigationBar,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPanelLink,
  NavigationMenuTrigger,
  Pagination,
  Popover,
  PopoverClose,
  PopoverContent as PlainPopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Tabs,
  TabsList as PlainTabsList,
  TabsPanel as PlainTabsPanel,
  TabsTab,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  type CommandGroup,
} from '@rectio/ui';
import { createContext, use, useState, type ReactNode } from 'react';

import { Row, Section } from './specimen';

/** Whether the sections below use the motioned twins, so one gallery shows both. */
export const MotionContext = createContext(false);

function useParts() {
  const motion = use(MotionContext);
  return motion
    ? moving
    : {
        MenuContent: PlainMenuContent,
        MenuSubContent: PlainMenuSubContent,
        PopoverContent: PlainPopoverContent,
        HoverCardContent: PlainHoverCardContent,
        TabsList: PlainTabsList,
        TabsPanel: PlainTabsPanel,
      };
}

const icon = (Icon: typeof ReceiptIcon) => <Icon aria-hidden className="size-4" />;

export function NavigationBarSection() {
  return (
    <Section
      title="Navigation bar"
      note="A top bar for sites and simple apps. Panels open on hover or click; below the medium breakpoint the links move into a sheet."
    >
      <NavigationBar
        className="rounded-panel border border-line"
        brand={<span className="font-display text-lg font-heading">Fernhill</span>}
        actions={
          <Button size="sm" variant="secondary">
            Sign in
          </Button>
        }
        mobileMenu={(close) => (
          <nav aria-label="Site" className="flex flex-col gap-1 p-2">
            {['Accounting', 'Invoicing', 'Payroll', 'Pricing'].map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase()}`}
                onClick={close}
                className="rounded-control px-3 py-2.5 text-base text-fg hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
              >
                {label}
              </a>
            ))}
          </nav>
        )}
      >
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Product</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-1 p-2 sm:grid-cols-2">
                  <li>
                    <NavigationMenuPanelLink
                      href="#accounting"
                      icon={icon(ChartLineUpIcon)}
                      title="Accounting"
                      description="Ledger, journals and reports, closed monthly."
                    />
                  </li>
                  <li>
                    <NavigationMenuPanelLink
                      href="#invoicing"
                      icon={icon(ReceiptIcon)}
                      title="Invoicing"
                      description="Send, chase and reconcile invoices."
                    />
                  </li>
                  <li>
                    <NavigationMenuPanelLink
                      href="#payables"
                      icon={icon(WalletIcon)}
                      title="Payables"
                      description="Approve bills and schedule payments."
                    />
                  </li>
                  <li>
                    <NavigationMenuPanelLink
                      href="#documents"
                      icon={icon(FileTextIcon)}
                      title="Documents"
                      description="Receipts matched to transactions."
                    />
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#pricing" active>
                Pricing
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#customers">Customers</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </NavigationBar>
    </Section>
  );
}

export function TabsSection() {
  const { TabsList, TabsPanel } = useParts();
  return (
    <Section
      title="Tabs"
      note="Line tabs switch the sections of a page; segmented tabs switch views of the same data."
    >
      <Row label="Line">
        <Tabs defaultValue="open" className="w-full max-w-lg">
          <TabsList aria-label="Invoices">
            <TabsTab value="all" hint={42}>
              All
            </TabsTab>
            <TabsTab value="open" hint={12}>
              Open
            </TabsTab>
            <TabsTab value="overdue" hint={3}>
              Overdue
            </TabsTab>
            <TabsTab value="void" hint={0} disabled>
              Void
            </TabsTab>
          </TabsList>
          <TabsPanel value="all" className="pt-3 text-sm text-fg-muted">
            42 invoices this year.
          </TabsPanel>
          <TabsPanel value="open" className="pt-3 text-sm text-fg-muted">
            12 open invoices, 18 450 EUR outstanding.
          </TabsPanel>
          <TabsPanel value="overdue" className="pt-3 text-sm text-fg-muted">
            3 overdue, the oldest by 21 days.
          </TabsPanel>
        </Tabs>
      </Row>
      <Row label="Segmented">
        <Tabs defaultValue="month">
          <TabsList variant="segmented" aria-label="Period">
            <TabsTab value="week">Week</TabsTab>
            <TabsTab value="month">Month</TabsTab>
            <TabsTab value="quarter">Quarter</TabsTab>
            <TabsTab value="year">Year</TabsTab>
          </TabsList>
        </Tabs>
      </Row>
    </Section>
  );
}

function ActionsMenu({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const { MenuContent, MenuSubContent } = useParts();
  const [columns, setColumns] = useState({ due: true, vat: false });
  const [sort, setSort] = useState('due');
  return (
    <Menu defaultOpen={defaultOpen} modal={false}>
      <MenuTrigger render={<Button variant="secondary">Actions</Button>} />
      <MenuContent>
        <MenuItem icon={icon(PencilSimpleIcon)} shortcut="e">
          Edit
        </MenuItem>
        <MenuItem icon={icon(CopyIcon)} shortcut="mod+d">
          Duplicate
        </MenuItem>
        <MenuSub>
          <MenuSubTrigger icon={icon(DownloadSimpleIcon)}>Export</MenuSubTrigger>
          <MenuSubContent>
            <MenuItem>PDF</MenuItem>
            <MenuItem>CSV</MenuItem>
            <MenuItem>JPK_FA (XML)</MenuItem>
          </MenuSubContent>
        </MenuSub>
        <MenuSeparator />
        <MenuGroup label="Columns">
          <MenuCheckboxItem
            checked={columns.due}
            onCheckedChange={(due) => {
              setColumns((c) => ({ ...c, due }));
            }}
          >
            Due date
          </MenuCheckboxItem>
          <MenuCheckboxItem
            checked={columns.vat}
            onCheckedChange={(vat) => {
              setColumns((c) => ({ ...c, vat }));
            }}
          >
            VAT
          </MenuCheckboxItem>
        </MenuGroup>
        <MenuSeparator />
        <MenuRadioGroup value={sort} onValueChange={setSort}>
          <MenuGroup label="Sort by">
            <MenuRadioItem value="due">Due date</MenuRadioItem>
            <MenuRadioItem value="amount">Amount</MenuRadioItem>
          </MenuGroup>
        </MenuRadioGroup>
        <MenuSeparator />
        <MenuItem icon={icon(TrashIcon)} tone="danger">
          Void invoice
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

export function MenuSection() {
  const { MenuContent } = useParts();
  return (
    <Section
      title="Menu"
      note="Actions on one thing. Checkbox and radio rows stay open; shortcuts are shown for the platform and announced."
    >
      <Row label="Dropdown" center>
        <ActionsMenu />
        <Menu modal={false}>
          <MenuTrigger
            render={
              <Button variant="ghost" iconOnly aria-label="Sort">
                {icon(ArrowsDownUpIcon)}
              </Button>
            }
          />
          <MenuContent align="end">
            <MenuItem>Newest first</MenuItem>
            <MenuItem>Oldest first</MenuItem>
          </MenuContent>
        </Menu>
      </Row>
      <Row label="Context menu">
        <ContextMenu>
          <ContextMenuTrigger
            tabIndex={0}
            className="flex h-24 w-full max-w-sm items-center justify-center rounded-panel border border-dashed border-line-strong px-4 text-center text-sm text-fg-muted focus-visible:outline-2 focus-visible:outline-focus"
          >
            Right-click or long-press INV-2026-0124 (or focus it and press Shift F10)
          </ContextMenuTrigger>
          <ContextMenuContent>
            <MenuItem icon={icon(PencilSimpleIcon)} shortcut="e">
              Edit
            </MenuItem>
            <MenuItem icon={icon(CopyIcon)} shortcut="mod+d">
              Duplicate
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={icon(TrashIcon)} tone="danger">
              Void invoice
            </MenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Row>
    </Section>
  );
}

export function OverlaySection() {
  const { PopoverContent, HoverCardContent } = useParts();
  return (
    <Section
      title="Popover, hover card, tooltip"
      note="A popover holds controls; a hover card previews a link and is never the only way to the content; a tooltip names an icon."
    >
      <Row label="Popover" center>
        <Popover>
          <PopoverTrigger render={<Button variant="secondary">{icon(FunnelIcon)}Filters</Button>} />
          <PopoverContent className="w-72" showClose>
            <PopoverTitle>Filter invoices</PopoverTitle>
            <PopoverDescription>Issued in March 2026.</PopoverDescription>
            <fieldset className="mt-3 flex flex-col gap-2.5">
              <legend className="mb-2 text-xs font-medium tracking-caps text-fg-subtle uppercase">
                Status
              </legend>
              {[
                ['Outstanding', true],
                ['Overdue', true],
                ['Paid', false],
              ].map(([label, checked]) => (
                <label key={String(label)} className="flex items-center gap-2 text-sm">
                  <Checkbox defaultChecked={Boolean(checked)} />
                  {label}
                </label>
              ))}
            </fieldset>
            <div className="mt-4 flex justify-end gap-2">
              <PopoverClose render={<Button variant="ghost" size="sm" />}>Reset</PopoverClose>
              <PopoverClose render={<Button size="sm" />}>Apply</PopoverClose>
            </div>
          </PopoverContent>
        </Popover>
      </Row>
      <Row label="Hover card" center>
        <p className="text-sm text-fg-muted">
          Issued to{' '}
          <HoverCard>
            <HoverCardTrigger href="#customer">Barrett Furniture Ltd</HoverCardTrigger>
            <HoverCardContent>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-fg">Barrett Furniture Ltd</p>
                <p className="text-sm text-fg-muted">VAT IE 8274915KH, Cork</p>
                <p className="text-sm text-fg-muted">6 invoices, 1 overdue</p>
              </div>
            </HoverCardContent>
          </HoverCard>{' '}
          on 28 January.
        </p>
      </Row>
      <Row label="Tooltip" center>
        <TooltipProvider>
          {[
            { label: 'Download statement', Icon: DownloadSimpleIcon, shortcut: 'mod+s' },
            { label: 'Duplicate', Icon: CopyIcon, shortcut: 'mod+d' },
            { label: 'Delete draft', Icon: TrashIcon },
          ].map(({ label, Icon, shortcut }) => (
            <Tooltip key={label}>
              <TooltipTrigger
                render={
                  <Button variant="secondary" iconOnly aria-label={label}>
                    {icon(Icon)}
                  </Button>
                }
              />
              <TooltipContent {...(shortcut === undefined ? {} : { shortcut })}>
                {label}
              </TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </Row>
    </Section>
  );
}

function SheetDemo({ side, label }: { side: 'left' | 'right' | 'top' | 'bottom'; label: string }) {
  return (
    <Sheet side={side}>
      <SheetTrigger render={<Button variant="secondary">{label}</Button>} />
      <SheetContent>
        <SheetHeader>
          <SheetTitle>INV-2026-0124</SheetTitle>
          <SheetDescription>Barrett Furniture Ltd, due 27 February.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-fg-muted">Total</dt>
            <dd className="text-end">
              <Money amount={11_872.5} currency="EUR" locale="en-IE" />
            </dd>
            <dt className="text-fg-muted">Paid</dt>
            <dd className="text-end">
              <Money amount={5_000} currency="EUR" locale="en-IE" />
            </dd>
            <dt className="text-fg-muted">Balance</dt>
            <dd className="text-end font-medium">
              <Money amount={6_872.5} currency="EUR" locale="en-IE" />
            </dd>
          </dl>
        </SheetBody>
        <SheetFooter>
          <Button variant="secondary">Send reminder</Button>
          <Button>Record payment</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export function SheetSection() {
  return (
    <Section
      title="Sheet"
      note="Detail or a short form beside the page. From the bottom on a phone, swiped away by its handle."
    >
      <Row label="Sides" center>
        <SheetDemo side="right" label="Right" />
        <SheetDemo side="left" label="Left" />
        <SheetDemo side="top" label="Top" />
        <SheetDemo side="bottom" label="Bottom sheet" />
      </Row>
    </Section>
  );
}

export function WayfindingSection() {
  const [page, setPage] = useState(4);
  return (
    <Section
      title="Breadcrumb, pagination"
      note="Deep trails fold their middle into a menu. Pagination keeps its width while paging; on a phone it shows the page in words."
    >
      <Row label="Breadcrumb">
        <Breadcrumb
          items={[
            { label: 'Fernhill Systems', href: '#home' },
            { label: 'Books', href: '#books' },
            { label: 'Ledger', href: '#ledger' },
            { label: '4000 Sales', href: '#sales' },
            { label: 'March 2026', href: '#march' },
            { label: 'Entry 2041' },
          ]}
        />
      </Row>
      <Row label="Pagination">
        <Pagination page={page} pageCount={24} onPageChange={setPage} />
      </Row>
      <Row label="Compact">
        <Pagination page={page} pageCount={24} onPageChange={setPage} variant="compact" />
      </Row>
    </Section>
  );
}

const COMMANDS: CommandGroup[] = [
  {
    label: 'Go to',
    items: [
      { id: 'invoices', label: 'Invoices', icon: icon(ReceiptIcon), onSelect: () => undefined },
      { id: 'payables', label: 'Payables', icon: icon(WalletIcon), onSelect: () => undefined },
    ],
  },
];

export function KeyboardSection() {
  return (
    <Section
      title="Command menu, keys"
      note="Search and run anything from the keyboard. Keycaps read as words to a screen reader."
    >
      <Row label="Command menu" center>
        <CommandMenu groups={COMMANDS} shortcut={null}>
          <CommandMenuTrigger shortcut="mod+k" />
        </CommandMenu>
      </Row>
      <Row label="Kbd" center>
        <Kbd>Esc</Kbd>
        <KbdShortcut shortcut="mod+k" />
        <KbdShortcut shortcut="mod+shift+p" />
      </Row>
    </Section>
  );
}

/** Every navigation and overlay component, plain or motioned. */
export function NavigationGallery({ motion = false }: { motion?: boolean }): ReactNode {
  return (
    <MotionContext value={motion}>
      <NavigationBarSection />
      <TabsSection />
      <MenuSection />
      <OverlaySection />
      <SheetSection />
      <WayfindingSection />
      <KeyboardSection />
    </MotionContext>
  );
}
