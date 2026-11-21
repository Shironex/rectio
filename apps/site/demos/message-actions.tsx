'use client';

import {
  MessageActions,
  MessageCopyAction,
  MessageEditAction,
  MessageFeedback,
  MessageRegenerateAction,
  type MessageFeedbackValue,
} from '@rectio/ui';
import { useState } from 'react';

/** One tab stop; the arrow keys move between the actions. */
export default function MessageActionsDemo() {
  const [rating, setRating] = useState<MessageFeedbackValue>(null);
  return (
    <MessageActions>
      <MessageCopyAction value="Three invoices are past due, $18,420.00 in total." />
      <MessageFeedback value={rating} onValueChange={setRating} />
      <MessageRegenerateAction onClick={() => undefined} />
      <MessageEditAction onClick={() => undefined} />
    </MessageActions>
  );
}
