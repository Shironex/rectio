'use client';

import { Component, type ReactNode } from 'react';

interface ReplyBoundaryProps {
  /** The reply as written, shown as plain text if drawing it fails. */
  text: string;
  children: ReactNode;
}

/**
 * Keeps one reply that fails to draw from taking down the whole thread: the reply falls back to
 * its words as plain text, and every other message stays as it was. A new text tries again.
 */
export class ReplyBoundary extends Component<ReplyBoundaryProps, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidUpdate(previous: ReplyBoundaryProps): void {
    if (this.state.failed && previous.text !== this.props.text) this.setState({ failed: false });
  }

  override render(): ReactNode {
    if (this.state.failed) {
      return <p className="whitespace-pre-wrap text-fg wrap-anywhere">{this.props.text}</p>;
    }
    return this.props.children;
  }
}
