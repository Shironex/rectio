'use client';

import { CheckIcon, CopyIcon, GlobeIcon } from '@phosphor-icons/react';
import {
  Field,
  FieldDescription,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@rectio/ui';
import { useState } from 'react';

const WEBHOOK = 'https://hooks.northwind.io/rectio/inv_7Hq2';

export default function InputGroupDemo() {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex w-full max-w-sm flex-col gap-5">
      <Field>
        <FieldLabel>Company website</FieldLabel>
        <InputGroup>
          <InputGroupAddon>https://</InputGroupAddon>
          <InputGroupInput placeholder="northwind.io" />
        </InputGroup>
      </Field>
      <Field>
        <FieldLabel>Hourly rate, EUR</FieldLabel>
        <InputGroup>
          <InputGroupInput inputMode="decimal" defaultValue="95.00" className="text-end numeric" />
          <InputGroupAddon align="end">EUR</InputGroupAddon>
        </InputGroup>
      </Field>
      <Field>
        <FieldLabel>Webhook URL</FieldLabel>
        <InputGroup>
          <InputGroupAddon>
            <GlobeIcon aria-hidden weight="bold" />
          </InputGroupAddon>
          <InputGroupInput value={WEBHOOK} readOnly className="truncate" />
          <InputGroupAddon align="end">
            <InputGroupButton
              iconOnly
              aria-label={copied ? 'Copied' : 'Copy webhook URL'}
              onClick={() => {
                void navigator.clipboard.writeText(WEBHOOK).then(() => {
                  setCopied(true);
                  setTimeout(() => {
                    setCopied(false);
                  }, 2000);
                });
              }}
            >
              {copied ? (
                <CheckIcon aria-hidden weight="bold" />
              ) : (
                <CopyIcon aria-hidden weight="bold" />
              )}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <FieldDescription>Invoice events are posted here.</FieldDescription>
      </Field>
    </div>
  );
}
