import {
  CaretRightIcon,
  CheckIcon,
  CopyIcon,
  KeyIcon,
  PlusIcon,
  ShieldWarningIcon,
  XCircleIcon,
} from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  cn,
} from '@rectio/ui';
import { useEffect, useId, useRef, useState, type ReactNode, type SyntheticEvent } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { EmptyNote } from '../../lib/empty-note';
import { formatShortDate, resolveLocale } from '../../lib/finance';
import { StateBadge } from '../../lib/state-badge';
import { FormMessage } from '../lib/auth';
import { focusFirstInvalid, useNow, useRemovalFocus } from '../lib/focus';
import { countLabel, relativeTime } from '../lib/saas';
import { focusRing, inlineLink } from '../lib/styles';
import { useSaasParts } from '../lib/saas-parts';
import {
  API_KEY_EXPIRY_LABELS,
  apiKeyExpiryDate,
  apiKeyNameError,
  apiKeyStatus,
  maskApiKey,
  sortApiKeys,
  type ApiKey,
  type ApiKeyDraft,
  type ApiKeyExpiry,
  type ApiKeyScopeOption,
} from './api-keys.logic';

export interface ApiKeysProps {
  keys: readonly ApiKey[];
  /** What a key may be scoped to, such as read only or full access. */
  scopes: readonly ApiKeyScopeOption[];
  /** Shows the create form. Called with a valid name, a scope and the expiry date. */
  onCreate?: (draft: ApiKeyDraft) => void;
  /** Asked to confirm first, in a dialog naming the key. */
  onRevoke?: (keyId: string) => void;
  /**
   * The full secret of a key you just created. It is shown once, with a copy button, until
   * `onCreatedKeyDismiss`; never keep it in your state any longer than that.
   */
  createdKey?: { name: string; value: string } | undefined;
  onCreatedKeyDismiss?: () => void;
  /** Creating is in flight: the create button shows progress. */
  pending?: boolean;
  /** Why creating failed, shown in the form. */
  error?: ReactNode;
  /** The moment "last used" and expiry are measured from. */
  now?: Date;
  locale?: string;
  /** Where your API docs live, linked from the empty state. */
  docsHref?: string;
  title?: string;
  className?: string;
}

const STATUS = {
  expiring: { state: 'pending', label: 'Expires soon' },
  expired: { state: 'overdue', label: 'Expired' },
  revoked: { state: 'void', label: 'Revoked' },
} as const;

export type CopyState = 'idle' | 'copied' | 'failed';

/** What the last copy did, for the button's label and the live region; settles back after a while. */
function useCopy() {
  const [state, setState] = useState<CopyState>('idle');
  useEffect(() => {
    if (state !== 'copied') return;
    const timer = setTimeout(() => {
      setState('idle');
    }, 2400);
    return () => {
      clearTimeout(timer);
    };
  }, [state]);
  const copy = (text: string) => {
    // No clipboard on an insecure page or an old browser, and writeText can throw before it
    // returns a promise: every failure lands on the same "select it and copy" message.
    const { clipboard } = navigator as { clipboard?: Clipboard };
    if (clipboard === undefined) {
      setState('failed');
      return;
    }
    try {
      clipboard.writeText(text).then(
        () => {
          setState('copied');
        },
        () => {
          setState('failed');
        },
      );
    } catch {
      setState('failed');
    }
  };
  return [state, copy] as const;
}

/**
 * The keys your users' code signs in with: each with its scope, when it was made and last used,
 * and whether it is about to expire. A new key's secret is shown exactly once, to copy; revoking
 * asks first. The block never sees a secret except the one you pass to reveal.
 */
export function ApiKeys({
  keys,
  scopes,
  onCreate,
  onRevoke,
  createdKey,
  onCreatedKeyDismiss,
  pending = false,
  error,
  now: requestedNow,
  locale: requestedLocale,
  docsHref,
  title = 'API keys',
  className,
}: ApiKeysProps) {
  const locale = resolveLocale(requestedLocale);
  const now = useNow(requestedNow);
  const { Button } = useBlockParts();
  const { Items, Item } = useSaasParts();
  const createButtonRef = useRef<HTMLButtonElement>(null);
  const refocusCreate = useRef(false);
  /** Back to "Create key" once the form or the reveal closes, instead of dropping focus. */
  const closeCreating = () => {
    refocusCreate.current = true;
    setCreating(false);
  };
  // The button comes back only after the app clears the revealed key, so wait for it to render;
  // with no reveal pending, the request ends here either way and never steals focus later.
  useEffect(() => {
    if (!refocusCreate.current) return;
    if (createButtonRef.current !== null) {
      refocusCreate.current = false;
      createButtonRef.current.focus();
    } else if (createdKey === undefined) {
      refocusCreate.current = false;
    }
  });
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);
  const live = keys.filter((key) => key.revokedAt === undefined);
  const showForm = onCreate !== undefined && creating && createdKey === undefined;

  const sorted = sortApiKeys(keys);
  const liveKeys = sorted.filter((key) => key.revokedAt === undefined);
  const revokedKeys = sorted.filter((key) => key.revokedAt !== undefined);
  const panel = useRef<HTMLElement>(null);
  // A revoked key leaves the active list: focus moves to the next active key's Revoke.
  const removal = useRemovalFocus(
    panel,
    liveKeys.map((key) => key.id),
  );
  const renderKeys = (list: readonly ApiKey[], label: string, live: boolean) => (
    <ul aria-label={label} className="flex flex-col">
      <Items>
        {list.map((key) => (
          <Item
            key={key.id}
            data-row-id={live ? key.id : undefined}
            className="flex flex-col gap-2 py-3.5 not-last:border-b not-last:border-line @lg:flex-row @lg:items-center @lg:gap-3"
          >
            <KeyRow
              apiKey={key}
              scope={scopes.find((s) => s.value === key.scope)}
              now={now}
              locale={locale}
              onRevoke={
                onRevoke === undefined
                  ? undefined
                  : () => {
                      setRevoking(key);
                    }
              }
            />
          </Item>
        ))}
      </Items>
    </ul>
  );

  return (
    <BlockPanel
      ref={panel}
      title={title}
      description={
        live.length === 0
          ? 'No active keys'
          : `${String(live.length)} active ${live.length === 1 ? 'key' : 'keys'}`
      }
      actions={
        onCreate !== undefined && !showForm && createdKey === undefined && keys.length > 0 ? (
          <Button
            ref={createButtonRef}
            onClick={() => {
              setCreating(true);
            }}
          >
            <PlusIcon aria-hidden weight="bold" className="size-4" />
            Create key
          </Button>
        ) : undefined
      }
      className={className}
      bodyClassName="gap-5"
    >
      {createdKey !== undefined && (
        <KeyReveal
          name={createdKey.name}
          value={createdKey.value}
          onDone={() => {
            closeCreating();
            onCreatedKeyDismiss?.();
          }}
        />
      )}

      {showForm && (
        <CreateForm
          keys={keys}
          scopes={scopes}
          now={now}
          locale={locale}
          pending={pending}
          error={error}
          onCancel={closeCreating}
          onCreate={onCreate}
        />
      )}

      {keys.length === 0 ? (
        !showForm &&
        createdKey === undefined && (
          <EmptyNote
            icon={KeyIcon}
            title="No API keys yet"
            action={
              onCreate === undefined && docsHref === undefined ? undefined : (
                <span className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                  {onCreate !== undefined && (
                    <Button
                      ref={createButtonRef}
                      onClick={() => {
                        setCreating(true);
                      }}
                    >
                      <PlusIcon aria-hidden weight="bold" className="size-4" />
                      Create key
                    </Button>
                  )}
                  {docsHref !== undefined && (
                    <a href={docsHref} className={cn(inlineLink, 'text-sm')}>
                      Read the API docs
                    </a>
                  )}
                </span>
              )
            }
          >
            Keys let your scripts and servers call the API as your workspace. Make one per place
            that calls it, so you can revoke one without the others.
          </EmptyNote>
        )
      ) : (
        <>
          {liveKeys.length > 0 && renderKeys(liveKeys, 'API keys', true)}
          {/* Revoked keys stay on record but out of the way, one click from view. */}
          {revokedKeys.length > 0 && (
            <details className="group border-t border-line">
              <summary
                className={cn(
                  'flex min-h-(--rx-control-height-touch) cursor-pointer list-none items-center gap-2 rounded-control text-sm font-medium text-fg-muted hover:text-fg',
                  focusRing,
                )}
              >
                <CaretRightIcon
                  aria-hidden
                  weight="bold"
                  className="size-3.5 transition-transform duration-fast ease-standard group-open:rotate-90"
                />
                <span className="group-open:hidden">Show</span>
                <span className="hidden group-open:inline">Hide</span>
                <span>{countLabel(revokedKeys.length, 'revoked key')}</span>
              </summary>
              {renderKeys(revokedKeys, 'Revoked API keys', false)}
            </details>
          )}
        </>
      )}

      <RevokeDialog
        apiKey={revoking}
        finalFocus={removal.landing}
        onCancel={() => {
          setRevoking(null);
        }}
        onConfirm={(key) => {
          removal.prepare([key.id]);
          onRevoke?.(key.id);
          setRevoking(null);
        }}
      />
    </BlockPanel>
  );
}

/** One key: name, then its scope and state, then the visible prefix, then its dates. */
function KeyRow({
  apiKey: key,
  scope,
  now,
  locale,
  onRevoke,
}: {
  apiKey: ApiKey;
  scope: ApiKeyScopeOption | undefined;
  now: Date;
  locale: string;
  onRevoke: (() => void) | undefined;
}) {
  const { Button } = useBlockParts();
  const [copyState, copy] = useCopy();
  const status = apiKeyStatus(key, now);
  const badge = status === 'active' ? null : STATUS[status];
  const dead = status === 'revoked' || status === 'expired';
  const elevated = scope?.elevated === true;
  const copyLabel =
    copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy prefix';
  const expiringSoon = status === 'expiring';
  const canRevoke = onRevoke !== undefined && status !== 'revoked';
  return (
    <>
      <span
        aria-hidden
        className={cn(
          'hidden size-9 shrink-0 items-center justify-center rounded-full border border-line-strong bg-surface-sunken text-fg-muted @lg:inline-flex',
          dead && 'border-dashed',
        )}
      >
        <KeyIcon weight="bold" className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Line 1: what it is called, what it may do and whether it still works. */}
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="me-0.5 font-medium text-pretty">{key.name}</span>
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-badge border px-1.5 py-px text-xs',
              elevated
                ? 'border-warning-strong/30 bg-warning-subtle font-medium text-warning-strong'
                : 'border-line text-fg-muted',
            )}
          >
            {elevated && <ShieldWarningIcon aria-hidden weight="bold" className="size-3" />}
            {scope?.label ?? key.scope}
          </span>
          {badge !== null && <StateBadge state={badge.state} label={badge.label} />}
        </span>
        {/* Line 2: the visible part of the key, in a sunken chip. */}
        <span>
          <code className="rounded-badge border border-line bg-surface-sunken px-1.5 py-0.5 font-mono text-sm text-fg">
            <span className="sr-only">Key starting </span>
            {maskApiKey(key.prefix)}
          </code>
        </span>
        {/* Line 3: its dates, each its own phrase. */}
        <span className="flex flex-wrap items-center gap-x-1.5 text-sm text-fg-muted">
          <span>
            Created <span className="numeric">{formatShortDate(key.createdAt, locale)}</span>
          </span>
          <MetaDot />
          <span>
            {key.lastUsedAt === undefined
              ? 'Never used'
              : `Last used ${relativeTime(key.lastUsedAt, now, locale)}`}
          </span>
          {key.revokedAt === undefined && key.expiresAt !== undefined && (
            <>
              <MetaDot />
              <span className={cn(expiringSoon && 'font-medium text-warning-strong')}>
                {status === 'expired' ? 'Expired' : 'Expires'}{' '}
                <span className="numeric">{formatShortDate(key.expiresAt, locale)}</span>
              </span>
            </>
          )}
          {key.revokedAt !== undefined && (
            <>
              <MetaDot />
              <span>
                Revoked <span className="numeric">{formatShortDate(key.revokedAt, locale)}</span>
              </span>
            </>
          )}
        </span>
      </div>
      {/* Narrow: a row of actions under the dates. Wide: centred on the right. */}
      {(!dead || canRevoke) && (
        <div className="-ms-2 flex items-center gap-1 @lg:ms-0 @lg:shrink-0">
          {!dead && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'text-fg-muted hover:text-fg',
                copyState === 'failed' && 'text-negative-strong',
              )}
              aria-label={`${copyLabel}, ${key.name}`}
              onClick={() => {
                copy(key.prefix);
              }}
            >
              {copyState === 'copied' ? (
                <CheckIcon aria-hidden weight="bold" className="size-4" />
              ) : (
                <CopyIcon aria-hidden weight="bold" className="size-4" />
              )}
              {copyLabel}
            </Button>
          )}
          {canRevoke && (
            <Button
              data-row-focus
              variant="ghost"
              size="sm"
              className="text-negative-strong hover:bg-negative-subtle"
              aria-label={`Revoke, ${key.name}`}
              onClick={onRevoke}
            >
              <XCircleIcon aria-hidden weight="bold" className="size-4" />
              Revoke
            </Button>
          )}
        </div>
      )}
      <span aria-live="polite" className="sr-only">
        {copyState === 'copied'
          ? `Prefix of ${key.name} copied`
          : copyState === 'failed'
            ? `Copy failed. Select the prefix of ${key.name} and copy it.`
            : ''}
      </span>
    </>
  );
}

function MetaDot() {
  return (
    <span aria-hidden className="text-fg-subtle">
      ·
    </span>
  );
}

const EXPIRIES = Object.keys(API_KEY_EXPIRY_LABELS) as ApiKeyExpiry[];

function CreateForm({
  keys,
  scopes,
  now,
  locale,
  pending,
  error,
  onCancel,
  onCreate,
}: {
  keys: readonly ApiKey[];
  scopes: readonly ApiKeyScopeOption[];
  now: Date;
  locale: string;
  pending: boolean;
  error: ReactNode;
  onCancel: () => void;
  onCreate: (draft: ApiKeyDraft) => void;
}) {
  const { Button } = useBlockParts();
  const headingId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState('');
  const [scope, setScope] = useState(scopes[0]?.value ?? '');
  const [expiry, setExpiry] = useState<ApiKeyExpiry>('90');
  const [tried, setTried] = useState(false);
  const nameError = apiKeyNameError(name, keys);
  const expiresAt = apiKeyExpiryDate(expiry, now);

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    setTried(true);
    if (nameError !== null) {
      focusFirstInvalid(formRef.current);
      return;
    }
    if (pending) return;
    onCreate({ name: name.trim(), scope, ...(expiresAt === undefined ? {} : { expiresAt }) });
  };

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-control border border-line bg-surface-sunken p-4"
    >
      <h3 id={headingId} className="font-medium">
        Create an API key
      </h3>
      {error !== undefined && error !== null && error !== false && (
        <FormMessage tone="error" title={error} />
      )}
      <Field invalid={tried && nameError !== null}>
        <FieldLabel>Name</FieldLabel>
        <Input
          autoFocus
          value={name}
          placeholder="Billing worker"
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
        {tried && nameError !== null ? (
          <FieldError>{nameError}</FieldError>
        ) : (
          <FieldDescription>
            Say where it is used, so you know what breaks if you revoke it.
          </FieldDescription>
        )}
      </Field>
      <div className="grid gap-4 @xl:grid-cols-2">
        <Field>
          <FieldLabel>Access</FieldLabel>
          <Select
            items={scopes.map((s) => ({ value: s.value, label: s.label }))}
            value={scope}
            onValueChange={(next) => {
              if (typeof next === 'string') setScope(next);
            }}
          >
            <SelectTrigger />
            <SelectContent>
              {scopes.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <span className="flex flex-col py-0.5">
                    <span>{option.label}</span>
                    {option.description !== undefined && (
                      <span className="text-sm whitespace-normal text-fg-muted">
                        {option.description}
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel>Expires</FieldLabel>
          <Select
            items={EXPIRIES.map((value) => ({ value, label: API_KEY_EXPIRY_LABELS[value] }))}
            value={expiry}
            onValueChange={(next) => {
              const picked = EXPIRIES.find((value) => value === next);
              if (picked !== undefined) setExpiry(picked);
            }}
          >
            <SelectTrigger />
            <SelectContent>
              {EXPIRIES.map((value) => (
                <SelectItem key={value} value={value}>
                  {API_KEY_EXPIRY_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldDescription>
            {expiresAt === undefined
              ? 'Works until you revoke it.'
              : `Stops working on ${formatShortDate(expiresAt, locale)}.`}
          </FieldDescription>
        </Field>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          Create key
        </Button>
      </div>
    </form>
  );
}

/** The one time a secret is on screen: in full, with copy, and a plain warning. */
function KeyReveal({ name, value, onDone }: { name: string; value: string; onDone: () => void }) {
  const { Button } = useBlockParts();
  const headingId = useId();
  const [copyState, copy] = useCopy();
  const inputRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // The form that made the key has gone; focus lands on the reveal so it is read out at once.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // A failed copy selects the key, so a keyboard copy is one shortcut away.
  useEffect(() => {
    if (copyState === 'failed') inputRef.current?.select();
  }, [copyState]);

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-control border border-warning-strong/30 bg-warning-subtle p-4"
    >
      <h3
        ref={headingRef}
        id={headingId}
        tabIndex={-1}
        className="flex items-center gap-2 font-medium text-fg outline-none"
      >
        <ShieldWarningIcon aria-hidden weight="bold" className="size-4 text-warning-strong" />
        Copy the key for {name} now
      </h3>
      <p className="text-sm text-fg-muted">
        This is the only time you will see it. Store it in your secrets manager; if you lose it,
        revoke it and create a new one.
      </p>
      <Field invalid={copyState === 'failed'}>
        <FieldLabel>Secret key for {name}</FieldLabel>
        <div className="flex flex-col gap-2 @xl:flex-row @xl:items-center">
          <Input
            ref={inputRef}
            readOnly
            value={value}
            spellCheck={false}
            className="min-w-0 flex-1 font-mono"
            onFocus={(event) => {
              event.currentTarget.select();
            }}
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                copy(value);
              }}
            >
              {copyState === 'copied' ? (
                <CheckIcon aria-hidden weight="bold" className="size-4" />
              ) : (
                <CopyIcon aria-hidden weight="bold" className="size-4" />
              )}
              {copyState === 'copied' ? 'Copied' : 'Copy key'}
            </Button>
            <Button onClick={onDone}>Done</Button>
          </div>
        </div>
        {copyState === 'failed' && (
          <FieldError>Copy failed. Select the key and copy it.</FieldError>
        )}
      </Field>
      <p aria-live="polite" className="sr-only">
        {copyState === 'copied' ? 'Key copied to the clipboard' : ''}
      </p>
    </section>
  );
}

function RevokeDialog({
  apiKey,
  finalFocus,
  onCancel,
  onConfirm,
}: {
  apiKey: ApiKey | null;
  /** Where focus goes as the dialog closes: the row's neighbour after a confirm. */
  finalFocus: () => HTMLElement | true;
  onCancel: () => void;
  onConfirm: (key: ApiKey) => void;
}) {
  const { Button } = useBlockParts();
  // While the dialog closes it keeps naming the key, instead of an empty title.
  const [shown, setShown] = useState(apiKey);
  if (apiKey !== null && apiKey !== shown) setShown(apiKey);
  return (
    <Dialog
      open={apiKey !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent finalFocus={finalFocus}>
        <DialogHeader>
          <DialogTitle>Revoke {shown?.name}?</DialogTitle>
          <DialogDescription>
            Every request signed with it fails from now on. This cannot be undone; create a new key
            to replace it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (shown !== null) onConfirm(shown);
            }}
          >
            Revoke key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
