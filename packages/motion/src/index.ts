/**
 * The rectio motion add-on. Each export has the same name and props as its plain twin in
 * @rectio/ui, so an app picks motion per component by its import path:
 *
 *   import { Field, Input } from '@rectio/ui';
 *   import { Button, Money } from '@rectio/motion';
 *
 * Apps that never import this package never load Motion.
 */
export {
  MotionPreferenceProvider,
  usePlainMotion,
  type MotionPreference,
  type MotionPreferenceProps,
} from './lib/mode';
export { readMotionTokens, type MotionTokens, type SpringToken } from './lib/tokens';
export { Button, type ButtonProps } from './button/button';
export { AmountInput, type AmountInputProps } from './amount-input/amount-input';
export { Money, type MoneyProps } from './money/money';
export { Dialog, DialogContent, DialogTrigger, type DialogContentProps } from './dialog/dialog';
export {
  SelectContent,
  SelectItem,
  type SelectContentProps,
  type SelectItemProps,
} from './select/select';
export { TableCell, TableRow, TableRows, type TableCellProps } from './table/table';
