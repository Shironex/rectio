'use client';

import type { KanbanPriority } from '@rectio/blocks';
import {
  Button,
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  RadioCard,
  RadioGroup,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  TagInput,
  Textarea,
} from '@rectio/ui';
import { useState, type SubmitEvent } from 'react';

import { CUSTOMERS } from '@/data/customers';
import { AGENTS } from '@/data/team';
import { TICKET_COLUMNS, TICKET_TAGS } from '@/data/tickets';

export interface TicketDraft {
  columnId: string;
  title: string;
  customerId: string;
  requester: string;
  priority: KanbanPriority;
  tags: string[];
  assignee?: string;
  summary: string;
}

const PRIORITIES: readonly { value: KanbanPriority; label: string; hint: string }[] = [
  { value: 'low', label: 'Low', hint: 'Within 2 days' },
  { value: 'medium', label: 'Medium', hint: 'Within 8 hours' },
  { value: 'high', label: 'High', hint: 'Within 2 hours' },
  { value: 'urgent', label: 'Urgent', hint: 'Within 30 minutes' },
];

const CUSTOMER_ITEMS = CUSTOMERS.map((c) => ({ value: c.id, label: c.name }));
const UNASSIGNED = 'unassigned';
const AGENT_ITEMS = [
  { value: UNASSIGNED, label: 'Unassigned' },
  ...AGENTS.filter((a) => a.role !== 'viewer').map((a) => ({ value: a.name, label: a.name })),
];
const COLUMN_ITEMS = TICKET_COLUMNS.filter((c) => c.done !== true).map((c) => ({
  value: c.id,
  label: c.title,
}));

/**
 * Logs a ticket by hand, for a phone call or a message from outside the help desk. `onCreate` gets
 * the checked draft; send it to your API and add what comes back to the board.
 */
export function NewTicketSheet({
  columnId,
  onOpenChange,
  onCreate,
}: {
  /** The board column the ticket starts in; null keeps the sheet closed. */
  columnId: string | null;
  onOpenChange: (open: boolean) => void;
  onCreate: (draft: TicketDraft) => void;
}) {
  return (
    <Sheet open={columnId !== null} onOpenChange={onOpenChange}>
      <SheetContent className="sm:w-lg">
        {columnId !== null && (
          <TicketForm
            key={columnId}
            columnId={columnId}
            onCancel={() => {
              onOpenChange(false);
            }}
            onCreate={(draft) => {
              onCreate(draft);
              onOpenChange(false);
            }}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function TicketForm({
  columnId,
  onCancel,
  onCreate,
}: {
  columnId: string;
  onCancel: () => void;
  onCreate: (draft: TicketDraft) => void;
}) {
  const [title, setTitle] = useState('');
  const [customer, setCustomer] = useState<(typeof CUSTOMER_ITEMS)[number] | null>(null);
  const [requester, setRequester] = useState('');
  const [priority, setPriority] = useState<KanbanPriority>('medium');
  const [column, setColumn] = useState(columnId);
  const [assignee, setAssignee] = useState(UNASSIGNED);
  const [tags, setTags] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  const [tried, setTried] = useState(false);

  const errors = {
    title: title.trim() === '' ? 'Say what the ticket is about.' : null,
    customer: customer === null ? 'Choose the customer who asked.' : null,
    summary: summary.trim() === '' ? 'Write down what the customer said.' : null,
  };
  const show = (key: keyof typeof errors) => (tried ? errors[key] : null);

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTried(true);
    if (Object.values(errors).some((e) => e !== null) || customer === null) {
      event.currentTarget.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }
    const contact = CUSTOMERS.find((c) => c.id === customer.value)?.contact.name ?? '';
    onCreate({
      columnId: column,
      title: title.trim(),
      customerId: customer.value,
      requester: requester.trim() === '' ? contact : requester.trim(),
      priority,
      tags,
      ...(assignee === UNASSIGNED ? {} : { assignee }),
      summary: summary.trim(),
    });
  };

  return (
    <form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
      <SheetHeader>
        <SheetTitle>New ticket</SheetTitle>
        <SheetDescription>
          For a call or a message from outside the help desk. The customer gets a copy by email.
        </SheetDescription>
      </SheetHeader>
      <SheetBody className="gap-5">
        <Field invalid={show('title') !== null}>
          <FieldLabel>Subject</FieldLabel>
          <Input
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
            }}
            placeholder="Invoices not syncing to QuickBooks"
            autoComplete="off"
          />
          <FieldError>{show('title')}</FieldError>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field invalid={show('customer') !== null}>
            <FieldLabel>Customer</FieldLabel>
            <Combobox
              items={CUSTOMER_ITEMS}
              value={customer}
              onValueChange={(value) => {
                setCustomer(value);
              }}
            >
              <ComboboxInput placeholder="Search customers" />
              <ComboboxContent>
                {(item: (typeof CUSTOMER_ITEMS)[number]) => (
                  <ComboboxItem key={item.value} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxContent>
            </Combobox>
            <FieldError>{show('customer')}</FieldError>
          </Field>
          <Field>
            <FieldLabel optional>Requester</FieldLabel>
            <Input
              value={requester}
              onChange={(event) => {
                setRequester(event.target.value);
              }}
              placeholder="The account contact"
              autoComplete="off"
            />
          </Field>
        </div>
        <Field>
          <RadioGroup
            legend="Priority"
            value={priority}
            onValueChange={(value) => {
              setPriority(value as KanbanPriority);
            }}
            className="grid grid-cols-2 gap-2"
          >
            {PRIORITIES.map((p) => (
              <RadioCard
                key={p.value}
                value={p.value}
                title={p.label}
                description={p.hint}
                className="p-3"
              />
            ))}
          </RadioGroup>
          <FieldDescription>Sets the first-response target.</FieldDescription>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel>Column</FieldLabel>
            <Select
              items={COLUMN_ITEMS}
              value={column}
              onValueChange={(value) => {
                if (value !== null) setColumn(value);
              }}
            >
              <SelectTrigger />
              <SelectContent>
                {COLUMN_ITEMS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Assignee</FieldLabel>
            <Select
              items={AGENT_ITEMS}
              value={assignee}
              onValueChange={(value) => {
                if (value !== null) setAssignee(value);
              }}
            >
              <SelectTrigger />
              <SelectContent>
                {AGENT_ITEMS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field>
          <FieldLabel optional>Tags</FieldLabel>
          <TagInput value={tags} onValueChange={setTags} placeholder="Billing, Bug" max={5} />
          <FieldDescription>
            Used on the board: {TICKET_TAGS.slice(0, 5).join(', ')}.
          </FieldDescription>
        </Field>
        <Field invalid={show('summary') !== null}>
          <FieldLabel>What the customer said</FieldLabel>
          <Textarea
            value={summary}
            onChange={(event) => {
              setSummary(event.target.value);
            }}
            minRows={3}
            maxRows={8}
            maxLength={2000}
            showCount
          />
          <FieldError>{show('summary')}</FieldError>
        </Field>
      </SheetBody>
      <SheetFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create ticket</Button>
      </SheetFooter>
    </form>
  );
}
