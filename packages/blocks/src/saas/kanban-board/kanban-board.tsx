import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowsOutCardinalIcon,
  CalendarBlankIcon,
  FlagIcon,
  PlusIcon,
  WarningIcon,
} from '@phosphor-icons/react';
import { Badge, cn } from '@rectio/ui';
import {
  useEffect,
  useId,
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
import { plural } from '../lib/saas';
import { useSaasParts } from '../lib/saas-parts';
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
  today = new Date(),
  locale: requestedLocale,
  title = 'Board',
  description,
  className,
}: KanbanBoardProps) {
  const locale = resolveLocale(requestedLocale);
  const { Button } = useBlockParts();
  const { Items, Item } = useSaasParts();
  const hintId = useId();
  const board = useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = useState('');
  // A card moved by keyboard keeps the focus once the app has put it in its new place.
  const pending = useRef<({ cardId: string } & KanbanPosition) | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropColumn, setDropColumn] = useState<string | null>(null);

  useEffect(() => {
    const target = pending.current;
    if (target === null) return;
    const now = kanbanPositionOf(cards, target.cardId);
    if (now?.columnId !== target.columnId || now.index !== target.index) return;
    board.current
      ?.querySelector<HTMLElement>(`[data-kanban-card="${CSS.escape(target.cardId)}"]`)
      ?.focus();
    pending.current = null;
  }, [cards]);

  const columnTitle = (id: string) => columns.find((column) => column.id === id)?.title ?? id;

  const move = (card: KanbanCard, to: KanbanPosition, keepFocus: boolean) => {
    if (onMoveCard === undefined) return;
    onMoveCard(card.id, to.columnId, to.index);
    const size = kanbanColumnCards(cards, to.columnId).filter((c) => c.id !== card.id).length + 1;
    setAnnouncement(
      `${card.title} moved to ${columnTitle(to.columnId)}, position ${String(to.index + 1)} of ${String(size)}.`,
    );
    if (keepFocus) pending.current = { cardId: card.id, ...to };
  };

  const onCardKeyDown = (event: KeyboardEvent, card: KanbanCard) => {
    const direction = KEYS[event.key];
    if (!event.altKey || direction === undefined || onMoveCard === undefined) return;
    event.preventDefault();
    const to = kanbanStep(cards, columns, card.id, direction);
    if (to === null) {
      setAnnouncement(`${card.title} cannot move further ${direction}.`);
      return;
    }
    move(card, to, true);
  };

  const moveActions = (card: KanbanCard): MenuAction[] => {
    const step = (direction: KanbanDirection) => kanbanStep(cards, columns, card.id, direction);
    const up = step('up');
    const down = step('down');
    return [
      ...columns
        .filter((column) => column.id !== card.columnId)
        .map((column) => ({
          id: `to-${column.id}`,
          label: `Move to ${column.title}`,
          icon: ArrowRightIcon,
          onSelect: () => {
            move(
              card,
              { columnId: column.id, index: kanbanColumnCards(cards, column.id).length },
              true,
            );
          },
        })),
      {
        id: 'up',
        label: 'Move up',
        icon: ArrowUpIcon,
        disabled: up === null,
        onSelect: () => {
          if (up !== null) move(card, up, true);
        },
      },
      {
        id: 'down',
        label: 'Move down',
        icon: ArrowDownIcon,
        disabled: down === null,
        onSelect: () => {
          if (down !== null) move(card, down, true);
        },
      },
    ];
  };

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
        <EmptyNote title="No columns yet">
          Add columns for the stages your work moves through, such as To do, Doing and Done.
        </EmptyNote>
      ) : (
        <>
          {onMoveCard !== undefined && (
            <p id={hintId} className="flex items-center gap-1.5 text-sm text-fg-subtle">
              <ArrowsOutCardinalIcon aria-hidden weight="bold" className="size-4" />
              Drag a card, or focus it and press Alt with an arrow key to move it.
            </p>
          )}
          <div
            ref={board}
            className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2"
          >
            {columns.map((column) => {
              const columnCards = kanbanColumnCards(cards, column.id);
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
                    'flex w-72 shrink-0 snap-start flex-col gap-2 rounded-control border border-line bg-surface-sunken p-2 @4xl:w-auto @4xl:min-w-52 @4xl:flex-1',
                    'transition-[border-color,background-color] duration-fast ease-standard',
                    'data-drop:border-accent data-drop:bg-accent-subtle',
                    over && 'border-warning-strong/40',
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
                      {column.limit === undefined
                        ? columnCards.length
                        : `${String(columnCards.length)} of ${String(column.limit)}`}
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
                            today={today}
                            locale={locale}
                            hintId={onMoveCard === undefined ? undefined : hintId}
                            draggable={onMoveCard !== undefined}
                            onDragStart={(event) => {
                              event.dataTransfer.effectAllowed = 'move';
                              event.dataTransfer.setData('text/plain', card.id);
                              setDragging(card.id);
                            }}
                            onDragEnd={() => {
                              setDragging(null);
                              setDropColumn(null);
                            }}
                            onKeyDown={(event) => {
                              onCardKeyDown(event, card);
                            }}
                            onOpen={onOpenCard}
                            moveMenu={
                              onMoveCard === undefined ? null : (
                                <ActionMenu
                                  label={`Move ${card.title}`}
                                  actions={moveActions(card)}
                                />
                              )
                            }
                          />
                        </Item>
                      ))}
                    </Items>
                    {columnCards.length === 0 && (
                      <li className="flex min-h-16 items-center justify-center rounded-control border border-dashed border-line-strong px-3 text-center text-sm text-fg-subtle">
                        Nothing here yet
                      </li>
                    )}
                  </ol>
                  {onAddCard !== undefined && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="justify-start text-fg-muted"
                      aria-label={`Add a card to ${column.title}`}
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

const DUE_WORDS = { overdue: 'Overdue', today: 'Due today', soon: 'Due', later: 'Due' } as const;

function CardView({
  card,
  today,
  locale,
  hintId,
  draggable,
  onDragStart,
  onDragEnd,
  onKeyDown,
  onOpen,
  moveMenu,
}: {
  card: KanbanCard;
  today: Date;
  locale: string;
  hintId: string | undefined;
  draggable: boolean;
  onDragStart: (event: DragEvent) => void;
  onDragEnd: () => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onOpen: ((card: KanbanCard) => void) | undefined;
  moveMenu: ReactNode;
}) {
  const due = card.due === undefined ? null : kanbanDueState(card.due, today);
  const urgent = card.priority === 'urgent' || card.priority === 'high';
  const focusProps = {
    'data-kanban-card': card.id,
    'aria-describedby': hintId,
    onKeyDown,
    className: cn(
      'block w-full cursor-pointer rounded-badge text-start font-medium text-pretty',
      'hover:underline hover:decoration-line-strong hover:underline-offset-4',
      focusRing,
    ),
  };
  return (
    <article
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'group/card flex flex-col gap-2 rounded-control border border-line bg-surface-raised p-3 shadow-raised',
        'has-focus-visible:border-line-strong',
        draggable && 'cursor-grab active:cursor-grabbing',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          {card.reference !== undefined && (
            <span className="text-xs text-fg-subtle numeric">{card.reference}</span>
          )}
          {onOpen === undefined ? (
            <div
              tabIndex={0}
              {...focusProps}
              className={cn(focusProps.className, 'cursor-default hover:no-underline')}
            >
              {card.title}
            </div>
          ) : (
            <button
              type="button"
              {...focusProps}
              onClick={() => {
                onOpen(card);
              }}
            >
              {card.title}
            </button>
          )}
        </div>
        <span className="-me-1 -mt-1 shrink-0">{moveMenu}</span>
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
      {(due !== null || card.assignee !== undefined || urgent) && (
        <div className="flex items-end justify-between gap-2 text-sm text-fg-muted">
          <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            {card.due !== undefined && due !== null && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 whitespace-nowrap',
                  due === 'overdue' && 'font-medium text-negative-strong',
                  due === 'today' && 'font-medium text-warning-strong',
                )}
              >
                <CalendarBlankIcon aria-hidden weight="bold" className="size-3.5" />
                <span className="sr-only">{DUE_WORDS[due]} </span>
                {due === 'overdue' || due === 'today' ? (
                  <span aria-hidden>{DUE_WORDS[due]}, </span>
                ) : null}
                <time dateTime={card.due.toISOString()} className="numeric">
                  {formatShortDate(card.due, locale)}
                </time>
              </span>
            )}
            {urgent && (
              <span
                className={cn(
                  'inline-flex items-center gap-1',
                  card.priority === 'urgent' && 'font-medium text-negative-strong',
                )}
              >
                <FlagIcon aria-hidden weight="fill" className="size-3.5" />
                {card.priority === 'urgent' ? 'Urgent' : 'High'}
              </span>
            )}
          </span>
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
        </div>
      )}
    </article>
  );
}
