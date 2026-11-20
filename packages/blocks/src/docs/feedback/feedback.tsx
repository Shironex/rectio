import { CheckCircleIcon, ThumbsDownIcon, ThumbsUpIcon } from '@phosphor-icons/react';
import { Field, FieldError, FieldLabel, Textarea, cn } from '@rectio/ui';
import { useEffect, useId, useReducer, useRef } from 'react';

import { mergeMessages } from '../lib/messages';
import { useDocsParts } from '../lib/parts';
import { COMMENT_LIMIT, feedbackReducer, type DocsFeedbackValue } from './feedback.logic';

export interface DocsFeedbackProps {
  /**
   * Sends the vote and the comment wherever you collect them: an analytics event, a form endpoint,
   * an issue tracker. Reject to show the error and keep the comment.
   */
  onSubmit: (value: DocsFeedbackValue) => Promise<void> | void;
  /** Called on the vote itself, before any comment, if you count votes separately. */
  onVote?: ((helpful: boolean) => void) | undefined;
  question?: string;
  /** Prompts above the comment field after a yes and after a no. */
  prompts?: { helpful?: string; unhelpful?: string };
  thanks?: string;
  /** The block's words; pass the keys you change. See `DOCS_FEEDBACK_MESSAGES`. */
  messages?: Partial<DocsFeedbackMessages>;
  className?: string;
}

export interface DocsFeedbackMessages {
  /** Names the feedback region. */
  label: string;
  question: string;
  yes: string;
  no: string;
  /** Above the comment field after a yes. */
  helpfulPrompt: string;
  /** Above the comment field after a no. */
  unhelpfulPrompt: string;
  send: string;
  cancel: string;
  /** Shown when sending failed; the comment is kept. */
  error: string;
  /** Said once the feedback is sent. */
  thanks: string;
}

export const DOCS_FEEDBACK_MESSAGES: DocsFeedbackMessages = {
  label: 'Page feedback',
  question: 'Was this page helpful?',
  yes: 'Yes',
  no: 'No',
  helpfulPrompt: 'What worked well? (optional)',
  unhelpfulPrompt: 'What was missing or wrong? (optional)',
  send: 'Send feedback',
  cancel: 'Cancel',
  error: 'Your feedback was not sent. Your comment is still here: try again.',
  thanks: 'Thanks for telling us. It helps us fix the pages that need it.',
};

/**
 * Was this page helpful? A yes or no, then an optional comment, then thanks. The vote is a pressed
 * toggle the reader can change until they send; a failed send keeps what they wrote and says so.
 */
export function DocsFeedback({
  onSubmit,
  onVote,
  question,
  prompts,
  thanks,
  messages,
  className,
}: DocsFeedbackProps) {
  const m = mergeMessages(DOCS_FEEDBACK_MESSAGES, messages);
  const { Button, Swap } = useDocsParts();
  const [state, dispatch] = useReducer(feedbackReducer, { step: 'ask' });
  const field = useRef<HTMLTextAreaElement>(null);
  const questionId = useId();
  // The first vote opens the comment field and moves focus into it; a changed vote leaves focus.
  const focusField = useRef(false);
  useEffect(() => {
    if (!focusField.current || state.step !== 'comment') return;
    focusField.current = false;
    field.current?.focus();
  }, [state.step]);

  const vote = (helpful: boolean) => {
    if (state.step === 'ask') focusField.current = true;
    dispatch({ type: 'vote', helpful });
    onVote?.(helpful);
  };
  const send = async () => {
    if (state.step !== 'comment' && state.step !== 'error') return;
    const value = { helpful: state.helpful, comment: state.comment.trim() };
    dispatch({ type: 'send' });
    try {
      await onSubmit(value);
      dispatch({ type: 'sent' });
    } catch {
      dispatch({ type: 'failed' });
    }
  };

  const helpful = state.step === 'ask' ? null : state.helpful;
  const voteButton = (value: boolean) => {
    const Icon = value ? ThumbsUpIcon : ThumbsDownIcon;
    const pressed = helpful === value;
    return (
      <button
        type="button"
        aria-pressed={pressed}
        disabled={state.step === 'sending'}
        onClick={() => {
          vote(value);
        }}
        className={cn(
          'inline-flex h-(--rx-button-height-sm) cursor-pointer items-center gap-1.5 rounded-control border border-line bg-surface px-2.5 text-sm font-medium text-fg',
          'transition-[background-color,border-color,color,scale] duration-fast ease-standard active:scale-96 motion-reduce:active:scale-100',
          'pointer-fine:hover:border-line-strong aria-pressed:border-accent aria-pressed:bg-accent-subtle aria-pressed:text-accent-strong',
          'disabled:cursor-default disabled:opacity-60 pointer-coarse:h-(--rx-button-height-touch)',
          'outline-offset-2 focus-visible:outline-2 focus-visible:outline-focus',
        )}
      >
        <Icon aria-hidden weight={pressed ? 'fill' : 'bold'} className="size-4" />
        {value ? m.yes : m.no}
      </button>
    );
  };

  return (
    <section
      aria-label={m.label}
      data-slot="docs-feedback"
      className={cn('flex flex-col gap-3', className)}
    >
      <Swap swapKey={state.step === 'done' ? 'done' : 'ask'}>
        {state.step === 'done' ? (
          <p role="status" className="flex items-start gap-2 text-sm text-fg">
            <CheckCircleIcon
              aria-hidden
              weight="fill"
              className="mt-px size-4 shrink-0 text-positive-strong"
            />
            {thanks ?? m.thanks}
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p id={questionId} className="text-sm font-medium text-fg">
                {question ?? m.question}
              </p>
              <div role="group" aria-labelledby={questionId} className="flex gap-2">
                {voteButton(true)}
                {voteButton(false)}
              </div>
            </div>
            {state.step !== 'ask' && (
              <form
                className="flex max-w-lg flex-col gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void send();
                }}
              >
                <Field invalid={state.step === 'error'}>
                  <FieldLabel>
                    {state.helpful
                      ? (prompts?.helpful ?? m.helpfulPrompt)
                      : (prompts?.unhelpful ?? m.unhelpfulPrompt)}
                  </FieldLabel>
                  <Textarea
                    ref={field}
                    value={state.comment}
                    onValueChange={(comment: string) => {
                      dispatch({ type: 'type', comment });
                    }}
                    maxLength={COMMENT_LIMIT}
                    showCount
                    minRows={2}
                    maxRows={6}
                    disabled={state.step === 'sending'}
                  />
                  {state.step === 'error' && <FieldError match>{m.error}</FieldError>}
                </Field>
                <div className="flex gap-2">
                  <Button type="submit" size="sm" loading={state.step === 'sending'}>
                    {m.send}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={state.step === 'sending'}
                    onClick={() => {
                      dispatch({ type: 'reset' });
                    }}
                  >
                    {m.cancel}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </Swap>
    </section>
  );
}
