import { PlusIcon } from '@phosphor-icons/react';
import {
  AmountInput,
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from '@rectio/ui';
import { useRef, useState, type KeyboardEvent, type SyntheticEvent } from 'react';

import { CATEGORIES, type Expense } from './data';

const GROUPS = ['Travel', 'Meals', 'Tools'] as const;
const ITEMS = CATEGORIES.map((c) => ({ value: c.value, label: c.label }));
const SAVE_DELAY_MS = 700;
const IS_APPLE = /Mac|iPhone|iPad/.test(navigator.userAgent);
const KBD =
  'rounded-badge border border-line bg-surface px-1.5 py-0.5 font-sans text-xs text-fg-muted';

interface Draft {
  merchant: string;
  amount: number | null;
  category: string | null;
  note: string;
}

type Errors = Partial<Record<'merchant' | 'amount' | 'category', string>>;

const EMPTY: Draft = { merchant: '', amount: null, category: null, note: '' };

function validate(draft: Draft): Errors {
  const errors: Errors = {};
  if (draft.merchant.trim() === '') errors.merchant = 'Enter the merchant name.';
  if (draft.amount === null || draft.amount <= 0)
    errors.amount = 'Enter an amount above zero, such as 129.40.';
  if (draft.category === null) errors.category = 'Choose a category.';
  return errors;
}

export function AddExpenseDialog({ onAdd }: { onAdd: (expense: Expense) => void }) {
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

  const onOpenChange = (next: boolean) => {
    if (saving) return;
    setOpen(next);
    if (!next) {
      setDirty(new Set());
      setDraft(EMPTY);
      setErrors({});
    }
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
        date: '19 Mar',
        merchant: draft.merchant.trim(),
        category: draft.category ?? 'office',
        note: draft.note.trim() === '' ? undefined : draft.note.trim(),
        amount: draft.amount ?? 0,
      });
      setSaving(false);
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button />}>
        <PlusIcon aria-hidden weight="bold" className="size-4" />
        Add expense
      </DialogTrigger>
      <DialogContent>
        <form ref={formRef} noValidate onSubmit={onSubmit} onKeyDown={onKeyDown}>
          <DialogHeader>
            <DialogTitle>Add expense</DialogTitle>
            <DialogDescription>Goes into the March report for review.</DialogDescription>
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
                placeholder="As on the receipt"
              />
              {errors.merchant !== undefined && <FieldError>{errors.merchant}</FieldError>}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
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
              <Field invalid={errors.category !== undefined}>
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
              <FieldLabel>Note</FieldLabel>
              <Input
                value={draft.note}
                onValueChange={(value) => {
                  update('note', value);
                }}
              />
              <FieldDescription>Optional. Who attended, or what it was for.</FieldDescription>
            </Field>
          </DialogBody>
          <DialogFooter>
            <p className="me-auto hidden items-center gap-1 text-sm text-fg-subtle sm:flex">
              <kbd className={KBD}>{IS_APPLE ? '⌘' : 'Ctrl'}</kbd>
              <kbd className={KBD}>Enter</kbd>
              <span className="ms-1">to save</span>
            </p>
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
