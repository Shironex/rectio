'use client';

import { CheckIcon, WarningIcon } from '@phosphor-icons/react';
import type { ComponentProps, ReactNode } from 'react';

import { cn } from '../lib/cn';

export type StepStatus = 'complete' | 'current' | 'upcoming' | 'error';

export interface StepperStep {
  title: ReactNode;
  description?: ReactNode | undefined;
  /** Overrides the status worked out from `current`, such as `error` for a step that failed. */
  status?: StepStatus | undefined;
}

const SPOKEN: Record<StepStatus, string> = {
  complete: 'completed',
  current: 'current step',
  upcoming: 'not started',
  error: 'needs attention',
};

const INDICATOR: Record<StepStatus, string> = {
  complete: 'border-accent bg-accent text-accent-contrast',
  current: 'border-accent bg-surface text-accent-strong ring-4 ring-accent-subtle',
  upcoming: 'border-line-strong bg-surface text-fg-subtle',
  error: 'border-negative bg-negative-subtle text-negative-strong',
};

export interface StepperProps extends Omit<ComponentProps<'ol'>, 'onSelect'> {
  steps: readonly StepperStep[];
  /** Index of the step in progress. Steps before it are complete, after it upcoming. */
  current: number;
  orientation?: 'horizontal' | 'vertical' | undefined;
  /** Names the list, such as `Invoice setup`. */
  label?: string | undefined;
  /**
   * Makes completed steps buttons that go back to that step. Upcoming steps stay plain text, so
   * the order of the flow holds.
   */
  /** The visible "Step 3 of 4" line on a narrow row; translate it here. */
  summary?: ((step: number, total: number) => ReactNode) | undefined;
  onStepSelect?: ((index: number) => void) | undefined;
}

function statusOf(step: StepperStep, index: number, current: number): StepStatus {
  if (step.status !== undefined) return step.status;
  if (index < current) return 'complete';
  return index === current ? 'current' : 'upcoming';
}

/**
 * Where the user is in a flow of a few steps: setup, checkout, onboarding. Horizontal steps keep
 * only the current title once the row is narrow; vertical steps carry descriptions comfortably.
 */
export function Stepper({
  steps,
  current,
  orientation = 'horizontal',
  label = 'Progress',
  onStepSelect,
  summary = (step, total) => `Step ${String(step)} of ${String(total)}`,
  className,
  ...props
}: StepperProps) {
  const vertical = orientation === 'vertical';
  return (
    <div data-slot="stepper" className={cn(!vertical && '@container', className)}>
      <ol
        aria-label={label}
        data-orientation={orientation}
        className={cn('flex', vertical ? 'flex-col' : 'w-full items-start')}
        {...props}
      >
        {steps.map((step, i) => {
          const status = statusOf(step, i, current);
          const last = i === steps.length - 1;
          const done = status === 'complete';
          const selectable = onStepSelect !== undefined && done;
          const indicator = (
            <span
              aria-hidden
              className={cn(
                'relative z-1 flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-strong numeric',
                status !== 'current' && 'ring-4 ring-surface',
                'transition-[background-color,border-color,color,box-shadow] duration-base ease-standard',
                INDICATOR[status],
              )}
            >
              {status === 'complete' ? (
                <CheckIcon weight="bold" className="size-3.5" />
              ) : status === 'error' ? (
                <WarningIcon weight="bold" className="size-3.5" />
              ) : (
                i + 1
              )}
            </span>
          );
          const text = (
            <span
              className={cn(
                'flex min-w-0 flex-col gap-0.5',
                vertical ? 'pt-0.5 pb-6' : 'items-center text-center',
                vertical && last && 'pb-0',
                // On a narrow row only the current step keeps its words.
                !vertical && status !== 'current' && '@max-lg:sr-only',
              )}
            >
              <span
                data-slot="step-title"
                className={cn(
                  'text-sm font-medium text-balance group-hover/step:underline group-hover/step:underline-offset-4',
                  status === 'upcoming' ? 'text-fg-muted' : 'text-fg',
                  status === 'error' && 'text-negative-strong',
                )}
              >
                {step.title}
              </span>
              {step.description !== undefined && (
                <span className={cn('text-xs text-fg-muted', !vertical && '@max-2xl:hidden')}>
                  {step.description}
                </span>
              )}
              <span className="sr-only">, {SPOKEN[status]}</span>
            </span>
          );
          return (
            <li
              key={i}
              aria-current={status === 'current' ? 'step' : undefined}
              data-status={status}
              className={cn(
                'relative flex min-w-0',
                vertical ? 'gap-3' : 'flex-1 flex-col items-center gap-2',
              )}
            >
              {/* Connectors: half a line into this step and half out of it, filled once done. */}
              {vertical
                ? !last && (
                    <span
                      aria-hidden
                      className={cn(
                        'absolute start-3.5 top-8 bottom-1 w-0.5 -translate-x-1/2 rtl:translate-x-1/2',
                        done ? 'bg-accent' : 'bg-line',
                      )}
                    />
                  )
                : [
                    i > 0 && (
                      <span
                        key="in"
                        aria-hidden
                        className={cn(
                          'absolute start-0 end-1/2 top-3.5 h-0.5 -translate-y-1/2',
                          status === 'upcoming' ? 'bg-line' : 'bg-accent',
                        )}
                      />
                    ),
                    !last && (
                      <span
                        key="out"
                        aria-hidden
                        className={cn(
                          'absolute start-1/2 end-0 top-3.5 h-0.5 -translate-y-1/2',
                          done ? 'bg-accent' : 'bg-line',
                        )}
                      />
                    ),
                  ]}
              {selectable ? (
                <button
                  type="button"
                  onClick={() => {
                    onStepSelect(i);
                  }}
                  className={cn(
                    'flex min-w-0 cursor-pointer rounded-control text-start outline-offset-4 focus-visible:outline-2 focus-visible:outline-focus',
                    'group/step',
                    vertical ? 'gap-3' : 'flex-col items-center gap-2',
                  )}
                >
                  {indicator}
                  {text}
                </button>
              ) : (
                <>
                  {indicator}
                  {text}
                </>
              )}
            </li>
          );
        })}
      </ol>
      {!vertical && (
        // On a narrow row the other titles hide, so say where this step sits in words that show.
        <p
          aria-hidden
          className="mt-3 hidden text-center text-xs text-fg-muted numeric @max-lg:block"
        >
          {summary(Math.min(current + 1, steps.length), steps.length)}
        </p>
      )}
    </div>
  );
}
