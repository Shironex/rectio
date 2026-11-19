import { plural, type InvoiceDetailMessages } from '@rectio/blocks';

import { commonPl } from './common';

export const invoiceDetailPl: InvoiceDetailMessages = {
  ...commonPl,
  heading: (number) => <>Faktura {number}</>,
  overdueDescription: (days, due) =>
    `${String(days)} ${plural(days, { one: 'dzień', other: 'dni' }, 'pl-PL')} po terminie, termin ${due}`,
  paidInFull: 'Opłacona w całości',
  dueDescription: (due) => `Termin płatności ${due}`,
  pdf: 'PDF',
  sendInvoice: 'Wyślij fakturę',
  recordPayment: 'Zapisz płatność',
  billedTo: 'Nabywca',
  from: 'Sprzedawca',
  issued: 'Data wystawienia',
  due: 'Termin płatności',
  reference: 'Numer zamówienia',
  taxId: (taxId) => <>NIP {taxId}</>,
  tableCaption: (currency) => `Pozycje faktury, kwoty w ${currency}`,
  description: 'Opis',
  quantity: 'Ilość',
  unitPrice: 'Cena jedn.',
  vat: 'VAT',
  netHeader: (currency) => `Netto, ${currency}`,
  foldedLine: (quantity, unitPrice, rate) => (
    <>
      {quantity} × {unitPrice}, VAT {rate}
    </>
  ),
  paymentsReceived: 'Otrzymane płatności',
  subtotal: 'Suma netto',
  vatRate: (rate) => `VAT ${rate}`,
  vatOn: (net) => <>od {net}</>,
  total: 'Razem brutto',
  paid: 'Zapłacono',
  balanceDue: 'Do zapłaty',
};
