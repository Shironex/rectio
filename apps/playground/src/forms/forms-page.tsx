import { CopyIcon } from '@phosphor-icons/react';
import * as moving from '@rectio/motion';
import * as ui from '@rectio/ui';
import {
  Combobox,
  ComboboxInput,
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
  InputGroupButton,
  InputGroupInput,
  OtpInput,
  Radio,
  RadioCard,
  RadioGroup,
  SearchInput,
  Select,
  SelectTrigger,
  Slider,
  TagInput,
  Textarea,
  ThemeScope,
  Toggle,
  useFileUpload,
  type FileUploadEntry,
  type FileUploadTask,
} from '@rectio/ui';
import { useState } from 'react';

import { usePageCanvas } from '../page-canvas';
import type { Mode, ThemeId } from '../themes';
import { CURRENCIES, MEMBERS, RECEIPTS, TIME_ZONES, type Member, type TimeZone } from './data';

/**
 * The parts that have a motioned twin, picked by `&motion=on`. An app picks per component by its
 * import path; the playground swaps them together to judge one screen both ways.
 */
const PLAIN = {
  Button: ui.Button,
  Switch: ui.Switch,
  SwitchField: ui.SwitchField,
  ToggleGroup: ui.ToggleGroup,
  NumberField: ui.NumberField,
  SelectContent: ui.SelectContent,
  SelectItem: ui.SelectItem,
  ComboboxContent: ui.ComboboxContent,
  ComboboxItem: ui.ComboboxItem,
  MultiSelect: ui.MultiSelect,
  MultiSelectInput: ui.MultiSelectInput,
  MultiSelectContent: ui.MultiSelectContent,
  MultiSelectItem: ui.MultiSelectItem,
  FileDropzone: ui.FileDropzone,
  FileList: ui.FileList,
  FileItem: ui.FileItem,
};
type Kit = typeof PLAIN;
const MOTION: Kit = {
  Button: moving.Button,
  Switch: moving.Switch,
  SwitchField: moving.SwitchField,
  ToggleGroup: moving.ToggleGroup,
  NumberField: moving.NumberField,
  SelectContent: moving.SelectContent,
  SelectItem: moving.SelectItem,
  ComboboxContent: moving.ComboboxContent,
  ComboboxItem: moving.ComboboxItem,
  MultiSelect: moving.MultiSelect,
  MultiSelectInput: moving.MultiSelectInput,
  MultiSelectContent: moving.MultiSelectContent,
  MultiSelectItem: moving.MultiSelectItem,
  FileDropzone: moving.FileDropzone,
  FileList: moving.FileList,
  FileItem: moving.FileItem,
};

const MB = 1024 * 1024;
const EUR = { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 } as const;

function readParams(search: string) {
  const params = new URLSearchParams(search);
  return {
    compact: params.get('density') === 'compact',
    invalid: params.get('invalid') === '1',
  };
}

/** Pretends to send a file: progress in steps, and files over 4 MB fail once so Retry shows. */
function fakeUpload(file: File, { onProgress, signal }: FileUploadTask) {
  return new Promise<void>((resolve, reject) => {
    let percent = 0;
    const timer = setInterval(() => {
      percent += 20;
      onProgress(percent);
      if (file.size > 4 * MB && percent >= 60) {
        clearInterval(timer);
        reject(new Error('The connection dropped. Try again.'));
      } else if (percent >= 100) {
        clearInterval(timer);
        resolve();
      }
    }, 300);
    signal.addEventListener('abort', () => {
      clearInterval(timer);
    });
  });
}

export function FormsPage({
  theme,
  mode,
  motion,
}: {
  theme: ThemeId;
  mode: Mode;
  motion: boolean;
}) {
  const { compact, invalid } = readParams(window.location.search);
  const canvas = usePageCanvas(theme, mode);
  return (
    <ThemeScope
      ref={canvas}
      theme={theme}
      mode={mode}
      density={compact ? 'compact' : 'comfortable'}
      className="min-h-dvh bg-surface-canvas"
    >
      <SettingsForm kit={motion ? MOTION : PLAIN} invalid={invalid} />
    </ThemeScope>
  );
}

function SettingsForm({ kit, invalid }: { kit: Kit; invalid: boolean }) {
  const k = kit;
  const [timeZones, setTimeZones] = useState<TimeZone[]>(TIME_ZONES);
  const [timeZone, setTimeZone] = useState<TimeZone | null>(TIME_ZONES[2] ?? null);
  const [dirty, setDirty] = useState(false);
  const [notify, setNotify] = useState<Member[]>(invalid ? [] : MEMBERS.slice(0, 2));
  const receipts = useFileUpload({
    upload: fakeUpload,
    initialFiles: RECEIPTS satisfies FileUploadEntry[],
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 sm:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-fg-muted">Northwind Traders</p>
          <h1 className="font-display text-3xl font-heading tracking-tight">Workspace settings</h1>
        </div>
        <Field className="w-full sm:w-72">
          <FieldLabel className="sr-only">Search settings</FieldLabel>
          <SearchInput placeholder="Search settings" shortcut="/" globalShortcut />
        </Field>
      </header>

      <form
        className="flex flex-col divide-y divide-line rounded-(--rx-popover-radius) border border-line bg-surface"
        onChange={() => {
          setDirty(true);
        }}
        onReset={() => {
          setDirty(false);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          setDirty(false);
        }}
      >
        <FormSection
          className="p-5 sm:p-8"
          title="Profile"
          description="How the workspace appears to members and on documents you send."
        >
          <Field invalid={invalid}>
            <FieldLabel>Workspace name</FieldLabel>
            <Input defaultValue={invalid ? '' : 'Northwind Traders'} />
            <FieldError>Enter a workspace name.</FieldError>
          </Field>
          <Field invalid={invalid}>
            <FieldLabel>Workspace address</FieldLabel>
            <InputGroup>
              <InputGroupAddon>https://</InputGroupAddon>
              <InputGroupInput defaultValue={invalid ? 'north wind' : 'northwind'} />
              <InputGroupAddon align="end">.rectio.app</InputGroupAddon>
            </InputGroup>
            <FieldDescription>Letters, numbers and hyphens.</FieldDescription>
            <FieldError>Spaces are not allowed in an address.</FieldError>
          </Field>
          <Field>
            <FieldLabel optional>About</FieldLabel>
            <Textarea
              defaultValue="Wholesale food distribution across Poland and the Baltics."
              maxLength={160}
              showCount
              minRows={2}
              maxRows={6}
            />
            <FieldDescription>Shown on invoices and the member invite page.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel optional>Logo</FieldLabel>
            <FileUpload accept="image/png,image/svg+xml" maxSize={2 * MB} multiple={false}>
              <FileUploadTrigger>Upload logo</FileUploadTrigger>
            </FileUpload>
            <FieldDescription>PNG or SVG, up to 2 MB. Square works best.</FieldDescription>
          </Field>
        </FormSection>

        <FormSection
          className="p-5 sm:p-8"
          title="Region and currency"
          description="Dates, reports and new invoices follow these. Existing documents keep theirs."
        >
          <Field>
            <FieldLabel>Time zone</FieldLabel>
            <Combobox
              items={timeZones}
              value={timeZone}
              onValueChange={setTimeZone}
              itemToStringLabel={(zone: TimeZone) => zone.label}
              onCreate={(query) => {
                const zone = { value: query, label: query, offset: '' };
                setTimeZones((list) => [...list, zone]);
                setTimeZone(zone);
              }}
            >
              <ComboboxInput placeholder="Search time zones" />
              <k.ComboboxContent>
                {(zone: TimeZone) => (
                  <k.ComboboxItem key={zone.value} value={zone} hint={zone.offset}>
                    {zone.label}
                  </k.ComboboxItem>
                )}
              </k.ComboboxContent>
            </Combobox>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Default currency</FieldLabel>
              <Select items={CURRENCIES} defaultValue="EUR">
                <SelectTrigger />
                <k.SelectContent>
                  {CURRENCIES.map((currency) => (
                    <k.SelectItem key={currency.value} value={currency.value} hint={currency.value}>
                      {currency.name}
                    </k.SelectItem>
                  ))}
                </k.SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Payment terms</FieldLabel>
              <k.NumberField
                defaultValue={30}
                min={0}
                max={120}
                step={15}
                locale="en-GB"
                format={{ style: 'unit', unit: 'day', unitDisplay: 'long' }}
              />
            </Field>
          </div>
          <k.ToggleGroup legend="Week starts on" defaultValue={['monday']}>
            <Toggle value="monday">Monday</Toggle>
            <Toggle value="sunday">Sunday</Toggle>
            <Toggle value="saturday">Saturday</Toggle>
          </k.ToggleGroup>
        </FormSection>

        <FormSection
          className="p-5 sm:p-8"
          title="Plan and seats"
          description="Billed to the card on file. Changes are prorated to the day."
        >
          <Field>
            <RadioGroup legend="Plan" defaultValue="team" className="grid gap-3 sm:grid-cols-3">
              <RadioCard
                value="starter"
                title="Starter"
                description="Up to 3 members, one entity."
                meta="€0"
              />
              <RadioCard
                value="team"
                title="Team"
                description="Approvals, audit log and exports."
                meta="€12"
              />
              <RadioCard
                value="scale"
                title="Scale"
                description="Single sign-on and SCIM."
                meta="€24"
              />
            </RadioGroup>
            <FieldDescription>Per member, per month, before VAT.</FieldDescription>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field invalid={invalid}>
              <FieldLabel>Seats</FieldLabel>
              <k.NumberField defaultValue={invalid ? 0 : 12} min={0} max={250} />
              <FieldDescription>14 members, 2 invited.</FieldDescription>
              <FieldError>At least one seat.</FieldError>
            </Field>
            <Field>
              <RadioGroup legend="Billing period" defaultValue="yearly">
                <Radio value="monthly">Monthly</Radio>
                <Radio value="yearly" description="Two months free.">
                  Yearly
                </Radio>
              </RadioGroup>
            </Field>
          </div>
        </FormSection>

        <FormSection
          className="p-5 sm:p-8"
          title="Spend policy"
          description="Rules every expense is checked against before it reaches an approver."
        >
          <Field>
            <Slider
              label="Second approver above"
              showValue
              marks
              defaultValue={2500}
              max={10000}
              step={250}
              format={EUR}
              locale="en-IE"
            />
            <FieldDescription>Expenses over this need two approvals.</FieldDescription>
          </Field>
          <Field>
            <Slider
              label="Card spend reviewed"
              showValue
              marks={[0, 2500, 5000, 7500, 10000]}
              defaultValue={[250, 5000]}
              max={10000}
              step={50}
              format={EUR}
              locale="en-IE"
              thumbLabels={['Lowest amount reviewed', 'Highest amount reviewed']}
            />
          </Field>
          <Field invalid={invalid}>
            <FieldLabel>Expense tags</FieldLabel>
            <TagInput
              defaultValue={invalid ? ['travel', 'client meals'] : ['travel', 'client', 'software']}
              placeholder="Add a tag"
              max={12}
            />
            <FieldDescription>Members pick from these on every expense.</FieldDescription>
            <FieldError>Tags cannot contain spaces: use client-meals.</FieldError>
          </Field>
          <Field>
            <FieldLabel optional>Policy documents</FieldLabel>
            <FileUpload {...receipts.rootProps} accept=".pdf,.png,.jpg" maxSize={10 * MB}>
              <k.FileDropzone />
              {receipts.files.length > 0 && (
                <k.FileList aria-label="Policy documents">
                  {receipts.files.map((file) => (
                    <k.FileItem key={file.id} file={file} />
                  ))}
                </k.FileList>
              )}
            </FileUpload>
            <FieldDescription>PDF, PNG or JPG, up to 10 MB each.</FieldDescription>
          </Field>
        </FormSection>

        <FormSection
          className="p-5 sm:p-8"
          title="Notifications"
          description="Email only. Each member can turn off what they receive in their profile."
        >
          <div className="flex flex-col divide-y divide-line">
            <k.SwitchField
              fieldClassName="pb-3"
              label="Approval requests"
              description="When an expense waits for you."
              defaultChecked
            />
            <k.SwitchField
              fieldClassName="py-3"
              label="Weekly digest"
              description="Spend by team, every Monday at 9:00."
              defaultChecked
            />
            <k.SwitchField
              fieldClassName="pt-3"
              label="Failed card payments"
              description="Sent at once, also by text message."
            />
          </div>
          <Field invalid={invalid}>
            <FieldLabel>Notify on changes</FieldLabel>
            <k.MultiSelect
              items={MEMBERS}
              value={notify}
              onValueChange={setNotify}
              itemToStringLabel={(member: Member) => member.label}
              selectAll
            >
              <k.MultiSelectInput placeholder="Add members" maxChips={3} />
              <k.MultiSelectContent>
                {(member: Member) => (
                  <k.MultiSelectItem key={member.value} value={member}>
                    {member.label}
                  </k.MultiSelectItem>
                )}
              </k.MultiSelectContent>
            </k.MultiSelect>
            <FieldDescription>Told when someone edits these settings.</FieldDescription>
            <FieldError>Add at least one member.</FieldError>
          </Field>
        </FormSection>

        <FormSection
          className="p-5 sm:p-8"
          title="Security"
          description="Turning on two-step sign-in asks every member to set it up at their next sign-in."
        >
          <Field invalid={invalid}>
            <FieldLabel>Verification code</FieldLabel>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <OtpInput groups={[3, 3]} defaultValue={invalid ? '111111' : ''} />
              <k.Button variant="secondary" type="button">
                Verify
              </k.Button>
            </div>
            <FieldDescription>From your authenticator app.</FieldDescription>
            <FieldError>That code has expired. Use the newest one.</FieldError>
          </Field>
          <Field>
            <FieldLabel>Recovery key</FieldLabel>
            <InputGroup>
              <InputGroupInput defaultValue="NW7Q-2K9D-PX4M-81ZC" readOnly className="font-mono" />
              <InputGroupAddon align="end">
                <InputGroupButton iconOnly aria-label="Copy recovery key">
                  <CopyIcon aria-hidden weight="bold" />
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
            <FieldDescription>Keep it somewhere safe. It is shown only here.</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Sign out idle members after</FieldLabel>
            <k.NumberField
              defaultValue={30}
              min={5}
              max={480}
              step={5}
              locale="en-GB"
              format={{ style: 'unit', unit: 'minute', unitDisplay: 'long' }}
              className="sm:max-w-56"
            />
          </Field>
        </FormSection>

        <FormActions
          align="between"
          className="sticky bottom-0 rounded-b-(--rx-popover-radius) bg-surface p-4 sm:px-8"
        >
          <p
            role="status"
            className={`min-w-0 flex-1 text-sm ${invalid ? 'text-negative-strong' : 'text-fg-muted'}`}
          >
            {invalid ? '7 fields need attention' : dirty ? 'Unsaved changes' : 'All changes saved'}
          </p>
          <div className="flex shrink-0 gap-2">
            <k.Button variant="ghost" type="reset">
              Discard
            </k.Button>
            <k.Button type="submit">Save changes</k.Button>
          </div>
        </FormActions>
      </form>
    </div>
  );
}
