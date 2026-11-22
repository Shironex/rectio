'use client';

import {
  PromptInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  cn,
  touchHitArea,
  type PromptInputProps,
} from '@rectio/ui';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react';

import { useAiParts } from '../lib/parts';
import { PROMPT_COMPOSER_MESSAGES, type PromptComposerMessages } from './prompt-composer-messages';
import {
  countTone,
  estimateTokens,
  insertCommand,
  matchCommands,
  slashQuery,
  type AiComposerCommand,
  type AiComposerModel,
} from './prompt-composer.logic';

export interface PromptComposerProps extends Omit<
  PromptInputProps,
  'meta' | 'submitDisabled' | 'textareaProps' | 'messages'
> {
  /** Slash commands: typing `/` at the start of a word lists the ones that match. */
  commands?: readonly AiComposerCommand[] | undefined;
  /** Called when the reader picks a command; its `/name` is already in the field. */
  onCommand?: ((command: AiComposerCommand) => void) | undefined;
  /** Models or modes to pick from, shown as a picker before the other tools. */
  models?: readonly AiComposerModel[] | undefined;
  /** The picked model's id, controlled. */
  model?: string | undefined;
  defaultModel?: string | undefined;
  onModelChange?: ((model: string) => void) | undefined;
  /** Controls after the model picker: a tools menu, a web search toggle. */
  tools?: ReactNode;
  /**
   * A running count beside Send: `tokens` (estimated, or from `countTokens`) or `characters`.
   * With a `limit`, Send waits while the text is over it and the count says by how much.
   */
  count?: 'tokens' | 'characters' | undefined;
  /** The most tokens or characters a message may have. */
  limit?: number | undefined;
  /** Your model's tokenizer; about four characters a token when omitted. */
  countTokens?: ((text: string) => number) | undefined;
  /** For the figures in the count. */
  locale?: string | undefined;
  messages?: Partial<PromptComposerMessages> | undefined;
}

/** Says a text after it has stayed the same for a moment, so a fast typist hears it once. */
function useSettled(text: string) {
  const [settled, setSettled] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSettled(text);
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, [text]);
  return settled;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref !== null && ref !== undefined) ref.current = value;
}

/**
 * A richer field for talking to an assistant, built on the prompt input: a model or mode picker,
 * attachments, slash commands from a list you pass, a running token or character count with a
 * limit, and the one button that is Send at rest and Stop while a reply arrives. The command list
 * follows the field like a combobox: arrows move through it, Enter or Tab picks, Escape closes it,
 * and focus never leaves the field.
 */
export function PromptComposer({
  value: valueProp,
  defaultValue = '',
  onValueChange,
  commands = [],
  onCommand,
  models = [],
  model: modelProp,
  defaultModel,
  onModelChange,
  tools,
  count,
  limit,
  countTokens = estimateTokens,
  locale,
  disabled = false,
  messages: overrides,
  textareaRef,
  className,
  ...props
}: PromptComposerProps) {
  const m = { ...PROMPT_COMPOSER_MESSAGES, ...overrides };
  const { Enter } = useAiParts();
  const controlled = valueProp !== undefined;
  const [draft, setDraft] = useState(defaultValue);
  const text = controlled ? valueProp : draft;
  const [caret, setCaret] = useState(text.length);
  const [active, setActive] = useState(0);
  /** Where the slash word the reader closed with Escape starts; it stays closed until it changes. */
  const [dismissed, setDismissed] = useState<number | null>(null);
  const [modelState, setModelState] = useState(defaultModel ?? models[0]?.id);
  const field = useRef<HTMLTextAreaElement | null>(null);
  const pendingCaret = useRef<number | null>(null);
  const listId = useId();
  const countId = useId();

  const setText = (next: string) => {
    if (!controlled) setDraft(next);
    onValueChange?.(next);
  };

  const slash = commands.length > 0 && !disabled ? slashQuery(text, caret) : null;
  const open = slash !== null && slash.start !== dismissed;
  const matches = open ? matchCommands(commands, slash.query) : [];
  const current = matches.length === 0 ? 0 : Math.min(active, matches.length - 1);
  const optionId = (index: number) => `${listId}-option-${String(index)}`;

  // A new query starts at the best match; a new slash word opens again after an Escape.
  const query = slash === null ? null : `${String(slash.start)}:${slash.query}`;
  const [seenQuery, setSeenQuery] = useState(query);
  if (query !== seenQuery) {
    setSeenQuery(query);
    setActive(0);
    if (slash?.start !== dismissed) setDismissed(null);
  }

  // After a pick, the caret goes just past the inserted command once the field has the new text.
  useLayoutEffect(() => {
    const at = pendingCaret.current;
    if (at === null || field.current === null) return;
    pendingCaret.current = null;
    field.current.setSelectionRange(at, at);
  });

  const readCaret = () => {
    if (field.current !== null) setCaret(field.current.selectionStart);
  };

  const pick = (command: AiComposerCommand) => {
    if (slash === null) return;
    const next = insertCommand(text, slash, command);
    pendingCaret.current = next.caret;
    setCaret(next.caret);
    setText(next.text);
    onCommand?.(command);
    field.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open || event.nativeEvent.isComposing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setDismissed(slash.start);
      return;
    }
    if (matches.length === 0) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current + step + matches.length) % matches.length);
    } else if ((event.key === 'Enter' && !event.shiftKey) || event.key === 'Tab') {
      const command = matches[current];
      if (command === undefined) return;
      event.preventDefault();
      pick(command);
    }
  };

  const model = modelProp ?? modelState;
  const measured =
    count === 'characters' ? text.length : count === 'tokens' ? countTokens(text) : 0;
  const tone = count === undefined ? 'quiet' : countTone(measured, limit);
  const format = (n: number) => new Intl.NumberFormat(locale).format(n);
  // A phone has less room beside Send: the figures shorten (8K) and keep their unit.
  const compact = (n: number) => new Intl.NumberFormat(locale, { notation: 'compact' }).format(n);
  const unit = count ?? 'tokens';
  // The count is said when it crosses a line (near the limit, over it, back under it), not on every
  // figure: the field's description holds the figure for whoever asks.
  const [seenTone, setSeenTone] = useState(tone);
  const [toneNote, setToneNote] = useState('');
  if (tone !== seenTone) {
    setSeenTone(tone);
    const note =
      limit === undefined
        ? ''
        : tone === 'over'
          ? m.countOver(format(measured - limit), unit)
          : seenTone === 'over'
            ? m.countFits
            : tone === 'near'
              ? m.countLeft(format(limit - measured), unit)
              : '';
    // Falling back to quiet says nothing new: the last note stands rather than being cut off.
    if (note !== '') setToneNote(note);
  }
  const commandNote = useSettled(open ? m.commandsFound(matches.length) : '');
  const countNote = useSettled(toneNote);
  const description =
    count === undefined
      ? ''
      : m.count(format(measured), limit === undefined ? undefined : format(limit), unit) +
        (tone === 'over' && limit !== undefined ? `, ${m.overBy(format(measured - limit))}` : '');

  const picker =
    models.length > 0 ? (
      <Select
        items={models.map((item) => ({ value: item.id, label: item.label }))}
        value={model ?? null}
        disabled={disabled}
        onValueChange={(next) => {
          if (typeof next !== 'string') return;
          if (modelProp === undefined) setModelState(next);
          onModelChange?.(next);
        }}
      >
        <SelectTrigger
          aria-label={m.model}
          data-part="model"
          className={cn(
            'relative h-(--rx-button-height-md) w-auto max-w-48 min-w-0 gap-1.5 border-transparent bg-transparent px-2.5 text-sm font-medium text-fg-muted shadow-none',
            'hover:border-transparent hover:bg-surface-hover hover:text-fg data-popup-open:border-transparent',
            'data-disabled:border-transparent data-disabled:bg-transparent max-sm:max-w-36',
            touchHitArea,
          )}
        />
        <SelectContent>
          {models.map((item) => (
            <SelectItem key={item.id} value={item.id} hint={item.hint}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : null;

  return (
    <div data-slot="prompt-composer" className={cn('relative w-full min-w-0', className)}>
      {open && (
        <Enter
          data-part="commands"
          className={cn(
            'absolute inset-x-0 bottom-full z-20 mb-2 overflow-hidden rounded-panel border border-line bg-surface-overlay shadow-overlay backdrop-surface',
          )}
        >
          {matches.length === 0 ? (
            <p className="px-3.5 py-3 text-sm text-fg-muted">{m.noCommands}</p>
          ) : (
            <div
              id={listId}
              role="listbox"
              aria-label={m.commands}
              className="flex max-h-72 flex-col overflow-y-auto p-1"
            >
              {matches.map((command, index) => (
                <div
                  key={command.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === current}
                  data-highlighted={index === current || undefined}
                  // Keeps focus in the field: the pick happens on the press, before any blur.
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onClick={() => {
                    pick(command);
                  }}
                  onMouseMove={() => {
                    if (index !== current) setActive(index);
                  }}
                  className={cn(
                    'flex cursor-pointer items-baseline gap-3 rounded-control px-2.5 py-2 text-sm',
                    'pointer-coarse:min-h-(--rx-control-height-touch) pointer-coarse:items-center',
                    // Fill, accent text and an inset edge: the pick reads without relying on one tone.
                    'data-highlighted:bg-accent-subtle data-highlighted:text-accent-strong data-highlighted:inset-ring-1 data-highlighted:inset-ring-accent',
                  )}
                >
                  <span className="shrink-0 font-mono font-medium">/{command.name}</span>
                  {command.description !== undefined && (
                    <span className="min-w-0 truncate text-fg-muted">{command.description}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Enter>
      )}
      <PromptInput
        {...props}
        value={text}
        onValueChange={(next) => {
          setText(next);
          // The caret is where the edit left it, read once the field has the new text.
          queueMicrotask(readCaret);
        }}
        disabled={disabled}
        messages={m}
        textareaRef={(node) => {
          field.current = node;
          assignRef(textareaRef, node);
        }}
        submitDisabled={tone === 'over'}
        data-invalid={tone === 'over' || undefined}
        className="data-invalid:border-negative-strong"
        textareaProps={{
          onKeyDown,
          onSelect: readCaret,
          onClick: readCaret,
          'aria-autocomplete': commands.length > 0 ? 'list' : undefined,
          'aria-controls': open && matches.length > 0 ? listId : undefined,
          'aria-activedescendant': open && matches.length > 0 ? optionId(current) : undefined,
          'aria-describedby': count === undefined ? undefined : countId,
          'aria-invalid': tone === 'over' || undefined,
        }}
        tools={
          picker === null && tools === undefined ? undefined : (
            <>
              {picker}
              {tools}
            </>
          )
        }
        meta={
          count === undefined ? undefined : (
            // Drawn only: the field's description below says it once, at every width.
            <span
              aria-hidden
              data-part="count"
              data-tone={tone}
              className={cn(
                'text-sm whitespace-nowrap text-fg-subtle numeric',
                'data-[tone=near]:text-warning-strong data-[tone=over]:font-medium data-[tone=over]:text-negative-strong',
              )}
            >
              <span className="max-sm:hidden">
                {m.count(format(measured), limit === undefined ? undefined : format(limit), unit)}
                {tone === 'over' &&
                  limit !== undefined &&
                  `, ${m.overBy(format(measured - limit))}`}
              </span>
              <span className="sm:hidden">
                {tone === 'over' && limit !== undefined
                  ? m.overBy(compact(measured - limit))
                  : m.count(
                      compact(measured),
                      limit === undefined ? undefined : compact(limit),
                      unit,
                    )}
              </span>
            </span>
          )
        }
      />
      {count !== undefined && (
        <span id={countId} className="sr-only">
          {description}
        </span>
      )}
      <span aria-live="polite" className="sr-only">
        {commandNote}
      </span>
      <span aria-live="polite" className="sr-only">
        {countNote}
      </span>
    </div>
  );
}
