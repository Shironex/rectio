'use client';

import { BookOpenIcon, CheckCircleIcon, PlusIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { BlockPanel, type ApiKey } from '@rectio/blocks';
import { ApiKeys } from '@rectio/blocks/motion';
import { Badge, Button, useToast } from '@rectio/ui';
import { useState } from 'react';

import { API_KEYS, API_SCOPES, WEBHOOKS } from '@/data/account';
import { LOCALE, NOW, formatDuration } from '@/data/workspace';
import { PageHeader } from '../page-header';
import { ErrorPanel, LoadingPanel, LoadingRegion } from '../states/state-views';
import { usePageState } from '../use-page-state';

/**
 * A key's secret as your API would return it once. Generate it on the server: this sample makes
 * one in the browser only so the reveal can be seen.
 */
function sampleSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return `lw_live_${Array.from(bytes, (b) => b.toString(36).padStart(2, '0'))
    .join('')
    .slice(0, 40)}`;
}

function Webhooks() {
  const toast = useToast();
  return (
    <BlockPanel
      title="Webhooks"
      description="Lindwell posts these events to your endpoints as they happen"
      bodyClassName="px-0 pb-2"
      actions={
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            toast.add({ title: 'Add an endpoint', description: 'It must answer over HTTPS.' });
          }}
        >
          <PlusIcon aria-hidden weight="bold" className="size-3.5" />
          Add endpoint
        </Button>
      }
    >
      <ul className="flex flex-col">
        {WEBHOOKS.map((hook) => {
          const failing = hook.status === 'failing';
          const ago = Math.round((NOW.getTime() - hook.lastDelivery.getTime()) / 60_000);
          return (
            <li
              key={hook.id}
              className="flex flex-col gap-2 border-t border-line px-5 py-3 first:border-t-0 sm:flex-row sm:items-center sm:gap-4"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <code className="truncate font-mono text-sm text-fg">{hook.url}</code>
                <span className="truncate text-sm text-fg-muted">{hook.events}</span>
                {hook.lastError !== undefined && (
                  <span className="text-sm text-negative-strong">{hook.lastError}</span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-3 text-sm">
                <span className="text-fg-muted">
                  Last sent {formatDuration(Math.max(ago, 1))} ago
                </span>
                {failing && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      toast.add({
                        title: 'Retrying the last 5 deliveries',
                        description: hook.url,
                      });
                    }}
                  >
                    Retry
                  </Button>
                )}
                <Badge tone={failing ? 'negative' : 'positive'}>
                  {failing ? (
                    <WarningCircleIcon aria-hidden weight="bold" className="size-3.5" />
                  ) : (
                    <CheckCircleIcon aria-hidden weight="bold" className="size-3.5" />
                  )}
                  {failing ? 'Failing' : 'Healthy'}
                </Badge>
              </span>
            </li>
          );
        })}
      </ul>
    </BlockPanel>
  );
}

/** API keys for your own code and integrations, and the webhooks Lindwell sends. */
export function DevelopersPage() {
  const state = usePageState();
  const toast = useToast();
  const [keys, setKeys] = useState<readonly ApiKey[]>(API_KEYS);
  const [created, setCreated] = useState<{ name: string; value: string } | undefined>(undefined);

  return (
    <>
      <PageHeader
        title="Developers"
        description="API keys and webhooks connect your own app, a data warehouse or an automation"
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              toast.add({ title: 'API reference', description: 'Point this at your own docs.' });
            }}
          >
            <BookOpenIcon aria-hidden weight="bold" className="size-4" />
            API reference
          </Button>
        }
      />
      {state === 'loading' ? (
        <LoadingRegion label="Loading API keys">
          <LoadingPanel kind="table" rows={4} columns={4} toolbar />
          <LoadingPanel kind="list" rows={3} />
        </LoadingRegion>
      ) : state === 'error' ? (
        <ErrorPanel title="API keys did not load" />
      ) : (
        <>
          <ApiKeys
            title="Keys"
            keys={state === 'empty' ? [] : keys}
            scopes={API_SCOPES}
            now={NOW}
            locale={LOCALE}
            createdKey={created}
            onCreatedKeyDismiss={() => {
              setCreated(undefined);
            }}
            onCreate={(draft) => {
              const value = sampleSecret();
              setKeys((list) => [
                {
                  id: `k-${String(list.length + 1)}`,
                  name: draft.name,
                  prefix: value.slice(0, 12),
                  scope: draft.scope,
                  createdAt: new Date(),
                  ...(draft.expiresAt === undefined ? {} : { expiresAt: draft.expiresAt }),
                },
                ...list,
              ]);
              setCreated({ name: draft.name, value });
            }}
            onRevoke={(id) => {
              setKeys((list) =>
                list.map((k) => (k.id === id ? { ...k, revokedAt: new Date() } : k)),
              );
              toast.add({ title: 'Key revoked', description: 'Calls with it now fail.' });
            }}
          />
          {state !== 'empty' && <Webhooks />}
        </>
      )}
    </>
  );
}
