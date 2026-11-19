import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from '@rectio/ui';
import { useId, useState, type ReactNode } from 'react';

import { Anchor, linkFocus } from '../lib/action';
import { useMarketingParts } from '../lib/parts';
import { Switch } from '../lib/switch';
import {
  acceptAll,
  chooseConsent,
  hasDecided,
  initialChoices,
  rejectAll,
  type ConsentRecord,
  type CookieCategory,
} from './cookie-consent.logic';

interface ConsentCopy {
  categories: readonly CookieCategory[];
  /** The version of your cookie list. A saved decision for another version asks again. */
  version: string;
  /** Called with the decision. Store it (the logic exports `saveConsent`) and load your scripts. */
  onSave: (consent: ConsentRecord) => void;
  /** Your cookie policy, linked from the banner and the preferences. */
  policyHref?: string;
  policyLabel?: string;
}

export interface CookieConsentProps extends ConsentCopy {
  /** The saved decision, if any. While it covers `version`, the banner stays away. */
  consent: ConsentRecord | null | undefined;
  title?: string;
  description?: ReactNode;
  className?: string;
}

export interface CookiePreferencesProps extends ConsentCopy {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The saved decision, to start the switches from. */
  consent: ConsentRecord | null | undefined;
}

/**
 * Every category with an on and off switch. Required categories show as always on. Accept all and
 * reject all sit beside saving, at the same weight.
 */
export function CookiePreferences({
  open,
  onOpenChange,
  categories,
  version,
  consent,
  onSave,
  policyHref,
  policyLabel = 'Cookie policy',
}: CookiePreferencesProps) {
  const { Button } = useMarketingParts();
  const [choices, setChoices] = useState(() => initialChoices(categories, consent));
  const descriptionId = useId();
  const save = (record: ConsentRecord) => {
    onSave(record);
    onOpenChange(false);
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setChoices(initialChoices(categories, consent));
        onOpenChange(next);
      }}
    >
      <DialogContent aria-describedby={descriptionId}>
        <DialogHeader>
          <DialogTitle>Cookie settings</DialogTitle>
          <DialogDescription id={descriptionId}>
            Choose which cookies we may use. You can change this at any time.
            {policyHref !== undefined && (
              <>
                {' '}
                <Anchor
                  href={policyHref}
                  className={cn('text-fg underline underline-offset-4', linkFocus)}
                >
                  {policyLabel}
                </Anchor>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="gap-0 py-2">
          <ul className="flex flex-col divide-y divide-line">
            {categories.map((category) => {
              const labelId = `${descriptionId}-${category.id}`;
              return (
                <li key={category.id} className="flex items-start justify-between gap-6 py-4">
                  <div className="flex flex-col gap-1">
                    <p
                      id={labelId}
                      className="flex items-center gap-2 text-base font-medium text-fg"
                    >
                      {category.title}
                      {category.required === true && (
                        <span className="text-sm font-regular text-fg-muted">Always on</span>
                      )}
                    </p>
                    <p id={`${labelId}-note`} className="text-sm text-pretty text-fg-muted">
                      {category.description}
                    </p>
                  </div>
                  <Switch
                    aria-labelledby={labelId}
                    aria-describedby={`${labelId}-note`}
                    checked={category.required === true || choices[category.id] === true}
                    disabled={category.required === true}
                    onCheckedChange={(checked) => {
                      setChoices((current) => ({ ...current, [category.id]: checked }));
                    }}
                    className="mt-0.5"
                  />
                </li>
              );
            })}
          </ul>
        </DialogBody>
        <DialogFooter className="flex-wrap">
          <Button
            variant="secondary"
            onClick={() => {
              save(rejectAll(categories, version));
            }}
          >
            Reject all
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              save(acceptAll(categories, version));
            }}
          >
            Accept all
          </Button>
          <Button
            onClick={() => {
              save(chooseConsent(categories, choices, version));
            }}
          >
            Save choices
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * A cookie banner that asks before anything optional runs: accept all and reject all at the same
 * weight, one press each, and a way to choose per category. It is a labelled region, not a modal:
 * the page stays usable while it waits. The decision goes to `onSave`; pass it back as `consent`
 * and the banner stays away until `version` changes.
 */
export function CookieConsent({
  consent,
  title = 'We use cookies',
  description = 'Necessary cookies keep the site working. With your permission we also use analytics and marketing cookies to improve it.',
  className,
  ...copy
}: CookieConsentProps) {
  const { Button } = useMarketingParts();
  const [customising, setCustomising] = useState(false);
  const titleId = useId();
  const decided = hasDecided(consent, copy.version);
  return (
    <>
      {!decided && (
        <section
          aria-labelledby={titleId}
          data-slot="cookie-consent"
          className={cn(
            'fixed inset-x-3 bottom-3 z-40 flex flex-col gap-4 rounded-panel border border-line bg-surface-overlay p-5 text-fg shadow-overlay',
            'sm:inset-x-auto sm:start-6 sm:bottom-6 sm:max-w-md',
            'transition-[opacity,translate] duration-slow ease-enter',
            'starting:translate-y-(--rx-motion-distance-reveal) starting:opacity-0',
            className,
          )}
        >
          <div className="flex flex-col gap-1.5">
            <h2 id={titleId} className="text-base font-strong text-fg">
              {title}
            </h2>
            <p className="text-sm text-pretty text-fg-muted">
              {description}
              {copy.policyHref !== undefined && (
                <>
                  {' '}
                  <Anchor
                    href={copy.policyHref}
                    className={cn('text-fg underline underline-offset-4', linkFocus)}
                  >
                    {copy.policyLabel ?? 'Cookie policy'}
                  </Anchor>
                </>
              )}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                copy.onSave(rejectAll(copy.categories, copy.version));
              }}
            >
              Reject all
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                copy.onSave(acceptAll(copy.categories, copy.version));
              }}
            >
              Accept all
            </Button>
            <Button
              variant="ghost"
              className="col-span-2"
              onClick={() => {
                setCustomising(true);
              }}
            >
              Choose cookies
            </Button>
          </div>
        </section>
      )}
      <CookiePreferences
        {...copy}
        consent={consent}
        open={customising}
        onOpenChange={setCustomising}
      />
    </>
  );
}
