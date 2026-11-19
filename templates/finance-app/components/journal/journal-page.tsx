'use client';

import { BookOpenTextIcon, DownloadSimpleIcon } from '@phosphor-icons/react';
import { journalTotals } from '@rectio/blocks';
import { Ledger } from '@rectio/blocks/motion';
import { Button, Menu, MenuContent, MenuItem, MenuTrigger, useToast } from '@rectio/ui';

import { CURRENCY, LOCALE } from '@/data/company';
import { ACCOUNTS, JOURNAL, JOURNAL_PERIOD, OPENING_BALANCES } from '@/data/journal';
import { PageHeader } from '../page-header';
import { EmptyPanel, ErrorPanel, LoadingPanel, LoadingRegion } from '../states/state-views';
import { usePageState, useQueryParam } from '../use-page-state';

const FORMATS = [
  { id: 'csv', label: 'CSV for spreadsheets', file: 'journal-2026-11.csv' },
  { id: 'xlsx', label: 'Excel workbook', file: 'journal-2026-11.xlsx' },
  { id: 'pdf', label: 'PDF for the auditor', file: 'journal-2026-11.pdf' },
] as const;

/**
 * The general journal for the open period, and per account its ledger with a running balance.
 * `?account=1000` opens one account's ledger, as the sidebar links do.
 */
export function JournalPage() {
  const state = usePageState();
  const toast = useToast();
  const accountParam = useQueryParam('account');
  const account = ACCOUNTS.find((a) => a.code === accountParam)?.code ?? 'all';
  const entries = new Set(JOURNAL.map((l) => l.entryId)).size;
  const balanced = journalTotals(JOURNAL, CURRENCY).balanced;

  return (
    <>
      <PageHeader
        title="Journal"
        description={
          state === 'ready'
            ? `${JOURNAL_PERIOD}, ${String(entries)} entries, ${balanced ? 'debits equal credits' : 'out of balance'}`
            : JOURNAL_PERIOD
        }
        actions={
          <Menu>
            <MenuTrigger
              render={
                <Button variant="secondary">
                  <DownloadSimpleIcon aria-hidden weight="bold" className="size-4" />
                  Export
                </Button>
              }
            />
            <MenuContent align="end" className="min-w-56">
              {FORMATS.map((format) => (
                <MenuItem
                  key={format.id}
                  onClick={() => {
                    toast.add({
                      type: 'success',
                      title: 'Export started',
                      description: `${format.file} will download in a moment.`,
                    });
                  }}
                >
                  {format.label}
                </MenuItem>
              ))}
            </MenuContent>
          </Menu>
        }
      />
      {state === 'loading' ? (
        <LoadingRegion label="Loading the journal">
          <LoadingPanel kind="table" rows={12} />
        </LoadingRegion>
      ) : state === 'error' ? (
        <ErrorPanel title="The journal did not load" />
      ) : state === 'empty' ? (
        <EmptyPanel
          icon={<BookOpenTextIcon aria-hidden weight="bold" />}
          title="Nothing posted in November yet"
          description="Invoices, payments, bills and approved expenses post here as entries. Each one has to balance before it is saved."
        />
      ) : (
        <Ledger
          key={account}
          accounts={ACCOUNTS}
          lines={JOURNAL}
          currency={CURRENCY}
          locale={LOCALE}
          openingBalances={OPENING_BALANCES}
          defaultAccount={account}
          period={JOURNAL_PERIOD}
        />
      )}
    </>
  );
}
