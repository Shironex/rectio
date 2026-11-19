'use client';

import { DownloadSimpleIcon, FilePlusIcon, FileTextIcon } from '@phosphor-icons/react';
import { invoiceTotals, type StatusFilter } from '@rectio/blocks';
import { InvoiceList } from '@rectio/blocks/motion';
import { Button, Money, useToast } from '@rectio/ui';
import { useRouter } from 'next/navigation';

import { CURRENCY, LOCALE, TODAY } from '@/data/company';
import { INVOICES } from '@/data/invoices';
import { PageHeader } from '../page-header';
import { useAppData } from '../shell/app-data';
import { EmptyPanel, ErrorPanel, LoadingPanel, LoadingRegion } from '../states/state-views';
import { usePageState, useQueryParam } from '../use-page-state';

const FILTERS: readonly StatusFilter[] = ['all', 'outstanding', 'overdue', 'paid', 'draft'];

/** Every invoice of the year, filtered by status, with what is outstanding and overdue on top. */
export function InvoicesPage() {
  const state = usePageState();
  const router = useRouter();
  const toast = useToast();
  const { openNewInvoice } = useAppData();
  const filterParam = useQueryParam('filter');
  // Open on what still needs collecting, most overdue first; ?filter=all shows the whole year.
  const filter = FILTERS.find((f) => f === filterParam) ?? 'outstanding';
  const totals = invoiceTotals(INVOICES, TODAY, CURRENCY);

  return (
    <>
      <PageHeader
        title="Invoices"
        description={
          state === 'ready' ? (
            <>
              {INVOICES.length} invoices this year,{' '}
              <Money amount={totals.outstanding} currency={CURRENCY} locale={LOCALE} /> outstanding
            </>
          ) : (
            'Fernhill Systems Ltd'
          )
        }
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                toast.add({
                  type: 'success',
                  title: 'Export started',
                  description: 'invoices-2026.csv will download in a moment.',
                });
              }}
            >
              <DownloadSimpleIcon aria-hidden weight="bold" className="size-4" />
              Export
            </Button>
            <Button onClick={openNewInvoice}>
              <FilePlusIcon aria-hidden weight="bold" className="size-4" />
              New invoice
            </Button>
          </>
        }
      />
      {state === 'loading' ? (
        <LoadingRegion label="Loading invoices">
          <LoadingPanel kind="table" rows={10} />
        </LoadingRegion>
      ) : state === 'error' ? (
        <ErrorPanel title="Invoices did not load" />
      ) : state === 'empty' ? (
        <EmptyPanel
          icon={<FileTextIcon aria-hidden weight="bold" />}
          title="No invoices yet"
          description="Bill your first customer. Drafts, sent and paid invoices are listed here with what each one still owes."
          actions={<Button onClick={openNewInvoice}>New invoice</Button>}
        />
      ) : (
        <InvoiceList
          key={filter}
          title="All invoices"
          invoices={INVOICES}
          currency={CURRENCY}
          locale={LOCALE}
          today={TODAY}
          defaultPeriod="year"
          defaultFilter={filter}
          onOpenInvoice={(invoice) => {
            router.push(`/invoices/${invoice.id}`);
          }}
        />
      )}
    </>
  );
}
