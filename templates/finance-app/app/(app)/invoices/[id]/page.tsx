import type { Metadata } from 'next';

import { InvoiceDetailPage } from '@/components/invoices/invoice-detail-page';
import { INVOICE_RECORDS } from '@/data/invoice-records';

interface Props {
  params: Promise<{ id: string }>;
}

/** Every invoice is prerendered: the app exports as static files. */
export function generateStaticParams() {
  return INVOICE_RECORDS.map((record) => ({ id: record.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: id.toUpperCase() };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <InvoiceDetailPage id={id} />;
}
