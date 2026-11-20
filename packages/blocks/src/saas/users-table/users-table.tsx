import {
  CheckCircleIcon,
  CaretDownIcon,
  LockSimpleIcon,
  MinusIcon,
  FunnelSimpleIcon,
  MagnifyingGlassIcon,
  ProhibitIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersThreeIcon,
  XIcon,
} from '@phosphor-icons/react';
import type { RowSelectionState } from '@tanstack/react-table';
import {
  Badge,
  Checkbox,
  DataTable,
  DataTableBody,
  DataTableHeader,
  DataTablePagination,
  DataTableSort,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  cn,
  selectionColumn,
  useDataTable,
  type DataTableColumnDef,
} from '@rectio/ui';
import { useDeferredValue, useId, useMemo, useRef, useState } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { ChoiceSelect, type Choice } from '../../lib/choice-select';
import { EmptyNote } from '../../lib/empty-note';
import { resolveLocale } from '../../lib/finance';
import { ActionMenu, type MenuAction } from '../lib/action-menu';
import { Avatar } from '../lib/avatar';
import { useNow, useRemovalFocus } from '../lib/focus';
import { isoDateTime, countLabel, relativeTime } from '../lib/saas';
import {
  EMPTY_USER_FILTERS,
  USER_ROLES,
  USER_ROLE_LABELS,
  USER_STATUSES,
  USER_STATUS_LABELS,
  assignableUserRoles,
  bulkUserTargets,
  canActOnUser,
  filterUsers,
  userCounts,
  userHaystacks,
  userFiltersActive,
  type UserFilters,
  type UserRecord,
  type UserRole,
  type UserStatus,
} from './users-table.logic';

export interface UsersTableProps {
  users: readonly UserRecord[];
  /** The moment "last seen" is measured from. */
  now?: Date;
  locale?: string;
  /** Rows per page; the table pages only when there are more users than this. */
  pageSize?: number;
  /** Shows an Invite button in the heading row. */
  onInvite?: () => void;
  /** Opens a user; the name becomes a button when given. */
  onOpenUser?: (user: UserRecord) => void;
  /** Called with the ids to change; owners are never in a bulk change. */
  onChangeRole?: (ids: string[], role: UserRole) => void;
  onSuspend?: (ids: string[]) => void;
  onReactivate?: (ids: string[]) => void;
  /** Asked to confirm first, in a dialog naming who goes. */
  onRemove?: (ids: string[]) => void;
  /**
   * The signed-in user's role, from your session: they act only on people at or below it, hand
   * out only those roles, and as a member or guest manage no one. Leave it out to let your
   * callbacks alone decide.
   */
  currentRole?: UserRole | undefined;
  title?: string;
  className?: string;
}

// Role is plain text, so the one chip in a row is the status: a quiet outlined badge with a
// coloured dot. The words carry the meaning; the dot only marks it. Owners carry a lock, since
// they sit outside bulk changes.
// Suspended also says it in the negative text colour, since it is the status that needs action.
const STATUS_TEXT: Partial<Record<UserStatus, string>> = { suspended: 'text-negative-strong' };
const STATUS_DOT: Record<UserStatus, string> = {
  active: 'bg-positive',
  invited: 'bg-warning',
  suspended: 'bg-negative',
};

function RoleLabel({ role }: { role: UserRole }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-fg">
      {role === 'owner' && (
        <LockSimpleIcon aria-hidden weight="bold" className="size-3.5 text-fg-subtle" />
      )}
      {USER_ROLE_LABELS[role]}
    </span>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge className={cn('text-sm', STATUS_TEXT[status])}>
      <span aria-hidden className={cn('size-2 shrink-0 rounded-full', STATUS_DOT[status])} />
      {USER_STATUS_LABELS[status]}
    </Badge>
  );
}

const WIDE = 'hidden @2xl:table-cell';

/**
 * Everyone with access, searchable and filtered by role and status, with a bulk bar for the
 * selected rows: change role, suspend or reactivate, remove. Owners are left out of every bulk
 * change (see `bulkUserTargets`). Data-agnostic: pass your users and handle the callbacks.
 */
export function UsersTable({
  users,
  now: requestedNow,
  locale: requestedLocale,
  pageSize = 10,
  onInvite,
  onOpenUser,
  onChangeRole,
  onSuspend,
  onReactivate,
  onRemove,
  currentRole,
  title = 'Users',
  className,
}: UsersTableProps) {
  const locale = resolveLocale(requestedLocale);
  // Held still across renders, so the columns memo below keeps.
  const now = useNow(requestedNow);
  const { Button } = useBlockParts();
  const [filters, setFilters] = useState<UserFilters>(EMPTY_USER_FILTERS);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [confirming, setConfirming] = useState<{
    action: UsersTableAction;
    ids: string[];
  } | null>(null);

  // Typing stays quick on long lists: the filter runs on a deferred copy of the query, and each
  // user's search text is folded once per list.
  const query = useDeferredValue(filters.query);
  const haystacks = useMemo(() => userHaystacks(users), [users]);
  const counts = useMemo(() => userCounts(users), [users]);
  const rows = useMemo(
    () => filterUsers(users, { ...filters, query }, haystacks),
    [users, filters, query, haystacks],
  );
  const filtering = userFiltersActive(filters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersId = useId();
  const viewer = { role: currentRole };
  const grantable = assignableUserRoles(viewer);
  // A member or guest manages no one: no checkboxes, no bulk bar, no row menus.
  const bulk =
    (currentRole === undefined || grantable.length > 0) &&
    (onChangeRole !== undefined || onSuspend !== undefined || onRemove !== undefined);
  // Only rows still on hand count as selected, so a selection never outlives its users.
  const selectedIds = useMemo(
    () => users.filter((user) => rowSelection[user.id]).map((user) => user.id),
    [users, rowSelection],
  );
  const targets = useMemo(
    () => bulkUserTargets(users, selectedIds, { role: currentRole }),
    [users, selectedIds, currentRole],
  );
  const byId = useMemo(() => new Map(users.map((user) => [user.id, user])), [users]);

  const rowActions = (user: UserRecord): MenuAction[] => {
    if (!canActOnUser(user, viewer)) return [];
    const one = [user.id];
    return [
      ...(onChangeRole === undefined
        ? []
        : grantable
            .filter((role) => role !== user.role)
            .map((role) => ({
              id: `role-${role}`,
              label: `Make ${USER_ROLE_LABELS[role].toLowerCase()}`,
              onSelect: () => {
                onChangeRole(one, role);
              },
            }))),
      ...(user.status === 'suspended' && onReactivate !== undefined
        ? [
            {
              id: 'reactivate',
              label: 'Reactivate',
              icon: CheckCircleIcon,
              onSelect: () => {
                onReactivate(one);
              },
            },
          ]
        : []),
      ...(user.status !== 'suspended' && onSuspend !== undefined
        ? [
            {
              id: 'suspend',
              label: 'Suspend access',
              icon: ProhibitIcon,
              onSelect: () => {
                setConfirming({ action: 'suspend', ids: one });
              },
            },
          ]
        : []),
      ...(onRemove === undefined
        ? []
        : [
            {
              id: 'remove',
              label: 'Remove user',
              icon: UserMinusIcon,
              danger: true,
              onSelect: () => {
                setConfirming({ action: 'remove', ids: one });
              },
            },
          ]),
    ];
  };

  const columns = useMemo<DataTableColumnDef<UserRecord>[]>(
    () => [
      ...(bulk
        ? [
            {
              ...selectionColumn<UserRecord>({ rowLabel: (row) => `Select ${row.original.name}` }),
              // Owners never join a bulk change: a lock says why, where a dead checkbox would not.
              cell: ({ row }) =>
                row.getCanSelect() ? (
                  <span className="flex items-center">
                    <Checkbox
                      aria-label={`Select ${row.original.name}`}
                      checked={row.getIsSelected()}
                      onCheckedChange={(_checked, details) => {
                        row.getToggleSelectedHandler()(details.event);
                      }}
                    />
                  </span>
                ) : (
                  // Drawn in the checkbox's own footprint, so the column keeps one clean edge.
                  <span
                    className="flex size-4 items-center justify-center rounded-badge border border-line bg-surface-sunken text-fg-muted"
                    title="Owners are left out of bulk changes"
                  >
                    <LockSimpleIcon aria-hidden weight="bold" className="size-2.5" />
                    <span className="sr-only">
                      {row.original.name} is an owner and is left out of bulk changes
                    </span>
                  </span>
                ),
            } satisfies DataTableColumnDef<UserRecord>,
          ]
        : []),
      {
        id: 'name',
        accessorFn: (user) => user.name,
        header: 'User',
        sortFn: 'text',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <span className="flex min-w-0 items-center gap-3">
              <Avatar name={user.name} src={user.avatarUrl} />
              <span className="flex min-w-0 flex-col">
                {onOpenUser === undefined ? (
                  <span className="truncate font-medium" title={user.name}>
                    {user.name}
                  </span>
                ) : (
                  <button
                    type="button"
                    title={user.name}
                    onClick={() => {
                      onOpenUser(user);
                    }}
                    className={cn(
                      'w-fit cursor-pointer truncate rounded-badge text-start font-medium hover:underline hover:underline-offset-4',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                    )}
                  >
                    {user.name}
                  </button>
                )}
                <span className="truncate text-sm text-fg-muted" title={user.email}>
                  {user.email}
                </span>
                {/* Narrow: last seen as a quiet line, since its column is hidden. */}
                <span className="text-sm text-fg-subtle @2xl:hidden">
                  {user.lastSeen === undefined
                    ? 'Never signed in'
                    : `Seen ${relativeTime(user.lastSeen, now, locale)}`}
                </span>
                {/* Narrow: role and status fold under the person. */}
                <span className="mt-1 flex min-w-0 items-center gap-x-2 overflow-hidden whitespace-nowrap @xl:hidden">
                  <RoleLabel role={user.role} />
                  <StatusBadge status={user.status} />
                </span>
              </span>
            </span>
          );
        },
      },
      {
        id: 'team',
        accessorFn: (user) => user.team ?? '',
        header: 'Team',
        sortFn: 'text',
        meta: { className: WIDE },
        cell: ({ row }) => <span className="text-fg-muted">{row.original.team ?? 'None'}</span>,
      },
      {
        id: 'role',
        accessorFn: (user) => USER_ROLES.indexOf(user.role),
        header: 'Role',
        sortFn: 'basic',
        meta: { className: 'hidden @xl:table-cell' },
        cell: ({ row }) => <RoleLabel role={row.original.role} />,
      },
      {
        id: 'status',
        accessorFn: (user) => USER_STATUSES.indexOf(user.status),
        header: 'Status',
        sortFn: 'basic',
        meta: { className: 'hidden @xl:table-cell' },
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        id: 'lastSeen',
        accessorFn: (user) => user.lastSeen?.getTime() ?? 0,
        header: 'Last seen',
        sortFn: 'basic',
        meta: { className: `${WIDE} whitespace-nowrap`, label: 'Last seen' },
        cell: ({ row }) => {
          const seen = row.original.lastSeen;
          return seen === undefined ? (
            <span className="inline-flex text-fg-subtle">
              <MinusIcon aria-hidden weight="bold" className="size-3.5" />
              <span className="sr-only">Never signed in</span>
            </span>
          ) : (
            <time dateTime={isoDateTime(seen)} className="text-fg-muted">
              {relativeTime(seen, now, locale)}
            </time>
          );
        },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className="sr-only">Actions</span>,
        meta: { align: 'end', className: 'w-0' },
        cell: ({ row }) => {
          const actions = rowActions(row.original);
          // A row without actions keeps the menu's width, so the right edge stays even.
          return actions.length === 0 ? (
            <span
              aria-hidden
              className="inline-block h-(--rx-button-height-sm) w-(--rx-button-height-sm)"
            />
          ) : (
            <ActionMenu label={`Actions for ${row.original.name}`} actions={actions} />
          );
        },
      },
    ],
    // rowActions reads the same callbacks listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bulk, onOpenUser, onChangeRole, onSuspend, onReactivate, onRemove, now, locale, currentRole],
  );

  const table = useDataTable({
    data: rows,
    columns,
    getRowId: (user) => user.id,
    paginate: rows.length > pageSize,
    initialState: { pagination: { pageIndex: 0, pageSize } },
    state: { rowSelection },
    onRowSelectionChange: (updater) => {
      setRowSelection((current) => (typeof updater === 'function' ? updater(current) : updater));
    },
    enableRowSelection: (row) => canActOnUser(row.original, viewer),
  });

  const setFilter = (next: Partial<UserFilters>) => {
    setFilters({ ...filters, ...next });
  };
  const clearSelection = () => {
    setRowSelection({});
  };
  // When the bulk bar goes away, focus lands on the select-all checkbox (or the table), not the page.
  const tableArea = useRef<HTMLDivElement>(null);
  const bulkLanding = () =>
    tableArea.current?.querySelector<HTMLElement>('[aria-label="Select all rows"]') ??
    tableArea.current;
  // A removal hands focus to the next row on the page, else the previous one, else the table.
  const removal = useRemovalFocus(
    tableArea,
    table.getRowModel().rows.map((row) => row.id),
    () => bulkLanding(),
  );
  const endBulk = () => {
    clearSelection();
    requestAnimationFrame(() => {
      bulkLanding()?.focus();
    });
  };

  const roleChoices: Choice<UserRole | 'all'>[] = [
    { value: 'all', label: 'All' },
    ...USER_ROLES.map((role) => ({ value: role, label: USER_ROLE_LABELS[role] })),
  ];
  const statusChoices: Choice<UserStatus | 'all'>[] = [
    { value: 'all', label: 'All' },
    ...USER_STATUSES.map((status) => ({ value: status, label: USER_STATUS_LABELS[status] })),
  ];

  const extra = [
    counts.statuses.invited > 0 ? `${String(counts.statuses.invited)} invited` : null,
    counts.statuses.suspended > 0 ? `${String(counts.statuses.suspended)} suspended` : null,
  ].filter(Boolean);
  // Narrow: the count alone, so the Invite button keeps its place on the title's row.
  const description = (
    <>
      {countLabel(users.length, 'user')}
      {extra.length > 0 && <span className="@max-md:hidden">, {extra.join(', ')}</span>}
    </>
  );
  const filtersOn = (filters.role === 'all' ? 0 : 1) + (filters.status === 'all' ? 0 : 1);

  return (
    <BlockPanel
      title={title}
      description={description}
      actions={
        onInvite === undefined || users.length === 0 ? undefined : (
          <Button onClick={onInvite}>
            <UserPlusIcon aria-hidden weight="bold" className="size-4" />
            {/* One text node for the label, so the button's gap sits only after the icon. */}
            <span>
              Invite<span className="@max-md:hidden"> users</span>
            </span>
          </Button>
        )
      }
      className={className}
      bodyClassName="gap-4"
    >
      {users.length === 0 ? (
        <EmptyNote
          title={
            <span className="flex flex-col items-center gap-3">
              <UsersThreeIcon aria-hidden weight="duotone" className="size-8 text-fg-subtle" />
              Bring your team in
            </span>
          }
        >
          Invite people by email; each one shows here with their role and status.
          {onInvite !== undefined && (
            <span className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={onInvite}>
                <UserPlusIcon aria-hidden weight="bold" className="size-4" />
                Invite users
              </Button>
            </span>
          )}
        </EmptyNote>
      ) : (
        <>
          <div className="flex flex-col gap-2 @2xl:flex-row @2xl:items-center">
            <div className="relative w-full @2xl:w-72 @2xl:flex-none">
              <MagnifyingGlassIcon
                aria-hidden
                weight="bold"
                className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-fg-subtle"
              />
              <Input
                type="search"
                aria-label="Search users"
                placeholder="Search by name, email or team"
                value={filters.query}
                onChange={(event) => {
                  setFilter({ query: event.target.value });
                }}
                className="ps-9"
              />
            </div>
            {/* Narrow: filters and sort fold behind one row, so the first user shows sooner. */}
            <Button
              variant="ghost"
              className="justify-between text-fg-muted @2xl:hidden"
              aria-expanded={filtersOpen}
              aria-controls={filtersId}
              onClick={() => {
                setFiltersOpen(!filtersOpen);
              }}
            >
              <span className="inline-flex items-center gap-2">
                <FunnelSimpleIcon aria-hidden weight="bold" className="size-4" />
                Filter and sort
                {filtersOn > 0 && <span className="text-fg-subtle">, {String(filtersOn)} on</span>}
              </span>
              <CaretDownIcon
                aria-hidden
                weight="bold"
                className={cn(
                  'size-3.5 transition-transform duration-fast ease-standard',
                  filtersOpen && 'rotate-180',
                )}
              />
            </Button>
            <div
              id={filtersId}
              className={cn('flex flex-wrap gap-2', !filtersOpen && '@max-2xl:hidden')}
            >
              <ChoiceSelect
                label="Role"
                value={filters.role}
                onValueChange={(role) => {
                  setFilter({ role });
                }}
                choices={roleChoices}
                className="min-w-36 flex-1"
              />
              <ChoiceSelect
                label="Status"
                value={filters.status}
                onValueChange={(status) => {
                  setFilter({ status });
                }}
                choices={statusChoices}
                className="min-w-40 flex-1"
              />
            </div>
          </div>

          {bulk && selectedIds.length > 0 && (
            <div
              role="region"
              aria-label="Bulk actions"
              className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-control border border-line bg-surface-sunken px-3 py-1.5"
            >
              <p className="text-sm">
                <span className="font-medium numeric">{selectedIds.length}</span> selected
                {targets.skipped > 0 && (
                  <span className="text-fg-muted">
                    ,{' '}
                    {targets.skipped === targets.skippedOwners
                      ? countLabel(targets.skippedOwners, 'owner')
                      : countLabel(targets.skipped, 'user')}{' '}
                    left out of bulk changes
                  </span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2 pointer-coarse:gap-5">
                {onChangeRole !== undefined && (
                  <ActionMenu
                    label="Change role of the selected users"
                    trigger={<span className="text-fg">Change role</span>}
                    actions={grantable.map((role) => ({
                      id: role,
                      label: USER_ROLE_LABELS[role],
                      disabled: targets.ids.length === 0,
                      onSelect: () => {
                        onChangeRole(targets.ids, role);
                      },
                    }))}
                  />
                )}
                {onSuspend !== undefined && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={targets.ids.length === 0}
                    onClick={() => {
                      setConfirming({ action: 'suspend', ids: targets.ids });
                    }}
                  >
                    <ProhibitIcon aria-hidden weight="bold" className="size-3.5" />
                    Suspend
                  </Button>
                )}
                {onRemove !== undefined && (
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={targets.ids.length === 0}
                    onClick={() => {
                      setConfirming({ action: 'remove', ids: targets.ids });
                    }}
                  >
                    <UserMinusIcon aria-hidden weight="bold" className="size-3.5" />
                    Remove
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  aria-label="Clear selection"
                  onClick={endBulk}
                >
                  <XIcon aria-hidden weight="bold" className="size-3.5" />
                </Button>
              </div>
            </div>
          )}

          <DataTableSort
            table={table}
            className={cn('w-full @xl:hidden', !filtersOpen && 'hidden')}
          />
          {/* Always mounted, so a change in the count is read out as filters change. */}
          <p role="status" className="sr-only">
            {countLabel(rows.length, 'result')}
            {selectedIds.length > 0 && `, ${String(selectedIds.length)} selected`}
          </p>

          <div
            ref={tableArea}
            tabIndex={-1}
            className="rounded-control focus-visible:outline-2 focus-visible:outline-focus"
          >
            <DataTable caption={`${title}, ${countLabel(rows.length, 'result')}`} hideCaption>
              {/* Narrow rows describe themselves and DataTableSort sorts, so the header row goes
                  away instead of leaving sort buttons focusable but unseen. */}
              <DataTableHeader table={table} className="@max-xl:hidden" />
              <DataTableBody
                table={table}
                rowProps={(row) => ({
                  'data-row-id': row.id,
                  'data-suspended': row.original.status === 'suspended' || undefined,
                })}
                empty={
                  <span className="flex flex-col items-center gap-3">
                    <span className="flex flex-col items-center gap-1">
                      <span className="font-medium text-fg">No users match</span>
                      <span>
                        {filters.query.trim() === ''
                          ? 'Try another role or status.'
                          : `Nothing for "${filters.query.trim()}". Check the spelling or search by email.`}
                      </span>
                    </span>
                    {filtering && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setFilters(EMPTY_USER_FILTERS);
                        }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </span>
                }
              />
            </DataTable>
          </div>
          {rows.length > pageSize && (
            <DataTablePagination
              table={table}
              locale={locale}
              formatRange={(first, last, total) =>
                `${String(first)} to ${String(last)} of ${countLabel(total, 'user')}`
              }
            />
          )}
        </>
      )}

      <ConfirmUsersDialog
        action={confirming?.action ?? 'remove'}
        users={confirming === null ? [] : confirming.ids.flatMap((id) => byId.get(id) ?? [])}
        onCancel={() => {
          setConfirming(null);
        }}
        finalFocus={() => {
          const landing = removal.landing();
          return landing === true ? (bulkLanding() ?? true) : landing;
        }}
        onConfirm={(action, ids) => {
          if (action === 'remove') {
            removal.prepare(ids);
            onRemove?.(ids);
          } else onSuspend?.(ids);
          setConfirming(null);
          clearSelection();
        }}
      />
    </BlockPanel>
  );
}

type UsersTableAction = 'remove' | 'suspend';

const CONFIRM_COPY: Record<
  UsersTableAction,
  { verb: string; one: (user: UserRecord) => string; many: string; button: string }
> = {
  remove: {
    verb: 'Remove',
    one: (user) => `${user.email} loses access at once. Their work stays in the workspace.`,
    many: 'They lose access at once. Their work stays in the workspace.',
    button: 'Remove user',
  },
  suspend: {
    verb: 'Suspend',
    one: (user) => `${user.email} is signed out and cannot sign in until reactivated.`,
    many: 'They are signed out and cannot sign in until reactivated.',
    button: 'Suspend user',
  },
};

function ConfirmUsersDialog({
  action,
  users,
  finalFocus,
  onCancel,
  onConfirm,
}: {
  action: UsersTableAction;
  users: UserRecord[];
  /** Where focus goes once the dialog closes after a confirm; the trigger may be gone by then. */
  finalFocus: () => HTMLElement | true;
  onCancel: () => void;
  onConfirm: (action: UsersTableAction, ids: string[]) => void;
}) {
  const { Button } = useBlockParts();
  // A confirm sends focus to `finalFocus`; Cancel and Escape return it to the trigger as usual.
  const confirmed = useRef(false);
  // While the dialog closes it keeps naming who and what it was about.
  const [shown, setShown] = useState({ action, users });
  const key = users.map((u) => u.id).join();
  if (
    users.length > 0 &&
    (key !== shown.users.map((u) => u.id).join() || action !== shown.action)
  ) {
    setShown({ action, users });
  }
  const copy = CONFIRM_COPY[shown.action];
  const one = shown.users.length === 1 ? shown.users[0] : undefined;
  return (
    <Dialog
      open={users.length > 0}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent
        finalFocus={() => {
          const after = confirmed.current;
          confirmed.current = false;
          return after ? finalFocus() : true;
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {one === undefined
              ? `${copy.verb} ${countLabel(shown.users.length, 'user')}?`
              : `${copy.verb} ${one.name}?`}
          </DialogTitle>
          <DialogDescription>{one === undefined ? copy.many : copy.one(one)}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              confirmed.current = true;
              onConfirm(
                shown.action,
                shown.users.map((u) => u.id),
              );
            }}
          >
            {one === undefined
              ? `${copy.verb} ${countLabel(shown.users.length, 'user')}`
              : copy.button}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
