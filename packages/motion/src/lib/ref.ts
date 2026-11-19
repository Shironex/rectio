import type { Ref } from 'react';

/** Hands a node to a ref the caller passed, whatever its shape. */
export function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref !== null && ref !== undefined) ref.current = value;
}
