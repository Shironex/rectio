'use client';

import { Field as BaseField } from '@base-ui/react/field';
import { WarningCircleIcon } from '@phosphor-icons/react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type Ref,
} from 'react';

import { controlFocus, controlSurface } from '../field/control-styles';
import { cn } from '../lib/cn';

type ControlProps = ComponentProps<typeof BaseField.Control>;
type ChangeDetails = Parameters<NonNullable<ControlProps['onValueChange']>>[1];

export interface TextareaProps extends Omit<
  ComponentProps<'textarea'>,
  'className' | 'rows' | 'value' | 'defaultValue' | 'ref'
> {
  className?: string;
  ref?: Ref<HTMLTextAreaElement>;
  value?: string;
  defaultValue?: string;
  /** Called with the new text on every change. Use with `value` when controlled. */
  onValueChange?: (value: string, details: ChangeDetails) => void;
  /** Height at rest, in lines. The field never gets shorter than this. */
  minRows?: number;
  /**
   * The field grows with its text up to this many lines, then scrolls. Set it equal to `minRows`
   * for a fixed height.
   */
  maxRows?: number;
  /** Shows "120 / 500" under the field. Needs `maxLength`. */
  showCount?: boolean;
  /**
   * How many characters before the limit the count turns to a warning and starts to announce.
   * Defaults to a tenth of `maxLength`, at least 10.
   */
  warnAt?: number;
}

/** Height in pixels of `rows` lines of text in this textarea, borders and padding included. */
function heightOfRows(element: HTMLTextAreaElement, rows: number) {
  const style = getComputedStyle(element);
  const px = (value: string) => Number.parseFloat(value) || 0;
  const line = px(style.lineHeight) || px(style.fontSize) * 1.5;
  const box =
    px(style.paddingTop) +
    px(style.paddingBottom) +
    px(style.borderTopWidth) +
    px(style.borderBottomWidth);
  return {
    height: rows * line + box,
    border: px(style.borderTopWidth) + px(style.borderBottomWidth),
  };
}

/**
 * Fits the textarea to its text between two heights. It measures in one synchronous pass (shrink
 * to the minimum, read the scroll height, set the result), so the browser paints only the final
 * height and the page below never jumps.
 */
function useAutoGrow(minRows: number, maxRows: number) {
  const nodeRef = useRef<HTMLTextAreaElement | null>(null);

  const fitHeight = useCallback(() => {
    const element = nodeRef.current;
    if (element === null) return;
    const min = heightOfRows(element, minRows);
    const max = maxRows === Infinity ? Infinity : heightOfRows(element, maxRows).height;
    element.style.height = `${String(min.height)}px`;
    const content = element.scrollHeight + min.border;
    const next = Math.min(Math.max(content, min.height), max);
    element.style.height = `${String(next)}px`;
    element.style.overflowY = content > max ? 'auto' : 'hidden';
  }, [minRows, maxRows]);

  // A narrower field wraps more lines, so refit when the width changes (not the height, which
  // this hook sets itself).
  useEffect(() => {
    const element = nodeRef.current;
    if (element === null || typeof ResizeObserver === 'undefined') return;
    let width = element.offsetWidth;
    const observer = new ResizeObserver(() => {
      if (element.offsetWidth === width) return;
      width = element.offsetWidth;
      fitHeight();
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, [fitHeight]);

  return { nodeRef, fitHeight };
}

/** Announces the characters left, settled for a moment so a fast typist hears one number. */
function useSettledAnnouncement(text: string) {
  const [settled, setSettled] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSettled(text);
    }, 500);
    return () => {
      clearTimeout(timer);
    };
  }, [text]);
  return settled;
}

/**
 * A multi-line text field on Base UI's Field control. It grows with its text between `minRows` and
 * `maxRows`, then scrolls. With `showCount` and `maxLength` it shows how much of the limit is used,
 * turns to a warning near the limit and says how many characters are left, in words as well as
 * colour. Screen readers hear the count only near the limit, never on every keystroke before it.
 */
export function Textarea({
  className,
  ref,
  value,
  defaultValue,
  onValueChange,
  minRows = 3,
  maxRows = 10,
  showCount = false,
  warnAt,
  maxLength,
  ...props
}: TextareaProps) {
  const controlled = value !== undefined;
  const [uncontrolledLength, setUncontrolledLength] = useState(defaultValue?.length ?? 0);
  const length = controlled ? value.length : uncontrolledLength;
  const { nodeRef, fitHeight } = useAutoGrow(minRows, Math.max(minRows, maxRows));

  // Controlled values arrive from outside; fitHeight before paint so the new height lands with the text.
  useLayoutEffect(() => {
    fitHeight();
  }, [fitHeight, value]);

  const counted = showCount && maxLength !== undefined;
  const limit = maxLength ?? 0;
  const left = limit - length;
  const threshold = warnAt ?? Math.max(10, Math.ceil(limit / 10));
  const tone = !counted ? 'rest' : left <= 0 ? 'limit' : left <= threshold ? 'near' : 'rest';
  const status =
    left < 0
      ? `${String(-left)} over the limit`
      : left === 0
        ? 'Limit reached'
        : `${String(left)} left`;
  const announcement = useSettledAnnouncement(
    tone === 'rest' ? '' : left <= 0 ? status : `${String(left)} characters left`,
  );

  const control = (
    <BaseField.Control
      {...(props as Omit<ControlProps, 'ref'>)}
      ref={(element: HTMLElement | null) => {
        nodeRef.current = element as HTMLTextAreaElement | null;
        if (typeof ref === 'function') ref(element as HTMLTextAreaElement | null);
        else if (ref) ref.current = element as HTMLTextAreaElement | null;
      }}
      data-slot="textarea"
      render={<textarea rows={minRows} maxLength={maxLength} />}
      {...(controlled ? { value } : { defaultValue })}
      onValueChange={(next: string, details: ChangeDetails) => {
        if (!controlled) {
          setUncontrolledLength(next.length);
          fitHeight();
        }
        onValueChange?.(next, details);
      }}
      className={cn(
        controlSurface,
        controlFocus,
        // The height is measured; the surface's fixed control height does not apply here.
        'h-auto pointer-coarse:h-auto resize-none px-(--rx-field-padding-x) py-2 placeholder:text-fg-subtle',
        className,
      )}
    />
  );

  if (!counted) return control;

  return (
    <div data-slot="textarea-group" className="flex flex-col gap-1">
      {control}
      <div
        data-slot="textarea-count"
        data-tone={tone}
        className={cn(
          'flex items-center justify-end gap-1.5 text-sm text-fg-subtle numeric',
          'data-[tone=near]:text-warning-strong data-[tone=limit]:text-negative-strong',
        )}
      >
        {/* The visible count is for sighted users; the live region below speaks for screen readers. */}
        <span aria-hidden className="flex items-center gap-1.5">
          {tone !== 'rest' && (
            <>
              <WarningCircleIcon weight="bold" className="size-3.5 shrink-0" />
              <span>{status},</span>{' '}
            </>
          )}
          <span>
            {String(length)} / {String(limit)}
          </span>
        </span>
        <span aria-live="polite" className="sr-only">
          {announcement}
        </span>
      </div>
    </div>
  );
}
