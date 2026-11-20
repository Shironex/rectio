'use client';

import { CheckCircleIcon, PencilSimpleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FileUpload,
  FileUploadTrigger,
  FormActions,
  FormSection,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  NumberField,
  Radio,
  RadioCard,
  RadioGroup,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SwitchField,
  Textarea,
  Toggle,
  ToggleGroup,
  cn,
  useToast,
} from '@rectio/ui';
import { useEffect, useState, type SubmitEvent } from 'react';

import { COMPANY, LOCALE } from '@/data/company';
import { MODES, THEMES } from '../appearance-script';
import { PageHeader } from '../page-header';
import { setAppearance, useAppearance } from '../use-appearance';
import { usePageState } from '../use-page-state';
import { TeamSection } from './team-section';

const SECTIONS = [
  { id: 'company', label: 'Company profile' },
  { id: 'invoicing', label: 'Invoicing defaults' },
  { id: 'team', label: 'Team members' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'appearance', label: 'Appearance' },
] as const;

const CURRENCIES = [
  { value: 'EUR', label: 'Euro' },
  { value: 'GBP', label: 'Pound sterling' },
  { value: 'USD', label: 'US dollar' },
  { value: 'CHF', label: 'Swiss franc' },
  { value: 'SEK', label: 'Swedish krona' },
];

const VAT_RATES = [
  { value: '0.23', label: 'Standard, 23%' },
  { value: '0.135', label: 'Reduced, 13.5%' },
  { value: '0.09', label: 'Second reduced, 9%' },
  { value: '0', label: 'Zero rated or reverse charge' },
];

/** An Irish VAT number: IE, seven digits and one or two letters (spaces allowed). */
const VAT_NUMBER = /^IE\s?\d{7}[A-Z]{1,2}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MB = 1024 * 1024;

const sectionClass = 'scroll-mt-24 p-5 sm:p-8';

/**
 * The section list beside the form. The section in view is marked current: a band across the
 * upper part of the window decides which one that is, so a short last section still gets its turn.
 */
function SectionNav() {
  const [current, setCurrent] = useState<string>(SECTIONS[0].id);
  useEffect(() => {
    const sections = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const observer = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting);
        const top = seen.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top !== undefined) setCurrent(top.target.id);
      },
      { rootMargin: '-20% 0px -60% 0px' },
    );
    for (const section of sections) observer.observe(section);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <nav aria-label="Settings sections" className="lg:sticky lg:top-24 max-lg:hidden">
      <ul className="flex flex-col gap-0.5">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={current === s.id ? 'location' : undefined}
              onClick={() => {
                setCurrent(s.id);
              }}
              className="block rounded-control px-3 py-2 text-sm text-fg-muted hover:bg-surface-hover hover:text-fg focus-visible:outline-2 focus-visible:outline-focus aria-[current=location]:bg-surface-hover aria-[current=location]:font-medium aria-[current=location]:text-fg"
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Marks the fields the form cannot save without. */
function RequiredMark() {
  return <span className="text-sm font-regular text-fg-subtle">Required</span>;
}

/** Scrolls to the first field with an error and puts the cursor in it. */
function focusFirstInvalid(form: HTMLFormElement) {
  const field = form.querySelector<HTMLElement>('[aria-invalid="true"]');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  field?.scrollIntoView({ block: 'center', behavior: still ? 'auto' : 'smooth' });
  field?.focus({ preventScroll: true });
}

function AppearanceSection() {
  const { theme, mode } = useAppearance();
  return (
    <FormSection
      id="appearance"
      className={sectionClass}
      title="Appearance"
      description="Only for you, on this device. Applied as soon as you choose."
    >
      <RadioGroup
        legend="Theme"
        value={theme}
        onValueChange={(value) => {
          const next = THEMES.find((t) => t.value === value);
          if (next !== undefined) setAppearance({ theme: next.value });
        }}
        className="grid gap-3 sm:grid-cols-2"
      >
        {THEMES.map((t) => (
          <RadioCard key={t.value} value={t.value} title={t.label} description={t.description} />
        ))}
      </RadioGroup>
      <ToggleGroup
        legend="Mode"
        value={[mode]}
        onValueChange={(value) => {
          const next = MODES.find((m) => m.value === value[0]);
          if (next !== undefined) setAppearance({ mode: next.value });
        }}
      >
        {MODES.map((m) => (
          <Toggle key={m.value} value={m.value}>
            {m.label}
          </Toggle>
        ))}
      </ToggleGroup>
    </FormSection>
  );
}

/**
 * Settings for the organisation and the signed-in user. The form checks itself before saving;
 * `?state=invalid` opens it with every error showing. Replace `save` with your API call.
 */
export function SettingsPage() {
  const state = usePageState();
  // Keyed by the state, so ?state=invalid seeds the form once the URL is read after hydration.
  return <SettingsForm key={state} forceInvalid={state === 'invalid'} />;
}

function SettingsForm({ forceInvalid }: { forceInvalid: boolean }) {
  const toast = useToast();
  const [name, setName] = useState(forceInvalid ? '' : COMPANY.name);
  const [taxId, setTaxId] = useState(forceInvalid ? 'IE 34128' : COMPANY.taxId);
  const [email, setEmail] = useState(forceInvalid ? 'accounts@fernhill' : COMPANY.email);
  const [prefix, setPrefix] = useState(forceInvalid ? 'INV 2026' : 'INV-2026-');
  const [tried, setTried] = useState(forceInvalid);
  const [dirty, setDirty] = useState(false);

  const errors = {
    name: name.trim() === '' ? 'Enter the company name.' : null,
    taxId: VAT_NUMBER.test(taxId.trim())
      ? null
      : 'Use the Irish format: IE, seven digits and one or two letters.',
    email: EMAIL.test(email.trim()) ? null : 'Enter an email address with a domain, such as .ie.',
    prefix: /^[A-Z0-9-]{1,12}$/i.test(prefix)
      ? null
      : 'Letters, numbers and hyphens only, up to 12 characters.',
  };
  const show = (key: keyof typeof errors) => (tried ? errors[key] : null);
  const problems = Object.values(errors).filter((e) => e !== null).length;
  const failing = tried && problems > 0;

  const save = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTried(true);
    if (problems > 0) {
      focusFirstInvalid(event.currentTarget);
      return;
    }
    setDirty(false);
    toast.add({ type: 'success', title: 'Settings saved' });
  };

  return (
    <>
      <PageHeader title="Settings" description={`${COMPANY.legalName}, ${COMPANY.registration}`} />
      <div className="grid items-start gap-8 lg:grid-cols-4">
        <SectionNav />
        <form
          noValidate
          onSubmit={save}
          onChange={() => {
            setDirty(true);
          }}
          className="flex flex-col divide-y divide-line rounded-panel border border-line bg-surface lg:col-span-3"
        >
          <FormSection
            id="company"
            className={sectionClass}
            title="Company profile"
            description="Printed on every invoice and statement you send."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field invalid={show('name') !== null}>
                <FieldLabel>
                  Company name <RequiredMark />
                </FieldLabel>
                <Input
                  required
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                  }}
                  autoComplete="organization"
                />
                <FieldError>{show('name')}</FieldError>
              </Field>
              <Field>
                <FieldLabel>Legal name</FieldLabel>
                <Input defaultValue={COMPANY.legalName} />
              </Field>
              <Field invalid={show('taxId') !== null}>
                <FieldLabel>
                  VAT number <RequiredMark />
                </FieldLabel>
                <Input
                  required
                  value={taxId}
                  onChange={(event) => {
                    setTaxId(event.target.value);
                  }}
                  className="numeric"
                />
                <FieldError>{show('taxId')}</FieldError>
              </Field>
              <Field invalid={show('email') !== null}>
                <FieldLabel>
                  Billing email <RequiredMark />
                </FieldLabel>
                <Input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                  }}
                  autoComplete="email"
                />
                <FieldDescription>Customers reply to this address.</FieldDescription>
                <FieldError>{show('email')}</FieldError>
              </Field>
            </div>
            <Field>
              <FieldLabel>Registered address</FieldLabel>
              <Textarea defaultValue={COMPANY.address.join('\n')} minRows={3} maxRows={5} />
            </Field>
            <Field>
              <FieldLabel optional>Logo</FieldLabel>
              <FileUpload accept="image/png,image/svg+xml" maxSize={2 * MB} multiple={false}>
                <FileUploadTrigger>Upload logo</FileUploadTrigger>
              </FileUpload>
              <FieldDescription>
                PNG or SVG, up to 2 MB. Shown top left on invoices.
              </FieldDescription>
            </Field>
          </FormSection>

          <FormSection
            id="invoicing"
            className={sectionClass}
            title="Invoicing defaults"
            description="New invoices start with these. Invoices already sent keep their own."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Currency</FieldLabel>
                <Select items={CURRENCIES} defaultValue="EUR">
                  <SelectTrigger />
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value} hint={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Payment terms</FieldLabel>
                <NumberField
                  defaultValue={30}
                  min={0}
                  max={120}
                  step={15}
                  locale={LOCALE}
                  format={{ style: 'unit', unit: 'day', unitDisplay: 'long' }}
                />
              </Field>
              <Field invalid={show('prefix') !== null}>
                <FieldLabel>
                  Number prefix <RequiredMark />
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    required
                    value={prefix}
                    onChange={(event) => {
                      setPrefix(event.target.value);
                    }}
                    className="numeric"
                  />
                  <InputGroupAddon align="end">
                    <span className="numeric">0217</span>
                  </InputGroupAddon>
                </InputGroup>
                <FieldDescription>The next invoice is numbered {prefix}0217.</FieldDescription>
                <FieldError>{show('prefix')}</FieldError>
              </Field>
              <Field>
                <FieldLabel>Default VAT rate</FieldLabel>
                <Select items={VAT_RATES} defaultValue="0.23">
                  <SelectTrigger />
                  <SelectContent>
                    {VAT_RATES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  EU business customers get reverse charge on their own.
                </FieldDescription>
              </Field>
            </div>
            <Field>
              <RadioGroup legend="Payment reminders" defaultValue="twice">
                <Radio value="off">Off</Radio>
                <Radio value="twice" description="3 and 17 days after the due date.">
                  Twice
                </Radio>
                <Radio value="weekly" description="Every Monday until the invoice is paid.">
                  Weekly
                </Radio>
              </RadioGroup>
            </Field>
            <Field>
              <FieldLabel optional>Footer note</FieldLabel>
              <Textarea
                defaultValue={`Pay by bank transfer to ${COMPANY.iban}, quoting the invoice number.`}
                maxLength={240}
                showCount
                minRows={2}
                maxRows={5}
              />
            </Field>
          </FormSection>

          <TeamSection forceInvalid={forceInvalid} />

          <FormSection
            id="notifications"
            className={sectionClass}
            title="Notifications"
            description="Email to you only. Each member chooses their own."
          >
            <div className="flex flex-col divide-y divide-line">
              <SwitchField
                fieldClassName="pb-3"
                label="Expenses waiting for me"
                description="Once a day at 9:00, only when something is waiting."
                defaultChecked
              />
              <SwitchField
                fieldClassName="py-3"
                label="Payments received"
                description="When a bank line is matched to an invoice."
                defaultChecked
              />
              <SwitchField
                fieldClassName="py-3"
                label="Invoices going overdue"
                description="The morning after the due date passes."
                defaultChecked
              />
              <SwitchField
                fieldClassName="pt-3"
                label="Weekly cash summary"
                description="Cash in, cash out and the bank balance, every Monday."
              />
            </div>
          </FormSection>

          <AppearanceSection />

          <FormActions
            align="between"
            className="sticky bottom-0 rounded-b-panel bg-surface p-4 sm:px-8"
          >
            <p
              role="status"
              className={cn(
                'flex min-w-0 flex-1 items-center gap-1.5 text-sm max-sm:basis-full',
                failing ? 'text-negative-strong' : 'text-fg-muted',
              )}
            >
              {failing ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="-ms-2 text-negative-strong"
                  onClick={(event) => {
                    const form = event.currentTarget.closest('form');
                    if (form !== null) focusFirstInvalid(form);
                  }}
                >
                  <WarningCircleIcon aria-hidden weight="bold" className="size-4 shrink-0" />
                  {`${String(problems)} ${problems === 1 ? 'field needs' : 'fields need'} attention`}
                  <span className="text-fg-muted">Go to the first</span>
                </Button>
              ) : (
                <>
                  {dirty ? (
                    <PencilSimpleIcon aria-hidden weight="bold" className="size-4 shrink-0" />
                  ) : (
                    <CheckCircleIcon aria-hidden weight="bold" className="size-4 shrink-0" />
                  )}
                  {dirty ? 'Unsaved changes' : 'All changes saved'}
                </>
              )}
            </p>
            <div className="ms-auto flex shrink-0 gap-2">
              <Button
                type="reset"
                variant="ghost"
                onClick={() => {
                  setName(COMPANY.name);
                  setTaxId(COMPANY.taxId);
                  setEmail(COMPANY.email);
                  setPrefix('INV-2026-');
                  setTried(false);
                  setDirty(false);
                }}
              >
                Discard
              </Button>
              <Button type="submit">Save changes</Button>
            </div>
          </FormActions>
        </form>
      </div>
    </>
  );
}
