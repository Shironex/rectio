/**
 * rectio pro finance blocks, plain variant. Each block has a motioned twin with the same name and
 * props in `@rectio/blocks/motion`; pick per block by import path.
 */
export { BlockPanel, type BlockPanelProps } from './lib/block-panel';
export * from './lib/finance';
export { InvoiceList, type InvoiceListProps } from './invoice-list/invoice-list';
export * from './invoice-list/invoice-list.logic';
export { InvoiceDetail, type InvoiceDetailProps } from './invoice-detail/invoice-detail';
export * from './invoice-detail/invoice-detail.logic';
export { Ledger, type LedgerProps } from './ledger/ledger';
export * from './ledger/ledger.logic';
export { CashFlowChart, type CashFlowChartProps } from './cash-flow/cash-flow-chart';
export * from './cash-flow/cash-flow.logic';
export { KpiRow, type KpiRowProps } from './kpi-row/kpi-row';
export * from './kpi-row/kpi-row.logic';
export { ExpenseApproval, type ExpenseApprovalProps } from './expense-approval/expense-approval';
export * from './expense-approval/expense-approval.logic';
export { ArAging, type ArAgingProps } from './ar-aging/ar-aging';
export * from './ar-aging/ar-aging.logic';
export { BudgetVsActual, type BudgetVsActualProps } from './budget-vs-actual/budget-vs-actual';
export * from './budget-vs-actual/budget-vs-actual.logic';
