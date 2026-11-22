/** Every word the assistant sidebar says, for apps that translate or reword them. */
export interface AssistantSidebarMessages {
  /** Names the panel, a complementary landmark, and titles it. */
  label: string;
  open: string;
  close: string;
  /** Names the handle between the page and the panel. */
  resize: string;
}

export const ASSISTANT_SIDEBAR_MESSAGES: AssistantSidebarMessages = {
  label: 'Assistant',
  open: 'Open assistant',
  close: 'Close assistant',
  resize: 'Resize the assistant',
};
