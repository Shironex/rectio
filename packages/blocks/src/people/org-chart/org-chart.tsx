'use client';

import {
  ArrowUpIcon,
  CaretRightIcon,
  EnvelopeSimpleIcon,
  TreeStructureIcon,
  UserIcon,
} from '@phosphor-icons/react';
import {
  Anchor,
  SearchInput,
  SkeletonListItem,
  Tree,
  cn,
  touchHitArea,
  type TreeNode,
} from '@rectio/ui';
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { BlockPanel } from '../../lib/block-panel';
import { EmptyNote } from '../../lib/empty-note';
import { mergeMessages } from '../../lib/messages';
import { PersonAvatar } from '../lib/person';
import { ORG_CHART_MESSAGES, type OrgChartMessages } from './org-chart-messages';
import {
  buildOrg,
  managerChain,
  searchOrg,
  type OrgModel,
  type OrgPerson,
} from './org-chart.logic';

export interface OrgChartProps {
  /** Everyone, each naming their manager by id. */
  people: readonly OrgPerson[];
  /** The person picked, controlled. */
  selected?: string | null | undefined;
  defaultSelected?: string | null | undefined;
  onSelectedChange?: ((id: string | null) => void) | undefined;
  /** Links the picked person to their profile, through the LinkProvider when there is one. */
  personHref?: ((person: OrgPerson) => string) | undefined;
  /** Levels open at first: 1 shows the top and their direct reports. */
  defaultDepth?: number | undefined;
  /** Most direct reports listed in the person panel before the rest are counted. */
  reportsShown?: number | undefined;
  title?: string | undefined;
  description?: ReactNode;
  actions?: ReactNode;
  loading?: boolean | undefined;
  headingLevel?: 2 | 3 | undefined;
  messages?: Partial<OrgChartMessages> | undefined;
  className?: string | undefined;
}

/**
 * Who reports to whom: a tree of people with avatars, titles and team sizes, which opens and
 * closes by branch and is read with the keyboard (arrows move, Right opens, Left closes, typing
 * jumps to a name). Search finds anyone and opens the branches down to them. The picked person's
 * manager and reports sit beside the tree. On a phone the chart is a list that steps into a team
 * and back up. Only open branches are drawn, so an org of thousands stays quick.
 */
export function OrgChart({
  people,
  selected: selectedProp,
  defaultSelected = null,
  onSelectedChange,
  personHref,
  defaultDepth = 1,
  reportsShown = 6,
  title,
  description,
  actions,
  loading = false,
  headingLevel,
  messages,
  className,
}: OrgChartProps) {
  const m = useMemo(() => mergeMessages(ORG_CHART_MESSAGES, messages), [messages]);
  const model = useMemo(() => buildOrg(people), [people]);
  const items = useMemo(() => treeItems(model, m), [model, m]);
  const [selectedState, setSelectedState] = useState<string | null>(defaultSelected);
  const selected = selectedProp === undefined ? selectedState : selectedProp;
  const [expanded, setExpanded] = useState<string[]>(() => openToDepth(model, defaultDepth));
  const [query, setQuery] = useState('');
  const [reveal, setReveal] = useState(0);
  const [announcement, setAnnouncement] = useState('');
  const treeBox = useRef<HTMLDivElement>(null);
  const resultsId = useId();
  const results = useMemo(() => searchOrg(model, query), [model, query]);
  const person = selected === null ? undefined : model.byId.get(selected);

  const select = (id: string | null) => {
    if (selectedProp === undefined) setSelectedState(id);
    onSelectedChange?.(id);
  };

  /** Opens every branch down to a person, picks them and moves the focus to their row. */
  const revealPerson = (id: string) => {
    const chain = managerChain(model, id);
    setExpanded((open) => [...new Set([...open, ...chain])]);
    select(id);
    setReveal((count) => count + 1);
  };

  // After a reveal has drawn the opened branches, the picked row takes the focus and scrolls in.
  useEffect(() => {
    if (reveal === 0) return;
    const row = treeBox.current?.querySelector<HTMLElement>(
      '[role="treeitem"][aria-selected="true"]',
    );
    const wide = treeBox.current?.closest<HTMLElement>('[data-slot="org-chart-wide"]');
    // On a phone the tree is not shown: the list follows the pick instead.
    if (row == null || wide == null || getComputedStyle(wide).display === 'none') return;
    row.focus();
    row.scrollIntoView({ block: 'nearest' });
  }, [reveal]);

  const search = (
    <div className="flex flex-col gap-2">
      <SearchInput
        aria-label={m.search}
        placeholder={m.search}
        value={query}
        onValueChange={setQuery}
        aria-controls={query.trim() === '' ? undefined : resultsId}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'ArrowDown') {
            const first = document.getElementById(resultsId)?.querySelector('button');
            if (first !== null && first !== undefined) {
              event.preventDefault();
              first.focus();
            }
          }
        }}
      />
      <p aria-live="polite" className="sr-only">
        {query.trim() === '' ? announcement : m.results(results.length)}
      </p>
      {query.trim() !== '' && (
        <div id={resultsId} data-slot="org-results">
          {results.length === 0 ? (
            <p className="px-1 py-2 text-sm text-fg-muted">{m.noResults(query.trim())}</p>
          ) : (
            <ul className="flex flex-col gap-px rounded-panel border border-line bg-surface p-1 shadow-panel">
              {results.map((match) => (
                <li key={match.id}>
                  <button
                    type="button"
                    onClick={() => {
                      revealPerson(match.id);
                      setQuery('');
                    }}
                    onKeyDown={(event) => {
                      const to =
                        event.key === 'ArrowDown'
                          ? event.currentTarget.parentElement?.nextElementSibling
                          : event.key === 'ArrowUp'
                            ? event.currentTarget.parentElement?.previousElementSibling
                            : null;
                      const next = to?.querySelector('button');
                      if (next !== null && next !== undefined) {
                        event.preventDefault();
                        next.focus();
                      }
                    }}
                    className={cn(
                      'flex w-full min-h-(--rx-control-height-md) cursor-pointer items-center gap-3 rounded-control px-2 py-1.5 text-start',
                      'pointer-coarse:min-h-(--rx-control-height-touch)',
                      'hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
                    )}
                  >
                    <PersonAvatar name={match.name} src={match.avatar} size="sm" />
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium">{match.name}</span>{' '}
                      <span className="truncate text-xs text-fg-muted">
                        {m.resultDetail(match.title, match.department)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );

  return (
    <BlockPanel
      title={title ?? m.title}
      description={description ?? (loading ? undefined : m.summary(model.byId.size))}
      actions={actions}
      headingLevel={headingLevel ?? 2}
      className={className}
      bodyClassName="gap-4"
    >
      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((index) => (
            <SkeletonListItem key={index} />
          ))}
        </div>
      ) : model.byId.size === 0 ? (
        <EmptyNote title={m.emptyTitle} icon={TreeStructureIcon}>
          {m.emptyNote}
        </EmptyNote>
      ) : (
        <>
          {search}
          <div data-slot="org-chart-wide" className="hidden gap-5 @2xl:grid @2xl:grid-cols-5">
            <div ref={treeBox} className="@2xl:col-span-3">
              <Tree<OrgPerson>
                aria-label={m.tree}
                items={items}
                expanded={expanded}
                onExpandedChange={setExpanded}
                selectionMode="single"
                selected={selected === null ? [] : [selected]}
                onSelectedChange={(ids) => {
                  select(ids[0] ?? null);
                }}
                className="max-h-112 rounded-panel border border-line"
              />
            </div>
            <div className="@2xl:col-span-2">
              {person === undefined ? (
                <p className="rounded-panel border border-dashed border-line px-4 py-6 text-sm text-fg-muted">
                  {m.pickHint}
                </p>
              ) : (
                <PersonPanel
                  key={person.id}
                  person={person}
                  model={model}
                  messages={m}
                  personHref={personHref}
                  reportsShown={reportsShown}
                  onPick={revealPerson}
                />
              )}
            </div>
          </div>
          <DrillList
            model={model}
            current={person}
            messages={m}
            personHref={personHref}
            onPick={(id) => {
              select(id);
              const name = id === null ? m.topLevel : (model.byId.get(id)?.name ?? '');
              setAnnouncement(m.showingTeam(name));
            }}
          />
        </>
      )}
    </BlockPanel>
  );
}

/** The ids open to a depth: 1 opens the roots, 2 also opens their reports. */
function openToDepth(model: OrgModel, depth: number): string[] {
  const open: string[] = [];
  let level: readonly OrgPerson[] = model.roots;
  for (let step = 0; step < depth; step += 1) {
    const next: OrgPerson[] = [];
    for (const person of level) {
      const reports = model.reports.get(person.id);
      if (reports === undefined) continue;
      open.push(person.id);
      next.push(...reports);
    }
    level = next;
  }
  return open;
}

/** The tree's nodes, built once per org: avatar, name, title and team size on every row. */
function treeItems(model: OrgModel, m: OrgChartMessages): TreeNode<OrgPerson>[] {
  const node = (person: OrgPerson): TreeNode<OrgPerson> => {
    const reports = model.reports.get(person.id);
    const size = model.teamSize.get(person.id) ?? 0;
    return {
      id: person.id,
      data: person,
      textValue: person.name,
      icon: <PersonAvatar name={person.name} src={person.avatar} size="sm" />,
      label: (
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate">{person.name}</span>
          {person.title !== undefined && (
            <>
              <span className="sr-only">,</span>{' '}
              <span className="truncate text-xs font-normal text-fg-muted">{person.title}</span>
            </>
          )}
        </span>
      ),
      ...(size > 0
        ? {
            meta: (
              <>
                <span aria-hidden>{size}</span>
                <span className="sr-only">, {m.team(size)}</span>
              </>
            ),
          }
        : {}),
      ...(reports === undefined ? {} : { children: reports.map(node) }),
    };
  };
  return model.roots.map(node);
}

/** The picked person: who they are, who they report to and who reports to them. */
function PersonPanel({
  person,
  model,
  messages: m,
  personHref,
  reportsShown,
  onPick,
}: {
  person: OrgPerson;
  model: OrgModel;
  messages: OrgChartMessages;
  personHref: ((person: OrgPerson) => string) | undefined;
  reportsShown: number;
  onPick: (id: string) => void;
}) {
  const managerId = model.parent.get(person.id) ?? null;
  const manager = managerId === null ? undefined : model.byId.get(managerId);
  const reports = model.reports.get(person.id) ?? [];
  const size = model.teamSize.get(person.id) ?? 0;
  const [all, setAll] = useState(false);
  const listed = all ? reports : reports.slice(0, reportsShown);
  return (
    <section
      aria-label={person.name}
      data-slot="org-person"
      className="flex flex-col gap-4 rounded-panel border border-line bg-surface-raised p-4"
    >
      <div className="flex items-start gap-3">
        <PersonAvatar name={person.name} src={person.avatar} size="lg" />
        <div className="flex min-w-0 flex-col">
          <h3 className="font-display text-lg font-heading tracking-tight">{person.name}</h3>
          {person.title !== undefined && <p className="text-sm text-fg-muted">{person.title}</p>}
          {(person.department !== undefined || person.location !== undefined) && (
            <p className="text-sm text-fg-subtle">
              {[person.department, person.location].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>
      {(personHref !== undefined || person.email !== undefined) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {personHref !== undefined && (
            <Anchor
              href={personHref(person)}
              className={cn('relative inline-flex items-center gap-1.5', touchHitArea)}
            >
              <UserIcon aria-hidden weight="bold" className="size-3.5" />
              {m.viewProfile}
            </Anchor>
          )}
          {person.email !== undefined && (
            <Anchor
              href={`mailto:${person.email}`}
              className={cn('relative inline-flex items-center gap-1.5', touchHitArea)}
            >
              <EnvelopeSimpleIcon aria-hidden weight="bold" className="size-3.5" />
              {person.email}
            </Anchor>
          )}
        </div>
      )}
      <dl className="grid grid-cols-1 gap-3 border-t border-line pt-4 text-sm">
        <div className="flex flex-col gap-1">
          <dt className="text-xs text-fg-muted">{m.reportsTo}</dt>
          <dd>
            {manager === undefined ? (
              <span className="text-fg-muted">{m.topOfOrg}</span>
            ) : (
              <PersonButton person={manager} onPick={onPick} />
            )}
          </dd>
        </div>
        {reports.length > 0 && (
          <div className="flex flex-col gap-1">
            <dt className="text-xs text-fg-muted">
              {m.directReports(reports.length)}
              {size > reports.length && <>, {m.teamSize(size)}</>}
            </dt>
            <dd>
              <ul className="flex flex-col">
                {listed.map((report) => (
                  <li key={report.id}>
                    <PersonButton person={report} onPick={onPick} />
                  </li>
                ))}
              </ul>
              {reports.length > listed.length && (
                <button
                  type="button"
                  onClick={() => {
                    setAll(true);
                  }}
                  className={cn(
                    '-mx-2 mt-1 flex min-h-(--rx-control-height-sm) cursor-pointer items-center rounded-control px-2 text-sm font-medium text-accent-strong',
                    'pointer-coarse:min-h-(--rx-control-height-touch) hover:bg-surface-hover',
                    'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-solid focus-visible:outline-focus',
                  )}
                >
                  {m.moreReports(reports.length - listed.length)}
                </button>
              )}
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}

function PersonButton({ person, onPick }: { person: OrgPerson; onPick: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => {
        onPick(person.id);
      }}
      className={cn(
        '-mx-2 flex w-full min-h-(--rx-control-height-md) cursor-pointer items-center gap-2.5 rounded-control px-2 py-1 text-start',
        'pointer-coarse:min-h-(--rx-control-height-touch)',
        'hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
      )}
    >
      <PersonAvatar name={person.name} src={person.avatar} size="sm" />
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{person.name}</span>{' '}
        {person.title !== undefined && (
          <span className="truncate text-xs text-fg-muted">{person.title}</span>
        )}
      </span>
    </button>
  );
}

/**
 * The phone layout: one person at a time with their team listed under them. A row with a team
 * steps into it; the button at the top steps back up to the manager.
 */
function DrillList({
  model,
  current,
  messages: m,
  personHref,
  onPick,
}: {
  model: OrgModel;
  current: OrgPerson | undefined;
  messages: OrgChartMessages;
  personHref: ((person: OrgPerson) => string) | undefined;
  onPick: (id: string | null) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const managerId = current === undefined ? null : (model.parent.get(current.id) ?? null);
  const manager = managerId === null ? undefined : model.byId.get(managerId);
  const list = current === undefined ? model.roots : (model.reports.get(current.id) ?? []);
  const headingId = useId();
  const pick = (id: string | null) => {
    onPick(id);
    // The list redraws for the new person; the focus goes to its heading, where reading starts.
    requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLElement>('[data-drill-focus]')?.focus();
    });
  };
  return (
    <div ref={listRef} data-slot="org-chart-list" className="flex flex-col gap-3 @2xl:hidden">
      {current !== undefined && (
        <>
          <button
            type="button"
            onClick={() => {
              pick(managerId);
            }}
            className={cn(
              'inline-flex w-fit min-h-(--rx-control-height-touch) cursor-pointer items-center gap-2 rounded-control px-2 text-sm font-medium text-accent-strong',
              'hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus',
            )}
          >
            <ArrowUpIcon aria-hidden weight="bold" className="size-4" />
            {manager === undefined ? m.upToTop : m.upTo(manager.name)}
          </button>
          <div className="flex items-start gap-3 rounded-panel border border-line bg-surface-raised p-3">
            <PersonAvatar name={current.name} src={current.avatar} size="lg" />
            <div className="flex min-w-0 flex-col">
              <h3
                tabIndex={-1}
                data-drill-focus
                className="font-display text-base font-heading tracking-tight outline-none"
              >
                {current.name}
              </h3>
              {current.title !== undefined && (
                <p className="text-sm text-fg-muted">{current.title}</p>
              )}
              {personHref !== undefined && (
                <Anchor
                  href={personHref(current)}
                  className={cn('relative mt-1 w-fit text-sm', touchHitArea)}
                >
                  {m.viewProfile}
                </Anchor>
              )}
            </div>
          </div>
        </>
      )}
      {list.length > 0 && (
        <section aria-labelledby={headingId} className="flex flex-col gap-1">
          <h3
            id={headingId}
            tabIndex={current === undefined ? -1 : undefined}
            {...(current === undefined ? { 'data-drill-focus': true } : {})}
            className="px-1 text-xs font-medium text-fg-muted outline-none"
          >
            {current === undefined ? m.topLevel : m.directReports(list.length)}
          </h3>
          <ul className="flex flex-col divide-y divide-line rounded-panel border border-line">
            {list.map((person) => {
              const size = model.teamSize.get(person.id) ?? 0;
              return (
                <li key={person.id}>
                  <button
                    type="button"
                    aria-label={size > 0 ? m.openTeam(person.name, size) : undefined}
                    onClick={() => {
                      pick(person.id);
                    }}
                    className={cn(
                      'flex w-full min-h-(--rx-control-height-touch) cursor-pointer items-center gap-3 px-3 py-2 text-start',
                      'hover:bg-surface-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
                    )}
                  >
                    <PersonAvatar name={person.name} src={person.avatar} size="md" />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{person.name}</span>{' '}
                      {person.title !== undefined && (
                        <span className="truncate text-xs text-fg-muted">{person.title}</span>
                      )}
                    </span>
                    {size > 0 && (
                      <span className="flex shrink-0 items-center gap-1 text-xs text-fg-muted numeric">
                        {size}
                        <CaretRightIcon
                          aria-hidden
                          weight="bold"
                          className="size-3.5 rtl:-scale-x-100"
                        />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
