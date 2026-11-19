import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AvatarGroup } from './avatar-group';

const people = [
  'Ana Ruiz',
  'Tomasz Nowak',
  'Lena Fischer',
  'Ivo Petrov',
  'Mei Tanaka',
  'Omar Haddad',
].map((name) => ({ name }));

describe('AvatarGroup', () => {
  it('folds the rest into a +N chip that names who it hides', () => {
    render(<AvatarGroup label="Approvers" items={people} max={3} locale="en" />);
    const group = screen.getByRole('group', { name: 'Approvers' });
    expect(within(group).getAllByRole('img')).toHaveLength(4);
    expect(
      within(group).getByRole('img', {
        name: '3 more: Ivo Petrov, Mei Tanaka, and Omar Haddad',
      }),
    ).toHaveTextContent('+3');
  });

  it('never folds a single avatar into +1', () => {
    render(<AvatarGroup label="Team" items={people.slice(0, 4)} max={3} />);
    expect(screen.queryByText('+1')).not.toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(4);
  });

  it('can be focused from the keyboard to reveal the names, and shows them in words', () => {
    render(<AvatarGroup label="Approvers" items={people.slice(0, 2)} locale="en" />);
    const group = screen.getByRole('group', { name: 'Approvers' });
    expect(group).toHaveAttribute('tabindex', '0');
    expect(screen.getByText('Ana Ruiz and Tomasz Nowak')).toBeInTheDocument();
  });

  it('leaves the names to assistive technology with names="none", and is not focusable', () => {
    render(<AvatarGroup label="Approvers" items={people.slice(0, 2)} names="none" />);
    expect(screen.getByRole('group')).not.toHaveAttribute('tabindex');
    expect(screen.queryByText(/and/)).not.toBeInTheDocument();
  });
});
