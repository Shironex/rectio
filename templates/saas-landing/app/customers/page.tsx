import type { Metadata } from 'next';

import { CustomersPage } from '@/components/pages/customers';

export const metadata: Metadata = {
  title: 'Customers',
  description: 'How cafés, clinics, shops and warehouses plan their week on Rostra.',
};

export default function Page() {
  return <CustomersPage />;
}
