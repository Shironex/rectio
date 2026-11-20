import { cn } from '@rectio/ui';
import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

import { mergeMessages } from '../lib/messages';
import { slugify } from '../lib/docs';

/**
 * A numbered procedure. Each `Step` has a title and its body (text, code, a callout); the numbers
 * come from the order of the steps, so steps can be added or reordered without renumbering.
 */
export function Steps({
  children,
  messages,
  className,
}: {
  children: ReactNode;
  /** Passed to every step. See `STEPS_MESSAGES`. */
  messages?: Partial<StepsMessages>;
  className?: string;
}) {
  const steps = Children.toArray(children).filter(isValidElement) as ReactElement<StepProps>[];
  return (
    <ol data-slot="steps" className={cn('flex flex-col', className)}>
      {steps.map((step, index) =>
        cloneElement(step, { number: index + 1, messages: step.props.messages ?? messages }),
      )}
    </ol>
  );
}

export interface StepProps {
  title: string;
  /** Heading level of the step's title: 3 under a page section, 4 inside a subsection. */
  level?: 3 | 4;
  /** Set by `Steps`. */
  number?: number;
  /** The step's words; pass the keys you change. See `STEPS_MESSAGES`. */
  messages?: Partial<StepsMessages> | undefined;
  children?: ReactNode;
}

export interface StepsMessages {
  /** Read before a step's title: "Step 2:". */
  step: (number: number) => string;
}

export const STEPS_MESSAGES: StepsMessages = {
  step: (number) => `Step ${String(number)}:`,
};

export function Step({ title, level = 3, number = 1, messages, children }: StepProps) {
  const m = mergeMessages(STEPS_MESSAGES, messages);
  const Heading = level === 3 ? 'h3' : 'h4';
  return (
    <li
      data-slot="step"
      className={cn(
        'relative flex gap-3 pb-9 last:pb-0 sm:gap-4',
        // The rail between numbers; the last step has nothing below it to connect to.
        'before:absolute before:start-3 before:top-8 sm:before:start-3.5 sm:before:top-9 before:bottom-2 before:w-px before:bg-line last:before:hidden',
      )}
    >
      <span
        aria-hidden
        className="flex size-6 shrink-0 sm:size-7 items-center justify-center rounded-full border border-line-strong bg-surface text-sm font-strong text-fg numeric"
      >
        {number}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3 pt-0.5">
        <Heading
          id={slugify(title)}
          className="scroll-mt-24 text-lg font-strong text-balance text-fg"
        >
          <span className="sr-only">{m.step(number)}</span> {title}
        </Heading>
        {children !== undefined && (
          <div className="flex min-w-0 flex-col gap-3 text-fg-muted [&_p]:text-pretty">
            {children}
          </div>
        )}
      </div>
    </li>
  );
}
