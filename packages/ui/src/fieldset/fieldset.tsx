import { Fieldset as BaseFieldset } from '@base-ui/react/fieldset';
import {
  createContext,
  use,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from 'react';

import { cn } from '../lib/cn';

type WithClassName<P> = Omit<P, 'className'> & { className?: string };

/** Lets a FieldsetDescription link itself to the fieldset it sits in. */
const DescriptionContext = createContext<{ id: string; register: (shown: boolean) => void } | null>(
  null,
);

export type FieldsetProps = WithClassName<ComponentProps<typeof BaseFieldset.Root>>;

/**
 * Groups related controls under one legend, on a native fieldset: a radio group, a set of
 * checkboxes, or the parts of an address. `disabled` disables every control inside. A
 * FieldsetDescription inside is linked to the group, so it is read when focus enters it.
 */
export function Fieldset({ className, children, ...props }: FieldsetProps) {
  const id = `${useId()}-description`;
  const [described, setDescribed] = useState(false);
  const description = useMemo(() => ({ id, register: setDescribed }), [id]);
  return (
    <DescriptionContext value={description}>
      <BaseFieldset.Root
        data-slot="fieldset"
        aria-describedby={described ? id : undefined}
        className={cn('flex min-w-0 flex-col gap-4', className)}
        {...props}
      >
        {children}
      </BaseFieldset.Root>
    </DescriptionContext>
  );
}

export type FieldsetLegendProps = WithClassName<ComponentProps<typeof BaseFieldset.Legend>>;

/** The group's name, set like a FieldLabel so a group and its fields read as one form. */
export function FieldsetLegend({ className, ...props }: FieldsetLegendProps) {
  return (
    <BaseFieldset.Legend
      data-slot="fieldset-legend"
      className={cn('text-sm font-medium text-fg data-disabled:text-fg-disabled', className)}
      {...props}
    />
  );
}

export type FieldsetDescriptionProps = WithClassName<ComponentProps<'p'>>;

/** Supporting text for the whole group, placed under the legend. */
export function FieldsetDescription({ className, ...props }: FieldsetDescriptionProps) {
  const context = use(DescriptionContext);
  const register = context?.register;
  useLayoutEffect(() => {
    register?.(true);
    return () => register?.(false);
  }, [register]);
  return (
    <p
      data-slot="fieldset-description"
      id={context?.id}
      // Pulled up under the legend, closer to it than to the fields below.
      className={cn('-mt-3 text-sm text-fg-subtle', className)}
      {...props}
    />
  );
}

export interface FormSectionProps extends WithClassName<Omit<ComponentProps<'section'>, 'title'>> {
  /** The section heading, such as "Billing details". */
  title: ReactNode;
  /** One or two sentences on what the section controls. */
  description?: ReactNode;
  /** Heading level, to fit the page outline. */
  headingLevel?: 2 | 3 | 4;
}

/**
 * A titled block of a settings form. In a wide container the title and description sit in a
 * column on the left and the fields on the right; in a narrow one they stack. It responds to its
 * own width (a container query), not the window's, so it works in a side panel as well as a page.
 */
export function FormSection({
  className,
  title,
  description,
  headingLevel = 2,
  children,
  ...props
}: FormSectionProps) {
  const id = useId();
  const Heading = `h${String(headingLevel)}` as 'h2' | 'h3' | 'h4';
  return (
    <section
      data-slot="form-section"
      aria-labelledby={`${id}-title`}
      className={cn('@container', className)}
      {...props}
    >
      <div className="grid gap-x-8 gap-y-4 @2xl:grid-cols-3">
        <div className="flex flex-col gap-1">
          <Heading id={`${id}-title`} className="text-base font-medium text-fg">
            {title}
          </Heading>
          {description !== undefined && (
            <p className="max-w-prose text-sm text-fg-muted">{description}</p>
          )}
        </div>
        <div className="flex min-w-0 flex-col gap-5 @2xl:col-span-2">{children}</div>
      </div>
    </section>
  );
}

export interface FormActionsProps extends WithClassName<ComponentProps<'div'>> {
  /** Where the buttons sit. `between` puts the first child at the start, the rest at the end. */
  align?: 'start' | 'end' | 'between';
}

/**
 * The footer row of a form: the primary action and its companions, under a rule. Put the primary
 * button last, so it sits at the end of the row where the eye finishes.
 */
export function FormActions({ className, align = 'end', ...props }: FormActionsProps) {
  return (
    <div
      data-slot="form-actions"
      data-align={align}
      className={cn(
        'flex flex-wrap items-center gap-2 border-t border-line pt-4',
        'data-[align=end]:justify-end data-[align=start]:justify-start',
        'data-[align=between]:*:first:me-auto',
        className,
      )}
      {...props}
    />
  );
}
