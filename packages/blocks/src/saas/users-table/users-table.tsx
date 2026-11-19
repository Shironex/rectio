import {
  CheckCircleIcon,
  CrownSimpleIcon,
  EnvelopeSimpleIcon,
  EyeIcon,
  LockSimpleIcon,
  MinusIcon,
  MagnifyingGlassIcon,
  ProhibitIcon,
  ShieldCheckIcon,
  UserMinusIcon,
  UserPlusIcon,
  UsersThreeIcon,
  XIcon,
  type Icon,
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
  type BadgeTone,
  type DataTableColumnDef,
} from '@rectio/ui';
import { useMemo, useState } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { ChoiceSelect, type Choice } from '../../lib/choice-select';
import { EmptyNote } from '../../lib/empty-note';
import { resolveLocale } from '../../lib/finance';
import { ActionMenu, type MenuAction } from '../lib/action-menu';
import { Avatar } from '../lib/avatar';
import { plural, relativeTime } from '../lib/saas';
import {
  EMPTY_USER_FILTERS,
  USER_ROLES,
  USER_ROLE_LABELS,
  USER_STATUSES,
  USER_STATUS_LABELS,
  bulkUserTargets,
  filterUsers,
  userCounts,
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
  title?: string;
  className?: string;
}

// Member is the normal case and stays plain text; the roles that change what someone can do get a badge.
const ROLE_STYLE: Record<Exclude<UserRole, 'member'>, { icon: Icon; tone: BadgeTone }> = {
  owner: { icon: CrownSimpleIcon, tone: 'info' },
  admin: { icon: ShieldCheckIcon, tone: 'neutral' },
  guest: { icon: EyeIcon, tone: 'neutral' },
};

const STATUS_STYLE: Record<Exclude<UserStatus, 'active'>, { icon: Icon; tone: BadgeTone }> = {
  invited: { icon: EnvelopeSimpleIcon, tone: 'warning' },
  suspended: { icon: ProhibitIcon, tone: 'negative' },
};

function RoleBadge({ role }: { role: UserRole }) {
  if (role === 'member') {
    return <span className="text-sm text-fg-muted">{USER_ROLE_LABELS[role]}</span>;
  }
  const { icon: RoleIcon, tone } = ROLE_STYLE[role];
  return (
    <Badge tone={tone}>
      <RoleIcon aria-hidden weight="bold" />
      {USER_ROLE_LABELS[role]}
    </Badge>
  );
}

/** Active is the normal case and stays quiet; only states that need attention get a badge. */
function StatusBadge({ status }: { status: UserStatus }) {
  if (status === 'active') {
    return <span className="text-sm text-fg-muted">{USER_STATUS_LABELS[status]}</span>;
  }
  const { icon: StatusIcon, tone } = STATUS_STYLE[status];
  return (
    <Badge tone={tone}>
      <StatusIcon aria-hidden weight="bold" />
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
  now = new Date(),
  locale: requestedLocale,
  pageSize = 10,
  onInvite,
  onOpenUser,
  onChangeRole,
  onSuspend,
  onReactivate,
  onRemove,
  title = 'Users',
  className,
}: UsersTableProps) {
  const locale = resolveLocale(requestedLocale);
  const { Button } = useBlockParts();
  const [filters, setFilters] = useState<UserFilters>(EMPTY_USER_FILTERS);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [removing, setRemoving] = useState<string[] | null>(null);

  const counts = userCounts(users);
  const rows = filterUsers(users, filters);
  const filtering = userFiltersActive(filters);
  const bulk = onChangeRole !== undefined || onSuspend !== undefined || onRemove !== undefined;
  // Only rows still on hand count as selected, so a selection never outlives its users.
  const selectedIds = users.filter((user) => rowSelection[user.id]).map((user) => user.id);
  const targets = bulkUserTargets(users, selectedIds);
  const byId = new Map(users.map((user) => [user.id, user]));

  const rowActions = (user: UserRecord): MenuAction[] => {
    if (user.role === 'owner') return [];
    const one = [user.id];
    return [
      ...(onChangeRole === undefined
        ? []
        : USER_ROLES.filter((role) => role !== 'owner' && role !== user.role).map((role) => ({
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
                onSuspend(one);
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
                setRemoving(one);
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
                  <span
                    className="flex size-4 items-center justify-center text-fg-subtle"
                    title="Owners are left out of bulk changes"
                  >
                    <LockSimpleIcon aria-hidden weight="bold" className="size-3.5" />
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
                  <span className="truncate font-medium">{user.name}</span>
                ) : (
                  <button
                    type="button"
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
                <span className="truncate text-sm text-fg-muted">{user.email}</span>
                {/* Narrow: role and status fold under the person. */}
                <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 @xl:hidden">
                  <RoleBadge role={user.role} />
                  <span aria-hidden className="text-fg-subtle">
                    ·
                  </span>
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
        cell: ({ row }) => <RoleBadge role={row.original.role} />,
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
            <time dateTime={seen.toISOString()} className="text-fg-muted">
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
          return actions.length === 0 ? null : (
            <ActionMenu label={`Actions for ${row.original.name}`} actions={actions} />
          );
        },
      },
    ],
    // rowActions reads the same callbacks listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bulk, onOpenUser, onChangeRole, onSuspend, onReactivate, onRemove, now, locale],
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
    enableRowSelection: (row) => row.original.role !== 'owner',
  });

  const setFilter = (next: Partial<UserFilters>) => {
    setFilters({ ...filters, ...next });
  };
  const clearSelection = () => {
    setRowSelection({});
  };

  const roleChoices: Choice<UserRole | 'all'>[] = [
    { value: 'all', label: 'All' },
    ...USER_ROLES.map((role) => ({ value: role, label: USER_ROLE_LABELS[role] })),
  ];
  const statusChoices: Choice<UserStatus | 'all'>[] = [
    { value: 'all', label: 'All' },
    ...USER_STATUSES.map((status) => ({ value: status, label: USER_STATUS_LABELS[status] })),
  ];

  const description = [
    plural(users.length, 'user'),
    counts.statuses.invited > 0 ? `${String(counts.statuses.invited)} invited` : null,
    counts.statuses.suspended > 0 ? `${String(counts.statuses.suspended)} suspended` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <BlockPanel
      title={title}
      description={description}
      actions={
        onInvite === undefined || users.length === 0 ? undefined : (
          <Button onClick={onInvite} aria-label="Invite users">
            <UserPlusIcon aria-hidden weight="bold" className="size-4" />
            {/* Narrow: the icon alone, so the button stays on the title's row. */}
            <span className="@max-md:sr-only">Invite users</span>
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
            <div className="relative flex-1">
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
            <div className="flex flex-wrap gap-2">
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
              <p aria-live="polite" className="text-sm">
                <span className="font-medium numeric">{selectedIds.length}</span> selected
                {targets.skippedOwners > 0 && (
                  <span className="text-fg-muted">
                    , {plural(targets.skippedOwners, 'owner')} left out of bulk changes
                  </span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2 pointer-coarse:gap-5">
                {onChangeRole !== undefined && (
                  <ActionMenu
                    label="Change role of the selected users"
                    trigger={<span className="text-fg">Change role</span>}
                    actions={USER_ROLES.filter((role) => role !== 'owner').map((role) => ({
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
                      onSuspend(targets.ids);
                      clearSelection();
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
                      setRemoving(targets.ids);
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
                  onClick={clearSelection}
                >
                  <XIcon aria-hidden weight="bold" className="size-3.5" />
                </Button>
              </div>
            </div>
          )}

          <DataTableSort table={table} className="w-full @xl:hidden" />

          <DataTable caption={`${title}, ${plural(rows.length, 'result')}`} hideCaption>
            <DataTableHeader table={table} className="@max-xl:sr-only" />
            <DataTableBody
              table={table}
              rowProps={(row) => ({
                'data-suspended': row.original.status === 'suspended' || undefined,
                className: 'data-suspended:text-fg-muted',
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
          {rows.length > pageSize && (
            <DataTablePagination
              table={table}
              locale={locale}
              formatRange={(first, last, total) =>
                `${String(first)} to ${String(last)} of ${plural(total, 'user')}`
              }
            />
          )}
        </>
      )}

      <RemoveUsersDialog
        users={removing === null ? [] : removing.flatMap((id) => byId.get(id) ?? [])}
        onCancel={() => {
          setRemoving(null);
        }}
        onConfirm={(ids) => {
          onRemove?.(ids);
          setRemoving(null);
          clearSelection();
        }}
      />
    </BlockPanel>
  );
}

function RemoveUsersDialog({
  users,
  onCancel,
  onConfirm,
}: {
  users: UserRecord[];
  onCancel: () => void;
  onConfirm: (ids: string[]) => void;
}) {
  const { Button } = useBlockParts();
  // While the dialog closes it keeps naming who it was about.
  const [shown, setShown] = useState(users);
  const key = users.map((u) => u.id).join();
  if (users.length > 0 && key !== shown.map((u) => u.id).join()) setShown(users);
  const one = shown.length === 1 ? shown[0] : undefined;
  return (
    <Dialog
      open={users.length > 0}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {one === undefined ? `Remove ${plural(shown.length, 'user')}?` : `Remove ${one.name}?`}
          </DialogTitle>
          <DialogDescription>
            {one === undefined
              ? 'They lose access at once. Their work stays in the workspace.'
              : `${one.email} loses access at once. Their work stays in the workspace.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              onConfirm(shown.map((u) => u.id));
            }}
          >
            {one === undefined ? `Remove ${plural(shown.length, 'user')}` : 'Remove user'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
