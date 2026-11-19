import { Meter } from '@base-ui/react/meter';
import {
  ArrowCounterClockwiseIcon,
  ArrowRightIcon,
  CaretDownIcon,
  CheckIcon,
  ConfettiIcon,
  ListChecksIcon,
} from '@phosphor-icons/react';
import { cn } from '@rectio/ui';
import { useId, useState } from 'react';

import { useBlockParts } from '../../lib/block-parts';
import { BlockPanel } from '../../lib/block-panel';
import { EmptyNote } from '../../lib/empty-note';
import { ActionMenu } from '../lib/action-menu';
import { focusRing, inlineLink, touchTarget } from '../lib/styles';
import {
  onboardingProgress,
  onboardingSummary,
  type OnboardingAction,
  type OnboardingStep,
} from './onboarding-checklist.logic';

export interface OnboardingChecklistProps {
  steps: readonly OnboardingStep[];
  /** Offers "Mark as done" and its undo, in a menu on each row, for steps the app cannot detect. */
  onToggleStep?: ((stepId: string, done: boolean) => void) | undefined;
  /** Offers Hide once every step is done, and on the finished state. */
  onDismiss?: (() => void) | undefined;
  /** How long the whole list takes, such as "About 10 minutes": said before the first step is done. */
  estimate?: string | undefined;
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
  estimate,
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
      description={
        <span aria-live="polite">
          {progress.done === 0 && steps.length > 0 ? startLine(summary, estimate) : summary}
        </span>
      }
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
        <EmptyNote
          title={
            <span className="flex flex-col items-center gap-3">
              <ListChecksIcon aria-hidden weight="duotone" className="size-8 text-fg-subtle" />
              No setup steps
            </span>
          }
        >
          This workspace is ready to use as it is. Steps appear here when a feature needs setting
          up.
          {onDismiss !== undefined && (
            <span className="mt-4 flex justify-center">
              <Button variant="secondary" onClick={onDismiss}>
                Hide checklist
              </Button>
            </span>
          )}
        </EmptyNote>
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
          {/* The count is said once, in the panel description; the bar only shows it. */}
          <Meter.Root
            value={progress.done}
            max={progress.total}
            aria-label="Setup progress"
            getAriaValueText={() => summary}
          >
            <Meter.Track className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken ring-1 ring-line ring-inset">
              <Meter.Indicator className="h-full rounded-full bg-accent" />
            </Meter.Track>
          </Meter.Root>
          <ol id={listId} hidden={collapsed} className="flex flex-col gap-1.5">
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

/** Before anything is done, the count gets a reason to start: the time it takes, or the first step. */
function startLine(summary: string, estimate: string | undefined): string {
  if (estimate === undefined) return `${summary}. Start with the first step.`;
  return `${summary}, ${estimate.charAt(0).toLowerCase()}${estimate.slice(1)} in all`;
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
        'flex items-start gap-3 rounded-control px-3 py-3',
        current && 'bg-surface-raised shadow-raised ring-1 ring-line-strong',
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
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* The row menu sits on the title line, so the text under it runs the full width. */}
        <div className="flex items-center gap-2">
          <p className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className={cn('font-medium', step.done && 'text-fg-muted')}>
              {step.title}
              <span className="sr-only">{step.done ? ', done' : ', to do'}</span>
            </span>
            {current && (
              <span className="rounded-full bg-accent-subtle px-2 text-xs font-medium text-accent-strong">
                Next
              </span>
            )}
          </p>
          {onToggleStep !== undefined && (
            <ActionMenu
              label={`More for ${step.title}`}
              className="-my-2"
              actions={[
                step.done
                  ? {
                      id: 'undo',
                      label: 'Mark as not done',
                      icon: ArrowCounterClockwiseIcon,
                      onSelect: () => {
                        onToggleStep(step.id, false);
                      },
                    }
                  : {
                      id: 'done',
                      label: 'Mark as done',
                      icon: CheckIcon,
                      onSelect: () => {
                        onToggleStep(step.id, true);
                      },
                    },
              ]}
            />
          )}
        </div>
        {step.done ? (
          <p aria-hidden className="text-sm text-fg-muted">
            Done
          </p>
        ) : (
          <>
            {(step.description !== undefined || step.optional === true) && (
              <p className="text-sm text-pretty text-fg-muted">
                {step.optional === true && (
                  <span className="font-medium text-fg-muted">Optional. </span>
                )}
                {step.description}
              </p>
            )}
            {step.action !== undefined && (
              <div className="mt-2">
                <StepAction action={step.action} primary={current} />
              </div>
            )}
          </>
        )}
      </div>
    </li>
  );
}

/** The next step's action is the one primary button; every other step offers a text link. */
function StepAction({ action, primary }: { action: OnboardingAction; primary: boolean }) {
  const { Button } = useBlockParts();
  const content = (
    <>
      {action.label}
      <ArrowRightIcon aria-hidden weight="bold" className="size-3.5 rtl:rotate-180" />
    </>
  );
  if (!primary) {
    const link = cn(
      inlineLink,
      'relative inline-flex items-center gap-1.5 text-sm font-medium',
      touchTarget,
    );
    return action.href !== undefined ? (
      <a href={action.href} onClick={action.onSelect} className={link}>
        {content}
      </a>
    ) : (
      <button type="button" onClick={action.onSelect} className={link}>
        {content}
      </button>
    );
  }
  if (action.href !== undefined) {
    return (
      <Button
        variant="primary"
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
    <Button variant="primary" size="sm" onClick={action.onSelect}>
      {content}
    </Button>
  );
}
