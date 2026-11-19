import { ArrowRightIcon, CaretDownIcon, CheckIcon, ConfettiIcon } from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import { useId, useState } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { UsageMeter } from '../lib/meter';
import { focusRing, inlineLink, touchTarget } from '../lib/styles';
import {
  onboardingProgress,
  onboardingSummary,
  type OnboardingAction,
  type OnboardingStep,
} from './onboarding-checklist.logic';

export interface OnboardingChecklistProps {
  steps: readonly OnboardingStep[];
  /** Offers "Mark as done" on steps the app cannot detect by itself. */
  onToggleStep?: ((stepId: string, done: boolean) => void) | undefined;
  /** Offers Hide once every step is done, and on the finished state. */
  onDismiss?: (() => void) | undefined;
  /** Start folded to the progress bar, for a returning user. */
  defaultCollapsed?: boolean;
  title?: string;
  className?: string;
}

/**
 * The first-run checklist: every setup step with its action, the next one brought forward, and
 * progress as a count and a bar. Once all are done it says so and offers to step aside. The block
 * holds only whether it is folded; steps and their state come from your app.
 */
export function OnboardingChecklist({
  steps,
  onToggleStep,
  onDismiss,
  defaultCollapsed = false,
  title = 'Get set up',
  className,
}: OnboardingChecklistProps) {
  const { Button } = useBlockParts();
  const listId = useId();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const progress = onboardingProgress(steps);
  const summary = onboardingSummary(progress);

  return (
    <BlockPanel
      title={title}
      description={<span aria-live="polite">{summary}</span>}
      actions={
        steps.length > 0 && !progress.complete ? (
          <button
            type="button"
            aria-expanded={!collapsed}
            aria-controls={listId}
            onClick={() => {
              setCollapsed(!collapsed);
            }}
            className={cn(
              'relative inline-flex h-(--rx-button-height-sm) cursor-pointer items-center gap-1.5 rounded-(--rx-button-radius) px-2 text-sm text-fg-muted',
              'transition-colors duration-fast ease-standard hover:bg-surface-hover hover:text-fg',
              focusRing,
              touchTarget,
            )}
          >
            {collapsed ? 'Show steps' : 'Hide steps'}
            <CaretDownIcon
              aria-hidden
              weight="bold"
              className={cn(
                'size-3.5 transition-transform duration-fast ease-standard',
                !collapsed && 'rotate-180',
              )}
            />
          </button>
        ) : undefined
      }
      className={className}
      bodyClassName="gap-4"
    >
      {steps.length === 0 ? (
        <p className="text-sm text-fg-muted">There is nothing to set up yet.</p>
      ) : progress.complete ? (
        <div
          role="status"
          className="flex flex-col items-start gap-3 rounded-control border border-line bg-surface-sunken px-4 py-5 @md:flex-row @md:items-center"
        >
          <span
            aria-hidden
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-positive-subtle text-positive-strong"
          >
            <ConfettiIcon weight="bold" className="size-5" />
          </span>
          <div className="flex flex-1 flex-col gap-0.5">
            <p className="font-medium">You are all set up</p>
            <p className="text-sm text-fg-muted">
              Every step is done. You can come back to these settings at any time.
            </p>
          </div>
          {onDismiss !== undefined && (
            <Button variant="secondary" onClick={onDismiss}>
              Hide checklist
            </Button>
          )}
        </div>
      ) : (
        <>
          <UsageMeter
            label="Setup progress"
            value={progress.done}
            max={progress.total}
            valueText={`${String(progress.percent)}%`}
          />
          <ol id={listId} hidden={collapsed} className="flex flex-col gap-1">
            {steps.map((step, index) => (
              <StepRow
                key={step.id}
                step={step}
                number={index + 1}
                current={progress.next?.id === step.id}
                onToggleStep={onToggleStep}
              />
            ))}
          </ol>
        </>
      )}
    </BlockPanel>
  );
}

function StepRow({
  step,
  number,
  current,
  onToggleStep,
}: {
  step: OnboardingStep;
  number: number;
  current: boolean;
  onToggleStep: ((stepId: string, done: boolean) => void) | undefined;
}) {
  return (
    <li
      aria-current={current ? 'step' : undefined}
      className={cn(
        'flex gap-3 rounded-control px-3 py-3',
        current && 'bg-surface-sunken ring-1 ring-line ring-inset',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'mt-px inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium numeric',
          step.done && 'bg-positive text-positive-contrast',
          !step.done && current && 'bg-accent text-accent-contrast',
          !step.done && !current && 'text-fg-muted ring-1 ring-line-strong ring-inset',
        )}
      >
        {step.done ? <CheckIcon weight="bold" className="size-3.5" /> : number}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2 @lg:flex-row @lg:items-center @lg:gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className={cn('font-medium', step.done && 'text-fg-muted')}>
            {step.title}
            <span className="sr-only">{step.done ? ', done' : ', to do'}</span>
            {step.optional === true && (
              <span className="ms-2 text-sm font-regular text-fg-subtle">Optional</span>
            )}
          </p>
          {step.description !== undefined && !step.done && (
            <p className="text-sm text-pretty text-fg-muted">{step.description}</p>
          )}
        </div>
        {!step.done && (
          <div className="flex flex-wrap items-center gap-3 pointer-coarse:gap-5">
            {onToggleStep !== undefined && (
              <button
                type="button"
                onClick={() => {
                  onToggleStep(step.id, true);
                }}
                aria-label={`Mark ${step.title} as done`}
                className={cn(
                  inlineLink,
                  'relative text-sm font-regular text-fg-muted',
                  touchTarget,
                )}
              >
                Mark as done
              </button>
            )}
            {step.action !== undefined && <StepAction action={step.action} primary={current} />}
          </div>
        )}
        {step.done && onToggleStep !== undefined && (
          <button
            type="button"
            onClick={() => {
              onToggleStep(step.id, false);
            }}
            aria-label={`Mark ${step.title} as not done`}
            className={cn(
              inlineLink,
              'relative self-start text-sm font-regular text-fg-subtle @lg:self-center',
              touchTarget,
            )}
          >
            Undo
          </button>
        )}
      </div>
    </li>
  );
}

function StepAction({ action, primary }: { action: OnboardingAction; primary: boolean }) {
  const { Button } = useBlockParts();
  const variant = primary ? 'primary' : 'secondary';
  const content = (
    <>
      {action.label}
      <ArrowRightIcon aria-hidden weight="bold" className="size-3.5" />
    </>
  );
  if (action.href !== undefined) {
    return (
      <Button
        variant={variant}
        size="sm"
        nativeButton={false}
        render={<a href={action.href} />}
        onClick={action.onSelect}
      >
        {content}
      </Button>
    );
  }
  return (
    <Button variant={variant} size="sm" onClick={action.onSelect}>
      {content}
    </Button>
  );
}
