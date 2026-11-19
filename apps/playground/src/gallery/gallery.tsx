import { DownloadSimpleIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import {
  AmountInput,
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Money,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@rectio/ui';

import { CATEGORIES } from '../expenses/data';
import { Row, Section } from './specimen';

const items = CATEGORIES.map((c) => ({ value: c.value, label: c.label }));

function CategorySelect(props: { defaultValue?: string; disabled?: boolean; label: string }) {
  return (
    <Field className="w-56" disabled={props.disabled}>
      <FieldLabel>{props.label}</FieldLabel>
      <Select items={items} defaultValue={props.defaultValue ?? null} disabled={props.disabled}>
        <SelectTrigger placeholder="Choose a category" />
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

/** Every component in every state that can be shown at rest. Hover and focus are shot live. */
export function Gallery() {
  return (
    <div className="flex flex-col gap-6">
      <Section
        title="Button"
        note="One primary per view. Danger is outlined and fills only on press; loading keeps the label as the accessible name."
      >
        <Row label="Variants" center>
          <Button>Approve</Button>
          <Button variant="secondary">Export</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="danger">Reject</Button>
        </Row>
        <Row label="Sizes" center>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button variant="secondary" iconOnly aria-label="Download statement">
            <DownloadSimpleIcon aria-hidden weight="bold" className="size-4" />
          </Button>
        </Row>
        <Row label="Loading, disabled" center>
          <Button loading>Approve</Button>
          <Button variant="secondary" loading>
            Export
          </Button>
          <Button disabled>Approve</Button>
          <Button variant="secondary" disabled>
            <PlusIcon aria-hidden weight="bold" className="size-4" />
            Add line
          </Button>
        </Row>
        <Row label="Compact" center>
          <div data-density="compact" className="flex flex-wrap gap-3">
            <Button size="sm">Approve</Button>
            <Button size="sm" variant="secondary">
              Export
            </Button>
            <Button size="sm" variant="ghost" iconOnly aria-label="Delete line">
              <TrashIcon aria-hidden weight="bold" className="size-4" />
            </Button>
          </div>
        </Row>
      </Section>

      <Section
        title="Field and input"
        note="Errors carry an icon and text. Setting invalid on the field shows its error, for server checks too."
      >
        <Row label="Rest">
          <Field className="w-56">
            <FieldLabel>Merchant</FieldLabel>
            <Input placeholder="As on the receipt" />
          </Field>
          <Field className="w-56">
            <FieldLabel>Reference</FieldLabel>
            <Input defaultValue="INV-2041" />
            <FieldDescription>Printed on the statement.</FieldDescription>
          </Field>
        </Row>
        <Row label="Invalid, disabled">
          <Field className="w-56" invalid>
            <FieldLabel>Cost centre</FieldLabel>
            <Input defaultValue="CC-9" />
            <FieldError>No cost centre CC-9.</FieldError>
          </Field>
          <Field className="w-56" disabled>
            <FieldLabel>Approver</FieldLabel>
            <Input defaultValue="Set by policy" />
          </Field>
        </Row>
      </Section>

      <Section
        title="Amount"
        note="Figures are always right-aligned and tabular. The symbol sits on the side the locale puts it; name the currency in the label."
      >
        <Row label="Locales">
          <Field className="w-56">
            <FieldLabel>Amount, EUR</FieldLabel>
            <AmountInput currency="EUR" locale="de-DE" defaultValue={1234.5} />
          </Field>
          <Field className="w-56">
            <FieldLabel>Amount, USD</FieldLabel>
            <AmountInput currency="USD" locale="en-US" />
          </Field>
        </Row>
        <Row label="Invalid, disabled">
          <Field className="w-56" invalid>
            <FieldLabel>Amount, PLN</FieldLabel>
            <AmountInput currency="PLN" locale="pl-PL" defaultValue={0} />
            <FieldError>Enter an amount above zero.</FieldError>
          </Field>
          <Field className="w-56" disabled>
            <FieldLabel>Limit, GBP</FieldLabel>
            <AmountInput currency="GBP" locale="en-GB" defaultValue={500} disabled />
          </Field>
        </Row>
      </Section>

      <Section
        title="Select"
        note="For short fixed lists. The list opens below the trigger and stays inside the theme scope."
      >
        <Row label="States">
          <CategorySelect label="Category" />
          <CategorySelect label="Category" defaultValue="travel" />
          <CategorySelect label="Category" defaultValue="software" disabled />
        </Row>
      </Section>

      <Section
        title="Money"
        note="Locale rules decide grouping and the symbol side (pl-PL groups from five digits). Debits use the true minus; parentheses are opt-in."
      >
        <Row label="Statement">
          <dl className="grid w-80 grid-cols-2 gap-y-1.5 text-base">
            <dt className="text-fg-muted">Opening balance</dt>
            <dd className="text-end">
              <Money amount={18240.5} currency="EUR" locale="en-IE" />
            </dd>
            <dt className="text-fg-muted">Card refund</dt>
            <dd className="text-end">
              <Money
                amount={111.11}
                currency="EUR"
                locale="en-IE"
                tone="auto"
                signDisplay="exceptZero"
              />
            </dd>
            <dt className="text-fg-muted">Software</dt>
            <dd className="text-end">
              <Money amount={-1080} currency="EUR" locale="en-IE" tone="auto" />
            </dd>
            <dt className="text-fg-muted">Bank fees</dt>
            <dd className="text-end">
              <Money amount={-42.9} currency="EUR" locale="en-IE" tone="auto" />
            </dd>
            <dt className="mt-1 border-t border-line-strong pt-2 font-medium">Closing</dt>
            <dd className="mt-1 border-t border-line-strong pt-2 text-end font-medium">
              <Money amount={17228.71} currency="EUR" locale="en-IE" />
            </dd>
          </dl>
        </Row>
        <Row label="Accounting">
          <dl className="grid w-80 grid-cols-2 gap-y-1.5 text-base">
            <dt className="text-fg-muted">Bank fees</dt>
            <dd className="text-end">
              <Money amount={-42.9} currency="EUR" locale="en-IE" accounting />
            </dd>
            <dt className="text-fg-muted">Software</dt>
            <dd className="text-end">
              <Money amount={-1080} currency="EUR" locale="en-IE" accounting />
            </dd>
          </dl>
        </Row>
        <Row label="Locales">
          <dl className="grid w-80 grid-cols-2 gap-y-1.5 text-base">
            <dt className="text-fg-muted">ja-JP, no decimals</dt>
            <dd className="text-end">
              <Money amount={1500} currency="JPY" locale="ja-JP" />
            </dd>
            <dt className="text-fg-muted">de-CH, quiet symbol</dt>
            <dd className="text-end">
              <Money amount={98765.4} currency="CHF" locale="de-CH" quietCurrency />
            </dd>
            <dt className="text-fg-muted">pl-PL</dt>
            <dd className="text-end">
              <Money amount={-2500} currency="PLN" locale="pl-PL" tone="auto" />
            </dd>
          </dl>
        </Row>
      </Section>
    </div>
  );
}
