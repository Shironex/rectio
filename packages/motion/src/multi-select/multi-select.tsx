import {
  MultiSelect as PlainMultiSelect,
  MultiSelectContent as PlainMultiSelectContent,
  MultiSelectInput as PlainMultiSelectInput,
  MultiSelectItem as PlainMultiSelectItem,
  cn,
  type MultiSelectContentProps,
  type MultiSelectInputProps,
  type MultiSelectItemProps,
  type MultiSelectProps,
} from '@rectio/ui';
import { createContext, use, useLayoutEffect, useRef, type RefObject } from 'react';

import { tweenTo } from '../lib/animate';
import { usePlainMotion } from '../lib/mode';
import { GLIDING_ITEM, MotionPopup, REPLACES_CSS_MOTION } from '../lib/popup';
import { assignRef } from '../lib/ref';
import { readMotionTokens } from '../lib/tokens';

export type {
  MultiSelectContentProps,
  MultiSelectInputProps,
  MultiSelectItemProps,
  MultiSelectProps,
};

/**
 * Set when a pick by pointer added chips, so the field greets only those. Keyboard picks, typing,
 * removals and the chips that show when the field takes focus never animate.
 */
const PointerPickContext = createContext<RefObject<boolean> | null>(null);

/** Whether a selection change came from a press on an option with a pointer, not a key. */
export function isPointerPick(reason: string, event: Event | undefined): boolean {
  return reason === 'item-press' && event !== undefined && !(event instanceof KeyboardEvent);
}

/** MultiSelect that tells its motioned field when a pointer pick adds chips. Same props. */
export function MultiSelect<Value>({ onValueChange, ...props }: MultiSelectProps<Value>) {
  const plain = usePlainMotion();
  const picked = useRef(false);
  const count = useRef((props.value ?? props.defaultValue ?? []).length);
  if (plain) return <PlainMultiSelect {...props} {...(onValueChange ? { onValueChange } : {})} />;
  return (
    <PointerPickContext value={picked}>
      <PlainMultiSelect<Value>
        {...props}
        onValueChange={(next, details) => {
          const before = count.current;
          count.current = next.length;
          picked.current = next.length > before && isPointerPick(details.reason, details.event);
          // The chips render within this task; a pick that drew none must not leak to the next.
          requestAnimationFrame(() => {
            picked.current = false;
          });
          onValueChange?.(next, details);
        }}
      />
    </PointerPickContext>
  );
}

/**
 * MultiSelectInput whose new chips arrive with a short fade and a scale from the token start,
 * when a pointer pick added them. A removed chip leaves at once: keeping a value on screen after it
 * is gone would misreport the selection.
 */
export function MultiSelectInput({ ref, ...props }: MultiSelectInputProps) {
  const plain = usePlainMotion();
  const picked = use(PointerPickContext);
  const input = useRef<HTMLInputElement | null>(null);

  useLayoutEffect(() => {
    const field = input.current?.closest('[data-slot="multi-select-input"]');
    if (plain || picked === null || field == null) return;
    const observer = new MutationObserver((records) => {
      if (!picked.current) return;
      picked.current = false;
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (!(node instanceof HTMLElement) || !node.matches('[data-slot="multi-select-chip"]'))
            continue;
          const tokens = readMotionTokens(node);
          if (tokens === null) continue;
          tweenTo(
            node,
            {
              opacity: [0, 1],
              transform: [`scale(${String(tokens.scale.from)})`, 'scale(1)'],
            },
            tokens.duration.base,
            tokens.easing.enter,
          );
        }
      }
    });
    observer.observe(field, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
    };
  }, [plain, picked]);

  return (
    <PlainMultiSelectInput
      {...props}
      {...(plain ? {} : { 'data-motion': '' })}
      ref={(node: HTMLInputElement | null) => {
        input.current = node;
        assignRef(ref, node);
      }}
    />
  );
}

/** MultiSelectContent with the Select list's spring and gliding highlight. Same props. */
export function MultiSelectContent({ className, ...props }: MultiSelectContentProps) {
  const plain = usePlainMotion();
  if (plain)
    return (
      <PlainMultiSelectContent {...props} {...(className === undefined ? {} : { className })} />
    );
  return (
    <PlainMultiSelectContent
      {...props}
      data-motion=""
      className={cn(REPLACES_CSS_MOTION, className)}
      render={(popupProps, state) => (
        <MotionPopup {...popupProps} state={state} itemSlot="multi-select-item" />
      )}
    />
  );
}

/** MultiSelectItem that lets the gliding highlight show through. */
export function MultiSelectItem({ className, ...props }: MultiSelectItemProps) {
  const plain = usePlainMotion();
  if (plain)
    return <PlainMultiSelectItem {...props} {...(className === undefined ? {} : { className })} />;
  return <PlainMultiSelectItem {...props} className={cn(GLIDING_ITEM, className)} />;
}
