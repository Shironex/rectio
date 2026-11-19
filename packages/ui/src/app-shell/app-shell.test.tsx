import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Sidebar, SidebarContent, SidebarItem } from '../sidebar/sidebar';
import { AppShell, AppShellHeader } from './app-shell';

describe('AppShell', () => {
  it('starts the Tab order with a skip link to the main landmark', async () => {
    render(
      <AppShell
        sidebar={
          <Sidebar>
            <SidebarContent>
              <SidebarItem href="/overview">Overview</SidebarItem>
            </SidebarContent>
          </Sidebar>
        }
        header={<AppShellHeader title={<h1>Overview</h1>} actions={<button>Account</button>} />}
      >
        <p>Page</p>
      </AppShell>,
    );
    await userEvent.tab();
    const skip = screen.getByRole('link', { name: 'Skip to content' });
    expect(skip).toHaveFocus();
    expect(skip).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
    expect(screen.getByRole('banner')).toContainElement(
      screen.getByRole('button', { name: 'Collapse sidebar' }),
    );
    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
  });
});
