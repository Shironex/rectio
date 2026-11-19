import { sumMoney } from '../lib/finance';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ExpenseRequest {
  id: string;
  employee: string;
  merchant: string;
  category: string;
  date: Date;
  /** Major units. */
  amount: number;
  status: ApprovalStatus;
  /** Policy findings to check before approving, such as "Over the 300 limit" or "No receipt". */
  flags?: readonly string[];
}

export type AuditAction = 'submitted' | 'approved' | 'rejected' | 'reopened';

export interface AuditEvent {
  id: string;
  requestId: string;
  action: AuditAction;
  actor: string;
  at: Date;
  /** Required for a rejection. */
  reason?: string;
}

export interface ApprovalState {
  requests: readonly ExpenseRequest[];
  /** Oldest first. */
  events: readonly AuditEvent[];
}

export type ApprovalCommand =
  | { type: 'approve'; ids: readonly string[]; actor: string; at: Date }
  | { type: 'reject'; ids: readonly string[]; actor: string; at: Date; reason: string }
  | { type: 'reopen'; id: string; actor: string; at: Date };

/** The shortest reason accepted for a rejection, so "no" alone never reaches the employee. */
export const MIN_REASON_LENGTH = 8;

/** What is wrong with a rejection reason, as a code a block turns into its own words. */
export function reasonProblem(reason: string): 'missing' | 'short' | null {
  const text = reason.trim();
  if (text === '') return 'missing';
  if (text.length < MIN_REASON_LENGTH) return 'short';
  return null;
}

/** Null when the reason will do, or what is wrong with it, in English. */
export function reasonError(reason: string): string | null {
  const problem = reasonProblem(reason);
  if (problem === 'missing') return 'Say why, so the employee knows what to fix.';
  if (problem === 'short') return `Write at least ${String(MIN_REASON_LENGTH)} characters.`;
  return null;
}

/** Which moves are allowed: decide a pending request, or reopen a decided one. */
export function canTransition(from: ApprovalStatus, command: ApprovalCommand['type']): boolean {
  if (command === 'reopen') return from !== 'pending';
  return from === 'pending';
}

let sequence = 0;
const eventId = () => {
  sequence += 1;
  return `ev-${String(Date.now())}-${String(sequence)}`;
};

/**
 * Applies a decision. Requests that cannot make the move (an approval of a rejected request, a
 * rejection without a valid reason) are left as they were, and only the requests that changed get
 * an audit event. Returns the same state object when nothing changed.
 */
export function approvalReducer(state: ApprovalState, command: ApprovalCommand): ApprovalState {
  if (command.type === 'reject' && reasonError(command.reason) !== null) return state;
  const ids = new Set(command.type === 'reopen' ? [command.id] : command.ids);
  const next: ApprovalStatus =
    command.type === 'approve' ? 'approved' : command.type === 'reject' ? 'rejected' : 'pending';
  const action: AuditAction =
    command.type === 'approve' ? 'approved' : command.type === 'reject' ? 'rejected' : 'reopened';
  const events: AuditEvent[] = [];
  const requests = state.requests.map((request) => {
    if (!ids.has(request.id) || !canTransition(request.status, command.type)) return request;
    events.push({
      id: eventId(),
      requestId: request.id,
      action,
      actor: command.actor,
      at: command.at,
      ...(command.type === 'reject' ? { reason: command.reason.trim() } : {}),
    });
    return { ...request, status: next };
  });
  if (events.length === 0) return state;
  return { requests, events: [...state.events, ...events] };
}

export function pendingTotal(requests: readonly ExpenseRequest[], currency: string): number {
  return sumMoney(
    requests.filter((r) => r.status === 'pending').map((r) => r.amount),
    currency,
  );
}
