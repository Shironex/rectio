import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LinkProvider } from '@rectio/ui';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  AiChatThread,
  AssistantSidebar,
  AssistantSidebarProvider,
  AssistantSidebarTrigger,
  ChatWorkspace,
  PromptComposer,
  type AiChatSummary,
} from '../src/ai';
import {
  AssistantSidebar as MotionAssistantSidebar,
  ChatWorkspace as MotionChatWorkspace,
  PromptComposer as MotionPromptComposer,
} from '../src/ai/motion';

const COMMANDS = [
  { id: '1', name: 'summarize', description: 'Summarize the thread' },
  { id: '2', name: 'chart', description: 'Draw a chart' },
];

describe('PromptComposer', () => {
  it('lists slash commands as the field types and picks one with the keyboard', async () => {
    const onCommand = vi.fn();
    const onSubmit = vi.fn();
    render(<PromptComposer commands={COMMANDS} onCommand={onCommand} onSubmit={onSubmit} />);
    const field = screen.getByRole('textbox', { name: 'Message' });
    await userEvent.type(field, '/');
    const list = screen.getByRole('listbox', { name: 'Commands' });
    expect(within(list).getAllByRole('option')).toHaveLength(2);
    expect(field).toHaveAttribute('aria-controls', list.id);
    expect(field).toHaveAttribute(
      'aria-activedescendant',
      within(list).getAllByRole('option')[0]?.id,
    );
    await userEvent.keyboard('{ArrowDown}');
    expect(within(list).getByRole('option', { name: /chart/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await userEvent.keyboard('{Enter}');
    expect(onCommand).toHaveBeenCalledWith(COMMANDS[1]);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(field).toHaveValue('/chart ');
    expect(field).toHaveFocus();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes the list on Escape and sends with Enter once it is closed', async () => {
    const onSubmit = vi.fn();
    render(<PromptComposer commands={COMMANDS} onSubmit={onSubmit} />);
    const field = screen.getByRole('textbox');
    await userEvent.type(field, '/sum');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await userEvent.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledWith('/sum', []);
  });

  it('picks a command with the pointer and says when nothing matches', async () => {
    render(<PromptComposer commands={COMMANDS} onSubmit={vi.fn()} />);
    const field = screen.getByRole('textbox');
    await userEvent.type(field, 'Then /zz');
    expect(screen.getByText('No commands match')).toBeInTheDocument();
    await userEvent.clear(field);
    await userEvent.type(field, 'Then /su');
    await userEvent.click(screen.getByRole('option', { name: /summarize/ }));
    expect(field).toHaveValue('Then /summarize ');
  });

  it('counts tokens against a limit and holds Send back past it', async () => {
    const onSubmit = vi.fn();
    render(
      <PromptComposer
        onSubmit={onSubmit}
        count="tokens"
        limit={3}
        countTokens={(text) => text.split(' ').filter(Boolean).length}
        locale="en-US"
      />,
    );
    const field = screen.getByRole('textbox');
    await userEvent.type(field, 'one two');
    const count = document.querySelector('[data-part="count"]');
    expect(count).toHaveTextContent('2 / 3 tokens');
    expect(count).toHaveAttribute('data-tone', 'quiet');
    await userEvent.type(field, ' three four');
    expect(count).toHaveAttribute('data-tone', 'over');
    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('offers a named model picker that reports the choice', async () => {
    const onModelChange = vi.fn();
    render(
      <PromptComposer
        onSubmit={vi.fn()}
        models={[
          { id: 'fast', label: 'Fast' },
          { id: 'deep', label: 'Deep reasoning' },
        ]}
        onModelChange={onModelChange}
      />,
    );
    const picker = screen.getByRole('combobox', { name: 'Model' });
    expect(picker).toHaveTextContent('Fast');
    await userEvent.click(picker);
    await userEvent.click(await screen.findByRole('option', { name: 'Deep reasoning' }));
    expect(onModelChange).toHaveBeenCalledWith('deep');
  });

  it('renders the motion twin with the same behaviour', async () => {
    render(<MotionPromptComposer commands={COMMANDS} onSubmit={vi.fn()} />);
    await userEvent.type(screen.getByRole('textbox'), '/');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('can stand in for the thread field through renderComposer', async () => {
    const onSend = vi.fn();
    render(
      <AiChatThread
        conversation={[]}
        onSend={onSend}
        renderComposer={(slot) => <PromptComposer {...slot} commands={COMMANDS} />}
      />,
    );
    await userEvent.type(screen.getByRole('textbox'), 'Hello{Enter}');
    expect(onSend).toHaveBeenCalledWith('Hello', []);
  });
});

const NOW = new Date(2026, 10, 22, 12);
const CHATS: AiChatSummary[] = [
  { id: 'a', title: 'Q3 close checklist', updatedAt: new Date(2026, 10, 22, 9) },
  { id: 'b', title: 'Overdue invoices', updatedAt: new Date(2026, 10, 21, 18) },
  { id: 'c', title: 'Runway scenarios', updatedAt: new Date(2026, 10, 10), pinned: true },
];

function Workspace(props: Partial<Parameters<typeof ChatWorkspace>[0]>) {
  const [chats, setChats] = useState(CHATS);
  return (
    <ChatWorkspace
      chats={chats}
      activeId="a"
      now={NOW}
      conversation={[]}
      onSend={vi.fn()}
      onNewChat={vi.fn()}
      onRename={(chat, title) => {
        setChats((all) => all.map((c) => (c.id === chat.id ? { ...c, title } : c)));
      }}
      onDelete={(chat) => {
        setChats((all) => all.filter((c) => c.id !== chat.id));
      }}
      onPinChange={(chat, pinned) => {
        setChats((all) => all.map((c) => (c.id === chat.id ? { ...c, pinned } : c)));
      }}
      {...props}
    />
  );
}

describe('ChatWorkspace', () => {
  it('lists chats in named groups with the open one current, and titles the thread', () => {
    render(<Workspace />);
    const nav = screen.getByRole('navigation', { name: 'Chats' });
    expect(within(nav).getByRole('heading', { name: 'Pinned' })).toBeInTheDocument();
    expect(within(nav).getByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(within(nav).getByRole('heading', { name: 'Yesterday' })).toBeInTheDocument();
    expect(within(nav).getByRole('button', { name: 'Q3 close checklist' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Q3 close checklist' }),
    ).toBeInTheDocument();
  });

  it('selects a chat, and links through the LinkProvider when given hrefs', async () => {
    const onSelect = vi.fn();
    const routed = vi.fn();
    render(
      <LinkProvider
        render={({ href, children, ...rest }) => (
          <a
            href={href}
            data-routed=""
            {...rest}
            onClick={(e) => {
              e.preventDefault();
              routed(href);
              rest.onClick?.(e);
            }}
          >
            {children}
          </a>
        )}
      >
        <Workspace onSelect={onSelect} chatHref={(chat) => `/chats/${chat.id}`} />
      </LinkProvider>,
    );
    const link = screen.getByRole('link', { name: 'Overdue invoices' });
    expect(link).toHaveAttribute('href', '/chats/b');
    await userEvent.click(link);
    expect(routed).toHaveBeenCalledWith('/chats/b');
    expect(onSelect).toHaveBeenCalledWith(CHATS[1]);
  });

  it('searches the list, says how many were found, and offers a way back from no match', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<Workspace />);
    const search = screen.getByRole('searchbox', { name: 'Search chats' });
    await userEvent.type(search, 'overdue');
    expect(screen.queryByRole('button', { name: 'Q3 close checklist' })).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(screen.getByText('1 chat found')).toBeInTheDocument();
    await userEvent.clear(search);
    await userEvent.type(search, 'zzz');
    expect(screen.getByText('No chats match zzz')).toBeInTheDocument();
    const [, emptyClear] = screen.getAllByRole('button', { name: 'Clear search' });
    if (emptyClear !== undefined) await userEvent.click(emptyClear);
    expect(screen.getByRole('button', { name: 'Q3 close checklist' })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('renames in place and returns focus to the row', async () => {
    render(<Workspace />);
    await userEvent.click(screen.getByRole('button', { name: 'More for Overdue invoices' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    const field = await screen.findByRole('textbox', { name: 'Chat title' });
    await waitFor(() => {
      expect(field).toHaveFocus();
    });
    await userEvent.clear(field);
    await userEvent.type(field, '  Late   invoices {Enter}');
    const row = screen.getByRole('button', { name: 'Late invoices' });
    expect(row).toHaveFocus();
  });

  it('keeps the title when a rename is cancelled with Escape', async () => {
    render(<Workspace />);
    await userEvent.click(screen.getByRole('button', { name: 'More for Overdue invoices' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Rename' }));
    const field = await screen.findByRole('textbox', { name: 'Chat title' });
    await userEvent.type(field, 'x{Escape}');
    expect(screen.getByRole('button', { name: 'Overdue invoices' })).toHaveFocus();
  });

  it('deletes after a confirmation and moves focus to the next chat', async () => {
    render(<Workspace />);
    await userEvent.click(screen.getByRole('button', { name: 'More for Q3 close checklist' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete this chat?' });
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete chat' }));
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Q3 close checklist' })).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Overdue invoices' })).toHaveFocus();
    });
  });

  it('pins and unpins from the row menu', async () => {
    render(<Workspace />);
    await userEvent.click(screen.getByRole('button', { name: 'More for Overdue invoices' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Pin' }));
    const pinned = screen.getByRole('region', { name: 'Pinned' });
    expect(within(pinned).getByRole('button', { name: 'Overdue invoices' })).toBeInTheDocument();
  });

  it('shows empty and loading states', () => {
    const { rerender } = render(<Workspace chats={[]} />);
    expect(screen.getByText('No chats yet')).toBeInTheDocument();
    rerender(
      <ChatWorkspace chats={CHATS} chatsLoading threadLoading conversation={[]} onSend={vi.fn()} />,
    );
    expect(screen.getByText('Loading chats')).toBeInTheDocument();
    expect(screen.getByText('Loading conversation')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Message' })).toBeDisabled();
  });

  it('opens the list in a sheet from the title bar', async () => {
    render(<Workspace />);
    const trigger = screen.getByRole('button', { name: 'Chats' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    const sheet = await screen.findByRole('dialog', { name: 'Chats' });
    expect(within(sheet).getByRole('navigation', { name: 'Chats' })).toBeInTheDocument();
  });

  it('renders the motion twin', () => {
    render(<MotionChatWorkspace chats={CHATS} conversation={[]} onSend={vi.fn()} now={NOW} />);
    expect(screen.getByRole('navigation', { name: 'Chats' })).toBeInTheDocument();
  });
});

function Docked({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <AssistantSidebar
      defaultOpen={defaultOpen}
      panel={<AiChatThread conversation={[]} onSend={vi.fn()} />}
    >
      <button type="button">Page action</button>
    </AssistantSidebar>
  );
}

describe('AssistantSidebar', () => {
  it('folds to a rail, opens with focus in the field and returns it on close', async () => {
    render(<Docked />);
    const rail = screen.getByRole('complementary', { name: 'Assistant' });
    await userEvent.click(within(rail).getByRole('button', { name: 'Open assistant' }));
    const panel = screen.getByRole('complementary', { name: 'Assistant' });
    expect(within(panel).getByRole('textbox', { name: 'Message' })).toHaveFocus();
    expect(screen.getByRole('separator', { name: 'Resize the assistant' })).toBeInTheDocument();
    await userEvent.click(within(panel).getByRole('button', { name: 'Close assistant' }));
    expect(screen.getByRole('button', { name: 'Open assistant' })).toHaveFocus();
  });

  it('opens with the shortcut, brings the focus in, and closes from inside back to the page', async () => {
    render(<Docked />);
    const page = screen.getByRole('button', { name: 'Page action' });
    page.focus();
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'j', ctrlKey: true });
    const field = await screen.findByRole('textbox', { name: 'Message' });
    expect(field).toHaveFocus();
    page.focus();
    fireEvent.keyDown(page, { key: 'j', ctrlKey: true });
    expect(field).toHaveFocus();
    fireEvent.keyDown(field, { key: 'j', ctrlKey: true });
    expect(screen.queryByRole('textbox', { name: 'Message' })).not.toBeInTheDocument();
    expect(page).toHaveFocus();
  });

  it('opens from a trigger outside it through the provider', async () => {
    render(
      <AssistantSidebarProvider>
        <AssistantSidebarTrigger />
        <AssistantSidebar collapsed="hidden" panel={<p>Ask me</p>}>
          <p>Page</p>
        </AssistantSidebar>
      </AssistantSidebarProvider>,
    );
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: 'Open assistant' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(trigger);
    expect(screen.getByRole('complementary', { name: 'Assistant' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Assistant' })).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(trigger);
    expect(trigger).toHaveFocus();
  });

  it('renders the motion twin open', () => {
    render(
      <MotionAssistantSidebar defaultOpen panel={<p>Ask me</p>}>
        <p>Page</p>
      </MotionAssistantSidebar>,
    );
    expect(screen.getByText('Ask me')).toBeInTheDocument();
  });
});
