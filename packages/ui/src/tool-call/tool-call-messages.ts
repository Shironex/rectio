export type ToolCallStatus = 'running' | 'done' | 'failed';

/** Words the tool call says, for apps that translate or reword them. */
export interface ToolCallMessages {
  running: string;
  done: string;
  failed: string;
  input: string;
  output: string;
  error: string;
}

export const TOOL_CALL_MESSAGES: ToolCallMessages = {
  running: 'Running',
  done: 'Done',
  failed: 'Failed',
  input: 'Input',
  output: 'Output',
  error: 'Error',
};

/** A value as indented JSON; something JSON cannot hold reads as its string form instead. */
export function formatToolValue(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    // `undefined` and functions stringify to nothing at all.
    const json: unknown = JSON.stringify(value, null, 2);
    return typeof json === 'string' ? json : String(value);
  } catch {
    return String(value);
  }
}
