import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowsOutCardinalIcon,
  CalendarBlankIcon,
  CheckCircleIcon,
  FlagIcon,
  KanbanIcon,
  PlusIcon,
  WarningIcon,
} from '@phosphor-icons/react';
import { Badge, cn } from '@rectio/ui';
import {
  memo,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { EmptyNote } from '../../lib/empty-note';
import { formatShortDate, resolveLocale } from '../../lib/finance';
import { ActionMenu, type MenuAction } from '../lib/action-menu';
import { Avatar } from '../lib/avatar';
import { isoDateTime, plural } from '../lib/saas';
import { useSaasParts } from '../lib/saas-parts';
import { useNow } from '../lib/focus';
import { focusRing } from '../lib/styles';
import {
  kanbanColumnCards,
  kanbanDueState,
  kanbanOverLimit,
  kanbanPositionOf,
  kanbanStep,
  type KanbanCard,
  type KanbanColumn,
  type KanbanDirection,
  type KanbanPosition,
} from './kanban-board.logic';

export interface KanbanBoardProps {
  columns: readonly KanbanColumn[];
  /** Every card, in board order: a column shows its cards in the order they appear here. */
  cards: readonly KanbanCard[];
  /**
   * Moves a card: by its Move menu, by Alt and an arrow key, or by dragging. `index` is its place
   * among the target column's other cards. Apply it (see `moveKanbanCard`) and pass the new cards.
   */
  onMoveCard?: (cardId: string, toColumnId: string, index: number) => void;
  /** Opens a card; its title becomes a button when given. */
  onOpenCard?: (card: KanbanCard) => void;
  /** Shows an Add card button under each column. */
  onAddCard?: (columnId: string) => void;
  /** The day due dates are measured from. */
  today?: Date;
  locale?: string;
  title?: string;
  description?: string;
  className?: string;
}

/** What a card can ask of the board; the board hands every card the same stable object. */
interface CardHandlers {
  dragStart: (card: KanbanCard, event: DragEvent) => void;
  dragEnd: () => void;
  keyDown: (event: KeyboardEvent, card: KanbanCard) => void;
  moveTo: (card: KanbanCard, columnId: string) => void;
  step: (card: KanbanCard, direction: KanbanDirection) => void;
}

// A one-line note for each ghost column of an empty board, by the part it plays.
function ghostHint(column: KanbanColumn, index: number): string {
  if (column.done === true) return 'Finished work collects here';
  if (index === 1) return 'Cards land here when work starts';
  return 'Cards arrive here as work moves along';
}

const KEYS: Record<string, KanbanDirection> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
};

/**
 * Work in columns: each card shows its reference, title, tags, due date and assignee; each column
 * its count against an optional work-in-progress limit. Every move a pointer can make, a keyboard
 * can too: Alt and an arrow key, or the card's Move menu; each move is read out. The board holds
 * no cards itself: moves go to `onMoveCard`.
 */
export function KanbanBoard({
  columns,
  cards,
  onMoveCard,
  onOpenCard,
  onAddCard,
  today: requestedToday,
  locale: requestedLocale,
  title = 'Board',
  description,
  className,
}: KanbanBoardProps) {
  const locale = resolveLocale(requestedLocale);
  const today = useNow(requestedToday);
  const { Button } = useBlockParts();
  const { Items, Item } = useSaasParts();
  const hintId = useId();
  const board = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState('');
  // A card moved by keyboard keeps the focus once the app has put it in its new place.
  const pending = useRef<({ cardId: string } & KanbanPosition) | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropColumn, setDropColumn] = useState<string | null>(null);
  // Narrow widths show one column at a time, picked from the switcher; this is the one shown.
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const target = pending.current;
    if (target === null) return;
    const now = kanbanPositionOf(cards, target.cardId);
    // One chance only: if the app did not apply the move as asked, focus is left where it is.
    pending.current = null;
    if (now?.columnId !== target.columnId || now.index !== target.index) return;
    board.current
      ?.querySelector<HTMLElement>(`[data-kanban-card="${CSS.escape(target.cardId)}"]`)
      ?.focus();
  }, [cards]);

  // A trailing zero-width space flips on each call, so the same words are read out again.
  const announce = (text: string) => {
    setAnnouncement((was) => (was.endsWith('\u200B') ? text : `${text}\u200B`));
  };

  const columnTitle = (id: string) => columns.find((column) => column.id === id)?.title ?? id;

  const move = (card: KanbanCard, to: KanbanPosition, keepFocus: boolean) => {
    if (onMoveCard === undefined) return;
    onMoveCard(card.id, to.columnId, to.index);
    const size = kanbanColumnCards(cards, to.columnId).filter((c) => c.id !== card.id).length + 1;
    announce(
      `${card.title} moved to ${columnTitle(to.columnId)}, position ${String(to.index + 1)} of ${String(size)}.`,
    );
    if (keepFocus) {
      pending.current = { cardId: card.id, ...to };
      // Narrow: follow the card to its new column, so focus has somewhere to land.
      const index = columns.findIndex((column) => column.id === to.columnId);
      if (index !== -1) setShown(index);
    }
  };

  const onCardKeyDown = (event: KeyboardEvent, card: KanbanCard) => {
    const direction = KEYS[event.key];
    if (!event.altKey || direction === undefined || onMoveCard === undefined) return;
    event.preventDefault();
    const to = kanbanStep(cards, columns, card.id, direction);
    if (to === null) {
      announce(`${card.title} cannot move further ${direction}.`);
      return;
    }
    move(card, to, true);
  };

  // One pass over the cards per change: each column's cards in order, and each card's place in
  // its column. Columns, counts and menus all read from here.
  const layout = useMemo(() => {
    const byColumn = new Map<string, KanbanCard[]>();
    const places = new Map<string, number>();
    for (const card of cards) {
      const list = byColumn.get(card.columnId) ?? [];
      places.set(card.id, list.length);
      list.push(card);
      byColumn.set(card.columnId, list);
    }
    return { byColumn, places };
  }, [cards]);
  const cardsIn = (columnId: string): readonly KanbanCard[] => layout.byColumn.get(columnId) ?? [];

  // Cards are memoised, so they get one handler object that never changes; it calls through to
  // this render's functions, which a layout effect keeps current.
  const latest = useRef<CardHandlers | null>(null);
  useLayoutEffect(() => {
    latest.current = {
      dragStart: (card, event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', card.id);
        setDragging(card.id);
      },
      dragEnd: () => {
        setDragging(null);
        setDropColumn(null);
      },
      keyDown: onCardKeyDown,
      moveTo: (card, columnId) => {
        move(card, { columnId, index: cardsIn(columnId).length }, true);
      },
      step: (card, direction) => {
        const to = kanbanStep(cards, columns, card.id, direction);
        if (to !== null) move(card, to, true);
      },
    };
  });
  const handlers = useMemo<CardHandlers>(
    () => ({
      dragStart: (card, event) => latest.current?.dragStart(card, event),
      dragEnd: () => latest.current?.dragEnd(),
      keyDown: (event, card) => latest.current?.keyDown(event, card),
      moveTo: (card, columnId) => latest.current?.moveTo(card, columnId),
      step: (card, direction) => latest.current?.step(card, direction),
    }),
    [],
  );

  const onDrop = (event: DragEvent, columnId: string) => {
    event.preventDefault();
    setDropColumn(null);
    const card = cards.find((c) => c.id === dragging);
    setDragging(null);
    if (card === undefined) return;
    const others = kanbanColumnCards(cards, columnId).filter((c) => c.id !== card.id);
    const over = (event.target as HTMLElement).closest<HTMLElement>('[data-kanban-card]');
    const overIndex = others.findIndex((c) => c.id === over?.dataset.kanbanCard);
    move(card, { columnId, index: overIndex === -1 ? others.length : overIndex }, false);
  };

  return (
    <BlockPanel
      title={title}
      description={
        description ?? `${plural(cards.length, 'card')} in ${plural(columns.length, 'column')}`
      }
      className={className}
      bodyClassName="gap-3"
    >
      {columns.length === 0 ? (
        <EmptyNote
          title={
            <span className="flex flex-col items-center gap-3">
              <KanbanIcon aria-hidden weight="duotone" className="size-8 text-fg-subtle" />
              Set up your stages
            </span>
          }
        >
          Add columns for the stages work moves through, such as To do, Doing and Done.
        </EmptyNote>
      ) : (
        <>
          {/* Narrow: every column as an equal button in two columns, so no name is ever cut off;
              three or five columns simply wrap to another row. */}
          <div role="group" aria-label="Columns" className="grid grid-cols-2 gap-1 @xl:hidden">
            {columns.map((column, index) => (
              <button
                key={column.id}
                type="button"
                aria-current={shown === index ? 'true' : undefined}
                data-current={shown === index || undefined}
                onClick={() => {
                  setShown(index);
                }}
                className={cn(
                  'flex h-(--rx-control-height-sm) min-w-0 cursor-pointer items-center justify-between gap-1.5 rounded-control border border-line px-3 text-sm text-fg-muted pointer-coarse:h-(--rx-control-height-touch)',
                  'data-current:border-line-strong data-current:bg-surface-sunken data-current:font-medium data-current:text-fg',
                  focusRing,
                )}
              >
                <span className="truncate" title={column.title}>
                  {column.title}
                </span>
                <span className="shrink-0 text-fg-subtle numeric">{cardsIn(column.id).length}</span>
              </button>
            ))}
          </div>
          {onMoveCard !== undefined && (
            <p
              id={hintId}
              className="flex items-center gap-1.5 text-sm text-fg-subtle pointer-coarse:hidden"
            >
              <ArrowsOutCardinalIcon aria-hidden weight="bold" className="size-4" />
              Drag a card, or focus it and press Alt with an arrow key to move it.
            </p>
          )}
          <div
            ref={board}
            className="flex items-start gap-3 @xl:-mx-5 @xl:overflow-x-auto @xl:px-5 @xl:pb-2 @4xl:items-stretch"
          >
            {columns.map((column, columnIndex) => {
              // Narrow: only the chosen column is laid out, so the board is as tall as it is.
              const columnCards = cardsIn(column.id);
              const over = kanbanOverLimit(column, columnCards.length);
              const headingId = `${hintId}-${column.id}`;
              return (
                <section
                  key={column.id}
                  aria-labelledby={headingId}
                  data-drop={dropColumn === column.id || undefined}
                  onDragOver={(event) => {
                    if (dragging === null) return;
                    event.preventDefault();
                    setDropColumn(column.id);
                  }}
                  onDragLeave={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                      setDropColumn(null);
                    }
                  }}
                  onDrop={(event) => {
                    onDrop(event, column.id);
                  }}
                  className={cn(
                    'flex w-full shrink-0 flex-col gap-2 rounded-control border border-line bg-surface-sunken p-2 @xl:w-72 @4xl:w-auto @4xl:min-w-52 @4xl:flex-1',
                    'transition-[border-color,background-color] duration-fast ease-standard',
                    'data-drop:border-accent data-drop:bg-accent-subtle',
                    over && 'border-warning-strong/40',
                    cards.length === 0 && 'min-h-48 border-dashed bg-transparent',
                    columnIndex !== shown && '@max-xl:hidden',
                  )}
                >
                  <header className="flex items-center justify-between gap-2 px-1.5 pt-1">
                    <h3 id={headingId} className="truncate text-sm font-medium">
                      {column.title}
                    </h3>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-sm text-fg-muted numeric',
                        over && 'font-medium text-warning-strong',
                      )}
                    >
                      {over && <WarningIcon aria-hidden weight="bold" className="size-3.5" />}
                      {columnCards.length}
                      {column.limit !== undefined && (
                        <span className={cn('font-regular', !over && 'text-fg-subtle')}>
                          {' '}
                          / {column.limit} limit
                        </span>
                      )}
                      {over && <span className="sr-only">, over the limit</span>}
                    </span>
                  </header>
                  {over && (
                    <p className="px-1.5 text-sm text-warning-strong">
                      Over the limit of {column.limit}. Finish something before starting more.
                    </p>
                  )}
                  <ol aria-labelledby={headingId} className="flex min-h-16 flex-col gap-2">
                    <Items>
                      {columnCards.map((card) => (
                        <Item key={card.id} className={cn(dragging === card.id && 'opacity-50')}>
                          <CardView
                            card={card}
                            done={column.done === true}
                            today={today}
                            locale={locale}
                            hintId={onMoveCard === undefined ? undefined : hintId}
                            movable={onMoveCard !== undefined}
                            columns={columns}
                            place={layout.places.get(card.id) ?? 0}
                            size={columnCards.length}
                            handlers={handlers}
                            onOpen={onOpenCard}
                          />
                        </Item>
                      ))}
                    </Items>
                    {columnCards.length === 0 && cards.length > 0 && (
                      <li className="flex min-h-16 items-center justify-center rounded-control border border-dashed border-line-strong px-3 text-center text-sm text-fg-subtle">
                        No cards
                      </li>
                    )}
                    {/* An empty board: ghost columns, each saying what it is for, with the one
                        way in placed in the first. */}
                    {cards.length === 0 && columnIndex > 0 && (
                      <li className="px-1.5 text-sm text-fg-subtle">
                        {ghostHint(column, columnIndex)}
                      </li>
                    )}
                    {cards.length === 0 && column.id === columns[0]?.id && (
                      <li className="flex flex-col items-center gap-2 rounded-control border border-dashed border-line-strong bg-surface px-3 py-6 text-center text-sm">
                        <KanbanIcon
                          aria-hidden
                          weight="duotone"
                          className="size-7 text-fg-subtle"
                        />
                        <span className="font-medium text-fg">The board is clear</span>
                        <span className="text-fg-muted">
                          Add the first card here and move it along as work gets done.
                        </span>
                        {onAddCard !== undefined && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="mt-1"
                            onClick={() => {
                              onAddCard(column.id);
                            }}
                          >
                            <PlusIcon aria-hidden weight="bold" className="size-3.5" />
                            Add a card
                          </Button>
                        )}
                      </li>
                    )}
                  </ol>
                  {onAddCard !== undefined && cards.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-fg-muted"
                      aria-label={`Add card, ${column.title}`}
                      onClick={() => {
                        onAddCard(column.id);
                      }}
                    >
                      <PlusIcon aria-hidden weight="bold" className="size-3.5" />
                      Add card
                    </Button>
                  )}
                </section>
              );
            })}
          </div>
        </>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </BlockPanel>
  );
}

const DUE_WORDS = { overdue: 'Overdue', today: 'Today' } as const;

// Memoised: a drag, a drop target or an announcement re-renders the board, not every card.
const CardView = memo(function CardView({
  card,
  done,
  today,
  locale,
  hintId,
  movable,
  columns,
  place,
  size,
  handlers,
  onOpen,
}: {
  card: KanbanCard;
  done: boolean;
  today: Date;
  locale: string;
  hintId: string | undefined;
  movable: boolean;
  columns: readonly KanbanColumn[];
  /** The card's place in its column, and how many cards the column holds. */
  place: number;
  size: number;
  handlers: CardHandlers;
  onOpen: ((card: KanbanCard) => void) | undefined;
}) {
  const draggable = movable;
  const onKeyDown = (event: KeyboardEvent) => {
    handlers.keyDown(event, card);
  };
  const actions: MenuAction[] = movable
    ? [
        ...columns
          .filter((column) => column.id !== card.columnId)
          .map((column) => ({
            id: `to-${column.id}`,
            label: `Move to ${column.title}`,
            icon: ArrowRightIcon,
            onSelect: () => {
              handlers.moveTo(card, column.id);
            },
          })),
        {
          id: 'up',
          label: 'Move up',
          icon: ArrowUpIcon,
          disabled: place === 0,
          onSelect: () => {
            handlers.step(card, 'up');
          },
        },
        {
          id: 'down',
          label: 'Move down',
          icon: ArrowDownIcon,
          disabled: place >= size - 1,
          onSelect: () => {
            handlers.step(card, 'down');
          },
        },
      ]
    : [];
  // Fine pointers reveal the menu on hover or focus; touch keeps it in view.
  const moveMenu: ReactNode = movable ? (
    <span
      className={cn(
        'flex transition-opacity duration-fast ease-standard',
        'pointer-fine:opacity-0 pointer-fine:group-focus-within/card:opacity-100 pointer-fine:group-hover/card:opacity-100 pointer-fine:has-data-popup-open:opacity-100',
      )}
    >
      <ActionMenu label={`Move ${card.title}`} actions={actions} />
    </span>
  ) : null;
  const due = card.due === undefined ? null : kanbanDueState(card.due, today);
  const urgent = card.priority === 'urgent' || card.priority === 'high';
  const hasMeta = due !== null || urgent || card.assignee !== undefined;
  const metaId = useId();
  // The card's one focus stop: its title button when it opens, else the card itself.
  const target = {
    'data-kanban-card': card.id,
    // The meta row is read after the title, so the card is not just its name.
    'aria-describedby': [hasMeta ? metaId : null, hintId].filter(Boolean).join(' ') || undefined,
    onKeyDown,
  };
  return (
    <article
      draggable={draggable}
      onDragStart={(event) => {
        handlers.dragStart(card, event);
      }}
      onDragEnd={handlers.dragEnd}
      {...(onOpen === undefined ? { ...target, tabIndex: 0, 'aria-label': card.title } : {})}
      className={cn(
        'group/card relative flex flex-col gap-2 rounded-control border border-line bg-surface-raised p-3 shadow-raised',
        'has-focus-visible:border-line-strong',
        onOpen === undefined && focusRing,
        draggable && 'cursor-grab active:cursor-grabbing',
      )}
    >
      <div className={cn('flex min-w-0 flex-col gap-0.5', !hasMeta && moveMenu !== null && 'pe-8')}>
        {(card.reference !== undefined || done) && (
          <span className="inline-flex items-center gap-1 text-xs text-fg-muted numeric">
            {done && (
              <>
                <CheckCircleIcon
                  aria-hidden
                  weight="fill"
                  className="size-3.5 text-positive-strong"
                />
                <span className="sr-only">Done. </span>
              </>
            )}
            {card.reference}
          </span>
        )}
        {onOpen === undefined ? (
          <span className={cn('font-medium', done && 'text-fg-muted')}>{card.title}</span>
        ) : (
          <button
            type="button"
            {...target}
            onClick={() => {
              onOpen(card);
            }}
            className={cn(
              'block w-full cursor-pointer rounded-badge text-start font-medium',
              done && 'text-fg-muted',
              'hover:underline hover:decoration-line-strong hover:underline-offset-4',
              focusRing,
            )}
          >
            {card.title}
          </button>
        )}
      </div>
      {(card.tags?.length ?? 0) > 0 && (
        <ul aria-label="Tags" className="flex flex-wrap gap-1">
          {card.tags?.map((tag) => (
            <li key={tag}>
              <Badge>{tag}</Badge>
            </li>
          ))}
        </ul>
      )}
      {hasMeta ? (
        // The footer wraps as a whole: dates and flags on the left, people and the menu on the right.
        <div
          id={metaId}
          className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-fg-muted"
        >
          {card.due !== undefined && due !== null && (
            <span
              className={cn(
                'inline-flex items-center gap-1 whitespace-nowrap',
                due === 'overdue' && 'font-medium text-negative-strong',
                due === 'today' && 'font-medium text-warning-strong',
              )}
            >
              <CalendarBlankIcon aria-hidden weight="bold" className="size-3.5" />
              {/* Overdue and today say so in a word, short enough to share the row; the date stays on the time. */}
              <time
                dateTime={isoDateTime(card.due)}
                title={formatShortDate(card.due, locale)}
                className="numeric"
              >
                {due === 'overdue' || due === 'today' ? (
                  <>
                    {DUE_WORDS[due]}
                    <span className="sr-only">, {formatShortDate(card.due, locale)}</span>
                  </>
                ) : (
                  <>
                    <span className="sr-only">Due </span>
                    {formatShortDate(card.due, locale)}
                  </>
                )}
              </time>
            </span>
          )}
          {urgent && (
            <span
              className={cn(
                'inline-flex items-center gap-1 whitespace-nowrap',
                // One alarm per card: an overdue date already says it in red.
                card.priority === 'urgent' &&
                  due !== 'overdue' &&
                  'font-medium text-negative-strong',
              )}
            >
              <FlagIcon aria-hidden weight="fill" className="size-3.5" />
              {card.priority === 'urgent' ? 'Urgent' : 'High'}
            </span>
          )}
          <span className="-me-1.5 ms-auto flex shrink-0 items-center gap-1">
            {card.assignee !== undefined && (
              <span className="flex items-center" title={card.assignee.name}>
                <Avatar
                  name={card.assignee.name}
                  src={card.assignee.avatarUrl}
                  size="sm"
                  decorative={false}
                />
              </span>
            )}
            {moveMenu}
          </span>
        </div>
      ) : (
        moveMenu !== null && <span className="absolute end-1.5 top-1.5">{moveMenu}</span>
      )}
    </article>
  );
});
