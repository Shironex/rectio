'use client';

import { Tabs, TabsList, TabsPanel, TabsTab } from '@rectio/ui';

export default function TabsDemo() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <Tabs defaultValue="open">
        <TabsList aria-label="Invoices by state">
          <TabsTab value="open" hint="12">
            Open
          </TabsTab>
          <TabsTab value="overdue" hint="3">
            Overdue
          </TabsTab>
          <TabsTab value="paid" hint="48">
            Paid
          </TabsTab>
          <TabsTab value="archived" disabled>
            Archived
          </TabsTab>
        </TabsList>
        <TabsPanel value="open" className="text-sm text-fg-muted">
          12 invoices are waiting for payment, worth €41,860.
        </TabsPanel>
        <TabsPanel value="overdue" className="text-sm text-fg-muted">
          3 invoices are past due. The oldest is 19 days late.
        </TabsPanel>
        <TabsPanel value="paid" className="text-sm text-fg-muted">
          48 invoices were paid this year.
        </TabsPanel>
      </Tabs>
      <Tabs defaultValue="month">
        <TabsList variant="segmented" aria-label="Period">
          <TabsTab value="month">Month</TabsTab>
          <TabsTab value="quarter">Quarter</TabsTab>
          <TabsTab value="year">Year</TabsTab>
        </TabsList>
        <TabsPanel value="month" className="text-sm text-fg-muted">
          March 2026
        </TabsPanel>
        <TabsPanel value="quarter" className="text-sm text-fg-muted">
          Q1 2026
        </TabsPanel>
        <TabsPanel value="year" className="text-sm text-fg-muted">
          Financial year 2026
        </TabsPanel>
      </Tabs>
    </div>
  );
}
