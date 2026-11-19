'use client';

import { Alert, Button } from '@rectio/ui';

export default function AlertDemo() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-3">
      <Alert tone="info" title="Rates update at 16:00">
        Foreign invoices use the rate published the day before their date.
      </Alert>
      <Alert tone="warning" title="Bank feed paused" actions={<Button size="sm">Reconnect</Button>}>
        Transactions after 12 March are not imported.
      </Alert>
      <Alert tone="danger" title="Payment to Northwind failed" dismissible>
        The bank declined the transfer.
      </Alert>
      <Alert tone="success" variant="outline" title="Import finished" />
    </div>
  );
}
