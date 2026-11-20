'use client';

import { WarningCircleIcon } from '@phosphor-icons/react';
import {
  Alert,
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
  FileDropzone,
  FileItem,
  FileList,
  FileUpload,
  FormActions,
  FormSection,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SwitchField,
  Toggle,
  ToggleGroup,
  useFileUpload,
  useToast,
} from '@rectio/ui';
import { useState, type SubmitEvent } from 'react';

import { WORKSPACE } from '@/data/workspace';
import { usePageState } from '../use-page-state';
import { SettingsFrame } from './settings-frame';

const LANGUAGES = [
  { value: 'en-US', label: 'English (United States)' },
  { value: 'en-GB', label: 'English (United Kingdom)' },
  { value: 'es-US', label: 'Spanish (United States)' },
  { value: 'fr-CA', label: 'French (Canada)' },
];

const ZONES = [
  { value: 'America/New_York', label: 'Eastern time, New York' },
  { value: 'America/Chicago', label: 'Central time, Chicago' },
  { value: 'America/Denver', label: 'Mountain time, Denver' },
  { value: 'America/Los_Angeles', label: 'Pacific time, Los Angeles' },
];

const DAYS = [
  { value: 'mon', label: 'Mon', name: 'Monday' },
  { value: 'tue', label: 'Tue', name: 'Tuesday' },
  { value: 'wed', label: 'Wed', name: 'Wednesday' },
  { value: 'thu', label: 'Thu', name: 'Thursday' },
  { value: 'fri', label: 'Fri', name: 'Friday' },
  { value: 'sat', label: 'Sat', name: 'Saturday' },
  { value: 'sun', label: 'Sun', name: 'Sunday' },
];

const HOURS = Array.from({ length: 24 }, (_, h) => ({
  value: String(h),
  label: new Intl.DateTimeFormat('en-US', { hour: 'numeric' }).format(new Date(2026, 0, 1, h)),
}));

const SUBDOMAIN = /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])$/;

/**
 * Save the workspace here: send the values to your API and resolve once stored. The sample waits
 * a moment so the saving state shows.
 */
async function saveWorkspace(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 600));
}

export function WorkspaceSettingsPage() {
  const state = usePageState();
  // Keyed by the state, so ?state=invalid seeds the form once the URL is read after hydration.
  return <WorkspaceForm key={state} invalid={state === 'invalid'} />;
}

function WorkspaceForm({ invalid }: { invalid: boolean }) {
  const toast = useToast();
  const [name, setName] = useState(invalid ? '' : WORKSPACE.name);
  const [subdomain, setSubdomain] = useState(invalid ? 'Copper Line' : WORKSPACE.subdomain);
  const [language, setLanguage] = useState('en-US');
  const [zone, setZone] = useState('America/New_York');
  const [days, setDays] = useState(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [opens, setOpens] = useState('7');
  const [closes, setCloses] = useState(invalid ? '6' : '19');
  const [autoReply, setAutoReply] = useState(true);
  const [tried, setTried] = useState(invalid);
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState('');
  const values = { name, subdomain, language, zone, days, opens, closes, autoReply };
  // What was last saved, so Save only wakes up once something changed.
  const [saved, setSaved] = useState<typeof values>(() => ({
    name: WORKSPACE.name,
    subdomain: WORKSPACE.subdomain,
    language: 'en-US',
    zone: 'America/New_York',
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    opens: '7',
    closes: '19',
    autoReply: true,
  }));
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);
  const discard = () => {
    setName(saved.name);
    setSubdomain(saved.subdomain);
    setLanguage(saved.language);
    setZone(saved.zone);
    setDays(saved.days);
    setOpens(saved.opens);
    setCloses(saved.closes);
    setAutoReply(saved.autoReply);
    setTried(false);
  };
  const logo = useFileUpload({ multiple: false });

  const errors = {
    name: name.trim() === '' ? 'Enter the workspace name your customers see.' : null,
    subdomain: SUBDOMAIN.test(subdomain)
      ? null
      : 'Use 3 to 32 lowercase letters, numbers and hyphens, such as copperline.',
    days: days.length === 0 ? 'Choose at least one day the desk is open.' : null,
    hours: Number(closes) <= Number(opens) ? 'The desk must close after it opens.' : null,
  };
  const count = Object.values(errors).filter((e) => e !== null).length;
  const show = (key: keyof typeof errors) => (tried ? errors[key] : null);

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setTried(true);
    const form = event.currentTarget;
    if (count > 0) {
      requestAnimationFrame(() => {
        form.querySelector<HTMLElement>('[aria-invalid="true"], [data-invalid] input')?.focus();
      });
      return;
    }
    setPending(true);
    await saveWorkspace();
    setPending(false);
    setSaved(values);
    setTried(false);
    toast.add({ type: 'success', title: 'Workspace saved' });
  };

  return (
    <SettingsFrame
      title="Workspace"
      description="What customers see on the help center, and when the desk is open"
    >
      <form
        noValidate
        onSubmit={(event) => {
          void submit(event);
        }}
        className="flex flex-col gap-8"
      >
        {tried && count > 0 && (
          <Alert
            tone="danger"
            icon={<WarningCircleIcon aria-hidden weight="bold" />}
            title={count === 1 ? 'One field needs a fix' : `${String(count)} fields need a fix`}
          >
            Nothing was saved. The fields are marked below.
          </Alert>
        )}
        <FormSection
          title="General"
          description="The name and address customers see on emails and the help center."
        >
          <Field invalid={show('name') !== null}>
            <FieldLabel>Workspace name</FieldLabel>
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value);
              }}
              autoComplete="organization"
            />
            <FieldError>{show('name')}</FieldError>
          </Field>
          <Field invalid={show('subdomain') !== null}>
            <FieldLabel>Help center address</FieldLabel>
            <InputGroup>
              <InputGroupAddon>https://</InputGroupAddon>
              <InputGroupInput
                value={subdomain}
                onChange={(event) => {
                  setSubdomain(event.target.value);
                }}
                spellCheck={false}
                autoCapitalize="none"
                className="numeric"
              />
              <InputGroupAddon align="end">.lindwell.help</InputGroupAddon>
            </InputGroup>
            <FieldDescription>
              Or point your own domain, such as {WORKSPACE.helpCenter}, at it.
            </FieldDescription>
            <FieldError>{show('subdomain')}</FieldError>
          </Field>
          <Field>
            <FieldLabel>Default language</FieldLabel>
            <Select
              items={LANGUAGES}
              value={language}
              onValueChange={(value) => {
                if (value !== null) setLanguage(value);
              }}
            >
              <SelectTrigger />
              <SelectContent>
                {LANGUAGES.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FormSection>
        <FormSection
          title="Business hours"
          description="Response targets only count down while the desk is open."
        >
          <Field>
            <FieldLabel>Time zone</FieldLabel>
            <Select
              items={ZONES}
              value={zone}
              onValueChange={(value) => {
                if (value !== null) setZone(value);
              }}
            >
              <SelectTrigger />
              <SelectContent>
                {ZONES.map((z) => (
                  <SelectItem key={z.value} value={z.value}>
                    {z.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field invalid={show('days') !== null}>
            <ToggleGroup
              legend="Open on"
              multiple
              value={days}
              onValueChange={(value: string[]) => {
                setDays(value);
              }}
              className="flex-wrap"
            >
              {DAYS.map((d) => (
                <Toggle key={d.value} value={d.value} aria-label={d.name}>
                  {d.label}
                </Toggle>
              ))}
            </ToggleGroup>
            <FieldError>{show('days')}</FieldError>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Opens</FieldLabel>
              <Select
                items={HOURS}
                value={opens}
                onValueChange={(value) => {
                  if (value !== null) setOpens(value);
                }}
              >
                <SelectTrigger />
                <SelectContent>
                  {HOURS.map((h) => (
                    <SelectItem key={h.value} value={h.value}>
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field invalid={show('hours') !== null}>
              <FieldLabel>Closes</FieldLabel>
              <Select
                items={HOURS}
                value={closes}
                onValueChange={(value) => {
                  if (value !== null) setCloses(value);
                }}
              >
                <SelectTrigger aria-invalid={show('hours') !== null || undefined} />
                <SelectContent>
                  {HOURS.map((h) => (
                    <SelectItem key={h.value} value={h.value}>
                      {h.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{show('hours')}</FieldError>
            </Field>
          </div>
          <SwitchField
            label="Reply automatically out of hours"
            description="Tells customers when the desk opens again and links the help center."
            checked={autoReply}
            onCheckedChange={setAutoReply}
          />
        </FormSection>
        <FormSection title="Logo" description="Shown on the help center and in email footers.">
          <Field>
            <FieldLabel optional>Logo</FieldLabel>
            <FileUpload {...logo.rootProps} accept=".png,.svg" maxSize={2 * 1024 * 1024}>
              {logo.files.length === 0 ? (
                <FileDropzone />
              ) : (
                <FileList aria-label="Logo">
                  {logo.files.map((file) => (
                    <FileItem key={file.id} file={file} />
                  ))}
                </FileList>
              )}
            </FileUpload>
            <FieldDescription>PNG or SVG, up to 2 MB, at least 240 pixels wide.</FieldDescription>
          </Field>
        </FormSection>
        <FormActions align="between">
          <span className="text-sm text-fg-muted" aria-live="polite">
            {dirty ? 'You have unsaved changes' : 'All changes saved'}
          </span>
          {dirty && (
            <Button variant="ghost" onClick={discard}>
              Discard
            </Button>
          )}
          <Button type="submit" loading={pending} disabled={!dirty && !tried}>
            {pending ? 'Saving' : 'Save changes'}
          </Button>
        </FormActions>
      </form>
      <FormSection
        title="Delete the workspace"
        description="Removes every ticket, customer and file for good. Export first if you need a copy."
        className="border-t border-line pt-8"
      >
        <div>
          <Dialog
            onOpenChange={(open) => {
              if (!open) setConfirm('');
            }}
          >
            <DialogTrigger render={<Button variant="danger" />}>Delete workspace</DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Delete {WORKSPACE.name}?</DialogTitle>
                <DialogDescription>
                  Everyone loses access at once and the help center goes offline. This cannot be
                  undone.
                </DialogDescription>
              </DialogHeader>
              <DialogBody>
                <Field>
                  <FieldLabel>Type {WORKSPACE.name} to confirm</FieldLabel>
                  <Input
                    value={confirm}
                    onChange={(event) => {
                      setConfirm(event.target.value);
                    }}
                    autoComplete="off"
                  />
                </Field>
              </DialogBody>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" />}>Keep the workspace</DialogClose>
                <DialogClose
                  render={<Button variant="danger" disabled={confirm !== WORKSPACE.name} />}
                  onClick={() => {
                    toast.add({
                      title: 'Deletion scheduled',
                      description: 'You have 7 days to change your mind.',
                    });
                  }}
                >
                  Delete for good
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </FormSection>
    </SettingsFrame>
  );
}
