import { Select, SelectContent, SelectItem, SelectTrigger, cn } from '@rectio/ui';

export interface Choice<Value extends string> {
  value: Value;
  label: string;
}

export interface ChoiceSelectProps<Value extends string> {
  /** The accessible name, such as "Period" or "Account". Shown before the value. */
  label: string;
  value: Value;
  onValueChange: (value: Value) => void;
  choices: readonly Choice<Value>[];
  className?: string;
}

/**
 * A compact select for a toolbar: the label sits inside the trigger before the value, so a
 * filter row stays one line tall without a separate label above each control.
 */
export function ChoiceSelect<Value extends string>({
  label,
  value,
  onValueChange,
  choices,
  className,
}: ChoiceSelectProps<Value>) {
  const current = choices.find((choice) => choice.value === value);
  return (
    <Select
      items={choices}
      value={value}
      onValueChange={(next) => {
        const picked = choices.find((choice) => choice.value === next);
        if (picked !== undefined) onValueChange(picked.value);
      }}
    >
      <SelectTrigger aria-label={label} className={cn('w-auto min-w-40 gap-3', className)}>
        <span className="flex min-w-0 items-baseline gap-1.5 truncate">
          <span className="text-fg-muted">{label}</span>
          <span className="truncate">{current?.label}</span>
        </span>
      </SelectTrigger>
      <SelectContent>
        {choices.map((choice) => (
          <SelectItem key={choice.value} value={choice.value}>
            {choice.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
