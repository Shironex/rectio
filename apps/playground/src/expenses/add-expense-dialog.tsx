import { PlusIcon } from '@phosphor-icons/react';
import {
  DatePicker,
  DialogBody,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectGroup,
  SelectTrigger,
} from '@rectio/ui';
import { useRef, useState, type KeyboardEvent, type SyntheticEvent } from 'react';

import { CATEGORIES, type Expense } from './data';
import { useKit } from './kit';

const GROUPS = ['Travel', 'Meals', 'Tools'] as const;
const ITEMS = CATEGORIES.map((c) => ({ value: c.value, label: c.label }));
const SAVE_DELAY_MS = 700;
const LOCALE = 'en-IE';
/** New lines default to the last day the report covers so far; the field changes it. */
const DEFAULT_DATE = new Date(2026, 2, 19);
const IS_APPLE = /Mac|iPhone|iPad/.test(navigator.userAgent);
const KBD =
  'rounded-badge border border-line bg-surface px-1.5 py-0.5 font-sans text-xs text-fg-muted';

interface Draft {
  date: Date | null;
  merchant: string;
  amount: number | null;
  category: string | null;
  note: string;
}

type Errors = Partial<Record<'date' | 'merchant' | 'amount' | 'category', string>>;

const EMPTY: Draft = { date: DEFAULT_DATE, merchant: '', amount: null, category: null, note: '' };

function validate(draft: Draft): Errors {
  const errors: Errors = {};
  if (draft.date === null) errors.date = 'Enter the date as dd/mm/yyyy.';
  if (draft.merchant.trim() === '') errors.merchant = 'Enter the merchant name.';
  if (draft.amount === null || draft.amount <= 0) errors.amount = 'Enter an amount above 0.00.';
  if (draft.category === null) errors.category = 'Choose a category.';
  return errors;
}

export function AddExpenseDialog({ onAdd }: { onAdd: (expense: Expense) => void }) {
  const { AmountInput, Button, Dialog, DialogContent, DialogTrigger, SelectContent, SelectItem } =
    useKit();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  /**
   * A field the user has changed re-checks itself on blur, so errors show before Save. An untouched
   * field does not: blurring it toward Save would insert an error line and move the button away
   * from the pointer mid-click.
   */
  const [dirty, setDirty] = useState<ReadonlySet<keyof Draft>>(new Set());
  const checkOnBlur = (key: keyof Errors) => () => {
    if (!dirty.has(key)) return;
    const message = validate(draft)[key];
    setErrors((e) => ({ ...e, [key]: message }));
  };

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDirty((d) => new Set(d).add(key));
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  /** Closing keeps the draft, so Escape or a stray click outside never throws typing away. */
  const onOpenChange = (next: boolean) => {
    if (saving) return;
    setOpen(next);
  };

  const reset = () => {
    setDirty(new Set());
    setDraft(EMPTY);
    setErrors({});
  };

  /**
   * A saved draft is cleared once the dialog has finished closing, never during its exit: emptying
   * the fields while the popup still fades or springs away flashes a blank form.
   */
  const saved = useRef(false);
  const onOpenChangeComplete = (isOpen: boolean) => {
    if (isOpen || !saved.current) return;
    saved.current = false;
    reset();
  };

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validate(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Take the user to the first problem; its message is read out with the field.
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
      return;
    }
    setSaving(true);
    window.setTimeout(() => {
      onAdd({
        id: crypto.randomUUID(),
        date: draft.date ?? DEFAULT_DATE,
        merchant: draft.merchant.trim(),
        category: draft.category ?? 'office',
        note: draft.note.trim() === '' ? undefined : draft.note.trim(),
        amount: draft.amount ?? 0,
        status: 'draft',
      });
      saved.current = true;
      setSaving(false);
      setOpen(false);
    }, SAVE_DELAY_MS);
  };

  /** Ctrl or Cmd + Enter saves from any field, the way finance tools let power users move fast. */
  const onKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      event.currentTarget.requestSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <DialogTrigger render={<Button />}>
        <PlusIcon aria-hidden weight="bold" className="size-4" />
        Add expense
      </DialogTrigger>
      <DialogContent>
        <form ref={formRef} noValidate onSubmit={onSubmit} onKeyDown={onKeyDown}>
          <DialogHeader>
            <DialogTitle>Add expense</DialogTitle>
            <DialogDescription>Goes into the March report as a draft line.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field invalid={errors.merchant !== undefined}>
              <FieldLabel>Merchant</FieldLabel>
              <Input
                autoFocus
                onBlur={checkOnBlur('merchant')}
                value={draft.merchant}
                onValueChange={(value) => {
                  update('merchant', value);
                }}
              />
              <FieldDescription>As printed on the receipt.</FieldDescription>
              {errors.merchant !== undefined && <FieldError>{errors.merchant}</FieldError>}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field invalid={errors.date !== undefined}>
                <FieldLabel>Date</FieldLabel>
                <DatePicker
                  locale={LOCALE}
                  value={draft.date}
                  onValueChange={(value) => {
                    update('date', value);
                  }}
                  disabledDays={{ after: new Date(2026, 2, 31) }}
                />
                <FieldDescription>Up to 31 Mar, the report's last day.</FieldDescription>
                {errors.date !== undefined && <FieldError>{errors.date}</FieldError>}
              </Field>
              <Field invalid={errors.amount !== undefined}>
                <FieldLabel>Amount, EUR</FieldLabel>
                <AmountInput
                  onBlur={checkOnBlur('amount')}
                  currency="EUR"
                  locale="en-IE"
                  value={draft.amount}
                  onValueChange={(value) => {
                    update('amount', value);
                  }}
                />
                {errors.amount !== undefined && <FieldError>{errors.amount}</FieldError>}
              </Field>
              <Field invalid={errors.category !== undefined} className="sm:col-span-2">
                <FieldLabel>Category</FieldLabel>
                <Select
                  items={ITEMS}
                  value={draft.category}
                  onValueChange={(value) => {
                    update('category', value);
                  }}
                >
                  <SelectTrigger placeholder="Choose a category" />
                  <SelectContent>
                    {GROUPS.map((group) => (
                      <SelectGroup key={group} label={group}>
                        {CATEGORIES.filter((c) => c.group === group).map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category !== undefined && <FieldError>{errors.category}</FieldError>}
              </Field>
            </div>
            <Field>
              <FieldLabel optional>Note</FieldLabel>
              <Input
                value={draft.note}
                onValueChange={(value) => {
                  update('note', value);
                }}
              />
              <FieldDescription>Who attended, or what it was for.</FieldDescription>
            </Field>
          </DialogBody>
          <DialogFooter>
            <p className="me-auto hidden items-center gap-1 text-sm text-fg-subtle sm:flex">
              <kbd className={KBD}>{IS_APPLE ? '⌘ Enter' : 'Ctrl Enter'}</kbd>
              <span className="ms-1">to save</span>
            </p>
            {dirty.size > 0 && (
              <Button variant="ghost" disabled={saving} onClick={reset}>
                Clear
              </Button>
            )}
            <DialogClose render={<Button variant="ghost" disabled={saving} />}>Cancel</DialogClose>
            <Button type="submit" loading={saving}>
              Save expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
