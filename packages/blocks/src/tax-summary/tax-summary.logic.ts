import { daysBetween, fromMinor, toMinor } from '../lib/finance';

/** A tax rate as a fraction (0.23 is 23%), or `exempt` for supplies outside the tax. */
export type TaxRate = number | 'exempt';

export interface TaxRateEntry {
  id: string;
  rate: TaxRate;
  /** Taxable sales at this rate, net of tax, major units. */
  outputBase: number;
  /** Tax charged on those sales; worked out from the base and rate when left out. */
  outputTax?: number;
  /** Taxable purchases at this rate, net of tax, major units. */
  inputBase: number;
  /** Tax paid on those purchases; worked out from the base and rate when left out. */
  inputTax?: number;
}

/** Where the return stands: being put together, ready to file, filed, and settled. */
export type TaxStatus = 'open' | 'ready' | 'filed' | 'paid';

export interface TaxRateRow {
  id: string;
  rate: TaxRate;
  outputBase: number;
  outputTax: number;
  inputBase: number;
  inputTax: number;
  /** Output tax less input tax at this rate. */
  net: number;
}

export interface TaxSummary {
  /** Highest rate first, exempt last. */
  rows: TaxRateRow[];
  outputBase: number;
  outputTax: number;
  inputBase: number;
  inputTax: number;
  /** Output less input: positive is owed to the tax office, negative is a refund. */
  net: number;
  position: 'payable' | 'refund' | 'nil';
}

/** Tax at a rate on a base, rounded to the minor unit; nothing on exempt supplies. */
export function taxOn(base: number, rate: TaxRate, currency: string): number {
  if (rate === 'exempt') return 0;
  return fromMinor(toMinor(base * rate, currency), currency);
}

const order = (rate: TaxRate) => (rate === 'exempt' ? -1 : rate);

/**
 * Output and input tax per rate and in total, in minor units, and whether the period ends with
 * tax to pay or a refund to claim.
 */
export function taxSummary(entries: readonly TaxRateEntry[], currency: string): TaxSummary {
  const totals = { outputBase: 0, outputTax: 0, inputBase: 0, inputTax: 0 };
  const rows = [...entries]
    .sort((a, b) => order(b.rate) - order(a.rate))
    .map((entry) => {
      const outputTax = toMinor(
        entry.outputTax ?? taxOn(entry.outputBase, entry.rate, currency),
        currency,
      );
      const inputTax = toMinor(
        entry.inputTax ?? taxOn(entry.inputBase, entry.rate, currency),
        currency,
      );
      const outputBase = toMinor(entry.outputBase, currency);
      const inputBase = toMinor(entry.inputBase, currency);
      totals.outputBase += outputBase;
      totals.outputTax += outputTax;
      totals.inputBase += inputBase;
      totals.inputTax += inputTax;
      return {
        id: entry.id,
        rate: entry.rate,
        outputBase: fromMinor(outputBase, currency),
        outputTax: fromMinor(outputTax, currency),
        inputBase: fromMinor(inputBase, currency),
        inputTax: fromMinor(inputTax, currency),
        net: fromMinor(outputTax - inputTax, currency),
      };
    });
  const net = totals.outputTax - totals.inputTax;
  return {
    rows,
    outputBase: fromMinor(totals.outputBase, currency),
    outputTax: fromMinor(totals.outputTax, currency),
    inputBase: fromMinor(totals.inputBase, currency),
    inputTax: fromMinor(totals.inputTax, currency),
    net: fromMinor(net, currency),
    position: net > 0 ? 'payable' : net < 0 ? 'refund' : 'nil',
  };
}

/** Whole days from today to the due date: zero on the day, negative once it has passed. */
export function daysToDue(due: Date, today: Date): number {
  return daysBetween(today, due);
}

/**
 * Late when the due date has passed and something is still to do: the return is not filed yet, or
 * it is filed with tax still to pay.
 */
export function isTaxOverdue(
  status: TaxStatus,
  due: Date,
  today: Date,
  position: TaxSummary['position'],
): boolean {
  if (daysToDue(due, today) >= 0) return false;
  if (status === 'open' || status === 'ready') return true;
  return status === 'filed' && position === 'payable';
}
