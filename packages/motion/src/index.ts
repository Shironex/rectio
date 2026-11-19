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
export { DataTableBody, TableCell, TableRow, TableRows } from './table/table';
export { ToastProvider, useToast, type ToastProviderProps, type ToastType } from './toast/toast';
export {
  Progress,
  ProgressCircle,
  type ProgressCircleProps,
  type ProgressProps,
} from './progress/progress';
export { Meter, type MeterProps } from './meter/meter';
export {
  Timeline,
  TimelineItem,
  type TimelineItemProps,
  type TimelineProps,
} from './timeline/timeline';
export { SkeletonSwap, type SkeletonSwapProps } from './skeleton/skeleton';
export { Alert, type AlertProps } from './alert/alert';
export { Banner, type BannerProps } from './banner/banner';
export { LoadingOverlay, type LoadingOverlayProps } from './spinner/spinner';
export { NumberField, type NumberFieldProps } from './number-field/number-field';
export { Switch, SwitchField, type SwitchFieldProps, type SwitchProps } from './switch/switch';
export { ToggleGroup, type ToggleGroupProps } from './toggle/toggle';
export {
  FileDropzone,
  FileItem,
  FileList,
  type FileDropzoneProps,
  type FileItemProps,
  type FileListProps,
} from './file-upload/file-upload';
export {
  ComboboxContent,
  ComboboxItem,
  type ComboboxContentProps,
  type ComboboxItemProps,
} from './combobox/combobox';
export {
  MultiSelect,
  MultiSelectContent,
  MultiSelectInput,
  MultiSelectItem,
  type MultiSelectContentProps,
  type MultiSelectInputProps,
  type MultiSelectItemProps,
  type MultiSelectProps,
} from './multi-select/multi-select';
