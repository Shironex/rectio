'use client';

import { Field, FieldDescription, FieldLabel, Input } from '@rectio/ui';
import { parseColor, toHex, type Oklch } from '@rectio/tokens/generator';
import { useId, useState, type ReactNode } from 'react';

/**
 * A colour as a picker and a text field side by side. The text takes hex or OKLCH; the picker
 * writes hex. A value that is not a colour stays in the field, marked, until it is fixed.
 */
export function ColorField({
  label,
  value,
  onCommit,
  description,
  placeholder = 'Hex or OKLCH',
  action,
}: {
  label: string;
  /** What the field shows when the person is not typing: a hex or OKLCH string. */
  value: string;
  onCommit: (color: Oklch, text: string) => void;
  description?: ReactNode;
  placeholder?: string;
  /** A small control at the end of the label line, such as Reset. */
  action?: ReactNode;
}) {
  // What the person is typing; null while they are not, so the field follows the value.
  const [draft, setDraft] = useState<string | null>(null);
  const text = draft ?? value;
  const descriptionId = useId();
  const parsed = parseColor(text);
  const invalid = text.trim() !== '' && parsed === undefined;

  const pickerValue = parseColor(value);
  return (
    <Field invalid={invalid}>
      <div className="flex items-baseline justify-between gap-2">
        <FieldLabel>{label}</FieldLabel>
        {action}
      </div>
      <div className="flex items-center gap-2">
        <span className="relative inline-flex size-(--rx-field-height) shrink-0 overflow-hidden rounded-control border border-line-strong has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-focus">
          <input
            type="color"
            aria-label={`${label}, colour picker`}
            aria-describedby={description === undefined ? undefined : descriptionId}
            value={pickerValue === undefined ? '' : toHex(pickerValue)}
            onChange={(event) => {
              const next = parseColor(event.target.value);
              if (next === undefined) return;
              onCommit(next, event.target.value);
            }}
            className="absolute inset-0 size-full scale-150 cursor-pointer border-0 p-0"
          />
        </span>
        <Input
          value={text}
          spellCheck={false}
          autoComplete="off"
          placeholder={placeholder}
          aria-label={`${label}, hex or OKLCH`}
          className="min-w-0 flex-1 font-mono text-sm"
          onFocus={() => {
            setDraft(value);
          }}
          onBlur={() => {
            // A value that is not a colour stays visible, marked, until it is fixed.
            if (parseColor(text) !== undefined) setDraft(null);
          }}
          onValueChange={(next) => {
            setDraft(next);
            const color = parseColor(next);
            if (color !== undefined) onCommit(color, next);
          }}
        />
      </div>
      {invalid ? (
        <p className="text-sm text-negative-strong" role="alert">
          Not a colour yet. Use hex, or OKLCH as lightness, chroma and hue.
        </p>
      ) : (
        description !== undefined && (
          <FieldDescription id={descriptionId}>{description}</FieldDescription>
        )
      )}
    </Field>
  );
}
