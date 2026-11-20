import type { Metadata } from 'next';

import { CustomerDetailPage } from '@/components/customers/customer-detail-page';
import { CUSTOMERS, customerById } from '@/data/customers';

interface Props {
  params: Promise<{ id: string }>;
}

/** Every customer is prerendered: the app exports as static files. */
export function generateStaticParams() {
  return CUSTOMERS.map((customer) => ({ id: customer.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: customerById(id)?.name ?? 'Customer' };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  return <CustomerDetailPage id={id} />;
}
