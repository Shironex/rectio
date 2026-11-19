/** What the reader told you about a page. */
export interface DocsFeedbackValue {
  helpful: boolean;
  /** Empty when the reader skipped the comment. */
  comment: string;
}

/**
 * The widget's steps: asking, then the vote taken and an optional comment open, sending, thanked,
 * or a failed send that keeps the comment so nothing typed is lost.
 */
export type FeedbackState =
  | { step: 'ask' }
  | { step: 'comment'; helpful: boolean; comment: string }
  | { step: 'sending'; helpful: boolean; comment: string }
  | { step: 'done'; helpful: boolean }
  | { step: 'error'; helpful: boolean; comment: string };

export type FeedbackAction =
  | { type: 'vote'; helpful: boolean }
  | { type: 'type'; comment: string }
  | { type: 'send' }
  | { type: 'sent' }
  | { type: 'failed' }
  | { type: 'reset' };

/** Longest comment accepted; the field counts down to it. */
export const COMMENT_LIMIT = 500;

export function feedbackReducer(state: FeedbackState, action: FeedbackAction): FeedbackState {
  switch (action.type) {
    case 'vote':
      return state.step === 'ask' || state.step === 'comment'
        ? {
            step: 'comment',
            helpful: action.helpful,
            comment: state.step === 'comment' ? state.comment : '',
          }
        : state;
    case 'type':
      return state.step === 'comment' || state.step === 'error'
        ? {
            step: state.step,
            helpful: state.helpful,
            comment: action.comment.slice(0, COMMENT_LIMIT),
          }
        : state;
    case 'send':
      return state.step === 'comment' || state.step === 'error'
        ? { step: 'sending', helpful: state.helpful, comment: state.comment.trim() }
        : state;
    case 'sent':
      return state.step === 'sending' ? { step: 'done', helpful: state.helpful } : state;
    case 'failed':
      return state.step === 'sending'
        ? { step: 'error', helpful: state.helpful, comment: state.comment }
        : state;
    case 'reset':
      return { step: 'ask' };
  }
}
