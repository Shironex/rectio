'use client';

import {
  BuildingsIcon,
  DownloadSimpleIcon,
  FileCsvIcon,
  MagnifyingGlassIcon,
  UploadSimpleIcon,
} from '@phosphor-icons/react';
import {
  Avatar,
  Badge,
  Button,
  DataTable,
  DataTableBody,
  DataTableHeader,
  DataTablePagination,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Toggle,
  ToggleGroup,
  useDataTable,
  useToast,
  type DataTableColumnDef,
} from '@rectio/ui';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { CUSTOMERS, PLAN_ORDER, type Customer, type CustomerHealth } from '@/data/customers';
import { agentById } from '@/data/team';
import {
  NOW,
  formatCount,
  formatDuration,
  formatShortDate,
  formatTime,
  plural,
} from '@/data/workspace';
import { PageHeader } from '../page-header';
import { EmptyPanel, ErrorPanel, LoadingPanel, LoadingRegion } from '../states/state-views';
import { usePageState } from '../use-page-state';
import { Csat, HealthBadge, PLAN_TONES } from './customer-format';

type HealthFilter = 'all' | CustomerHealth;

const HEALTH_FILTERS: readonly { value: HealthFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'watch', label: 'Watch' },
  { value: 'at-risk', label: 'At risk' },
];

const PLAN_ITEMS = [
  { value: 'all', label: 'Every plan' },
  ...PLAN_ORDER.map((p) => ({ value: p, label: p })),
];

/** "12 min ago" for today, otherwise the date: when the customer last wrote. */
function lastContact(date: Date): string {
  const minutes = Math.round((NOW.getTime() - date.getTime()) / 60_000);
  if (minutes < 60 * 12) return `${formatDuration(Math.max(minutes, 1))} ago`;
  if (minutes < 60 * 24) return `Yesterday, ${formatTime(date)}`;
  return formatShortDate(date);
}

const columns: DataTableColumnDef<Customer>[] = [
  {
    accessorKey: 'name',
    header: 'Customer',
    sortFn: 'text',
    cell: ({ row }) => (
      <span className="flex min-w-0 items-center gap-3">
        <Avatar name={row.original.name} size="md" square />
        <span className="flex min-w-0 flex-col">
          <Link
            href={`/customers/${row.original.id}`}
            className="truncate font-medium text-fg hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {row.original.name}
          </Link>
          <span className="truncate text-sm text-fg-muted">
            <span className="md:hidden">
              {row.original.plan}, {plural(row.original.openTickets, 'open ticket')}
            </span>
            <span className="max-md:hidden">{row.original.city}</span>
          </span>
        </span>
      </span>
    ),
  },
  {
    accessorKey: 'plan',
    header: 'Plan',
    sortFn: (a, b) => PLAN_ORDER.indexOf(a.original.plan) - PLAN_ORDER.indexOf(b.original.plan),
    meta: { className: 'hidden md:table-cell' },
    cell: ({ row }) => (
      <span className="flex flex-col items-start gap-0.5">
        <Badge tone={PLAN_TONES[row.original.plan]}>{row.original.plan}</Badge>
        <span className="text-xs text-fg-muted numeric">{plural(row.original.seats, 'seat')}</span>
      </span>
    ),
  },
  {
    accessorKey: 'health',
    header: 'Health',
    sortFn: 'text',
    cell: ({ row }) => <HealthBadge health={row.original.health} />,
  },
  {
    accessorKey: 'openTickets',
    header: 'Open',
    sortFn: 'basic',
    meta: { align: 'end', label: 'Open tickets', className: 'hidden sm:table-cell' },
    cell: ({ row }) => (
      <span className={row.original.openTickets === 0 ? 'text-fg-subtle' : undefined}>
        {formatCount(row.original.openTickets)}
      </span>
    ),
  },
  {
    id: 'csat',
    accessorFn: (c) => c.csat ?? -1,
    header: 'Satisfaction',
    sortFn: 'basic',
    meta: { align: 'end', className: 'hidden lg:table-cell' },
    cell: ({ row }) => <Csat value={row.original.csat} />,
  },
  {
    accessorKey: 'firstResponse',
    header: 'First reply',
    sortFn: 'basic',
    meta: { align: 'end', label: 'Median first reply', className: 'hidden xl:table-cell' },
    cell: ({ row }) => formatDuration(row.original.firstResponse),
  },
  {
    accessorKey: 'lastContact',
    header: 'Last contact',
    sortFn: 'datetime',
    meta: { className: 'hidden lg:table-cell' },
    cell: ({ row }) => (
      <span className="text-fg-muted">{lastContact(row.original.lastContact)}</span>
    ),
  },
  {
    accessorKey: 'ownerId',
    header: 'Owner',
    enableSorting: false,
    meta: { className: 'hidden xl:table-cell' },
    cell: ({ row }) => {
      const owner = agentById(row.original.ownerId);
      return owner === undefined ? null : (
        <span className="flex items-center gap-2">
          <Avatar name={owner.name} size="sm" />
          <span className="truncate text-sm">{owner.name.split(' ')[0]}</span>
        </span>
      );
    },
  },
];

function CustomersTable({ customers }: { customers: readonly Customer[] }) {
  const table = useDataTable({
    data: customers,
    columns,
    paginate: true,
    getRowId: (customer) => customer.id,
    initialState: {
      sorting: [{ id: 'lastContact', desc: true }],
      pagination: { pageIndex: 0, pageSize: 10 },
    },
  });
  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-panel border border-line bg-surface">
        <DataTable caption="Customers" hideCaption>
          <DataTableHeader table={table} />
          <DataTableBody table={table} />
        </DataTable>
      </div>
      <DataTablePagination table={table} locale="en-US" />
    </div>
  );
}

export function CustomersPage() {
  const state = usePageState();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [health, setHealth] = useState<HealthFilter>('all');
  const [plan, setPlan] = useState('all');

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CUSTOMERS.filter(
      (c) =>
        (health === 'all' || c.health === health) &&
        (plan === 'all' || c.plan === plan) &&
        (q === '' ||
          `${c.name} ${c.contact.name} ${c.contact.email} ${c.city} ${c.tags.join(' ')}`
            .toLowerCase()
            .includes(q)),
    );
  }, [query, health, plan]);

  const atRisk = CUSTOMERS.filter((c) => c.health === 'at-risk').length;
  const seats = CUSTOMERS.reduce((sum, c) => sum + c.seats, 0);

  const exportAs = (format: string) => {
    toast.add({
      title: `Exporting ${plural(shown.length, 'customer')}`,
      description: `The ${format} file is emailed to you when it is ready.`,
    });
  };

  return (
    <>
      <PageHeader
        title="Customers"
        description={
          state === 'ready'
            ? `${plural(CUSTOMERS.length, 'account')}, ${formatCount(seats)} Copperline seats, ${String(atRisk)} at risk`
            : undefined
        }
        actions={
          state === 'empty' ? undefined : (
            <>
              <Menu>
                <MenuTrigger render={<Button variant="secondary" />}>
                  <DownloadSimpleIcon aria-hidden weight="bold" className="size-4" />
                  Export
                </MenuTrigger>
                <MenuContent align="end">
                  <MenuItem
                    icon={<FileCsvIcon aria-hidden className="size-4" />}
                    onClick={() => {
                      exportAs('CSV');
                    }}
                  >
                    CSV, for spreadsheets
                  </MenuItem>
                  <MenuItem
                    icon={<FileCsvIcon aria-hidden className="size-4" />}
                    onClick={() => {
                      exportAs('Excel');
                    }}
                  >
                    Excel workbook
                  </MenuItem>
                </MenuContent>
              </Menu>
              <Button
                onClick={() => {
                  toast.add({
                    title: 'Import started',
                    description: 'Choose a CSV with a name and an email column.',
                  });
                }}
              >
                <UploadSimpleIcon aria-hidden weight="bold" className="size-4" />
                Import
              </Button>
            </>
          )
        }
      />
      {state === 'loading' ? (
        <LoadingRegion label="Loading customers">
          <LoadingPanel kind="table" rows={10} columns={5} toolbar tabs={3} />
        </LoadingRegion>
      ) : state === 'error' ? (
        <ErrorPanel title="Customers did not load" />
      ) : state === 'empty' ? (
        <EmptyPanel
          icon={<BuildingsIcon aria-hidden weight="bold" />}
          title="No customers yet"
          description="Import a CSV from your CRM, or let them arrive with their first ticket. Each customer collects its tickets, people and notes."
          actions={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  toast.add({ title: 'Add a customer', description: 'Name, plan and a contact.' });
                }}
              >
                Add one by hand
              </Button>
              <Button>Import a CSV</Button>
            </>
          }
        />
      ) : (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <SearchInput
              aria-label="Search customers"
              placeholder="Search by name, contact, city or tag"
              value={query}
              onValueChange={setQuery}
              groupClassName="md:max-w-sm md:flex-1"
            />
            <div className="flex flex-wrap items-center gap-3">
              <ToggleGroup
                aria-label="Health"
                value={[health]}
                onValueChange={(value: string[]) => {
                  const next = HEALTH_FILTERS.find((h) => h.value === value[0]);
                  if (next !== undefined) setHealth(next.value);
                }}
              >
                {HEALTH_FILTERS.map((h) => (
                  <Toggle key={h.value} value={h.value}>
                    {h.label}
                  </Toggle>
                ))}
              </ToggleGroup>
              <Select
                items={PLAN_ITEMS}
                value={plan}
                onValueChange={(value) => {
                  if (value !== null) setPlan(value);
                }}
              >
                <SelectTrigger aria-label="Plan" className="w-40" />
                <SelectContent>
                  {PLAN_ITEMS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {shown.length === 0 ? (
            <EmptyPanel
              icon={<MagnifyingGlassIcon aria-hidden weight="bold" />}
              title="No customers match"
              description="Try another name or email, or clear the filters."
              actions={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setHealth('all');
                    setPlan('all');
                  }}
                >
                  Clear the filters
                </Button>
              }
            />
          ) : (
            <CustomersTable key={`${query}|${health}|${plan}`} customers={shown} />
          )}
        </>
      )}
    </>
  );
}
