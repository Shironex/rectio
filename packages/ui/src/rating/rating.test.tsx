import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Rating, RatingDisplay } from './rating';

const fills = () =>
  [...document.querySelectorAll('[data-slot="rating-star"] > [data-fill]')].map((star) =>
    star.getAttribute('data-fill'),
  );

describe('Rating', () => {
  it('is a named radio group with one radio per star', () => {
    render(<Rating aria-label="Vendor score" defaultValue={3} />);
    expect(screen.getByRole('radiogroup', { name: 'Vendor score' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
    expect(screen.getByRole('radio', { name: '3 stars' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '1 star' })).not.toBeChecked();
    expect(fills()).toEqual(['full', 'full', 'full', 'empty', 'empty']);
  });

  it('sets the rating with a press and reports a number', async () => {
    const onValueChange = vi.fn();
    render(<Rating aria-label="Vendor score" onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('radio', { name: '4 stars' }));
    expect(onValueChange).toHaveBeenLastCalledWith(4);
    expect(screen.getByRole('radio', { name: '4 stars' })).toBeChecked();
    expect(fills()).toEqual(['full', 'full', 'full', 'full', 'empty']);
  });

  it('moves the rating with the arrow keys', async () => {
    const onValueChange = vi.fn();
    render(<Rating aria-label="Vendor score" defaultValue={2} onValueChange={onValueChange} />);
    screen.getByRole('radio', { name: '2 stars' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onValueChange).toHaveBeenLastCalledWith(3);
    expect(screen.getByRole('radio', { name: '3 stars' })).toHaveFocus();
  });

  it('takes half steps with two radios per star', async () => {
    const onValueChange = vi.fn();
    render(<Rating aria-label="Score" allowHalf max={3} onValueChange={onValueChange} />);
    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('aria-label'))).toEqual([
      '0.5 stars',
      '1 star',
      '1.5 stars',
      '2 stars',
      '2.5 stars',
      '3 stars',
    ]);
    await userEvent.click(screen.getByRole('radio', { name: '2.5 stars' }));
    expect(onValueChange).toHaveBeenLastCalledWith(2.5);
    expect(fills()).toEqual(['full', 'full', 'half']);
  });

  it('sets a whole star on a tap and its half on a second tap, where halves let taps through', async () => {
    const onValueChange = vi.fn();
    render(<Rating aria-label="Score" allowHalf max={3} onValueChange={onValueChange} />);
    // On a touch screen the half radios take no presses: a tap lands on the star cell.
    for (const radio of screen.getAllByRole('radio'))
      expect(radio).toHaveClass('pointer-coarse:pointer-events-none');
    const third = document.querySelectorAll<HTMLElement>('[data-slot="rating-star"]')[2];
    if (third === undefined) throw new Error('no third star');
    await userEvent.click(third);
    expect(onValueChange).toHaveBeenLastCalledWith(3);
    expect(fills()).toEqual(['full', 'full', 'full']);
    await userEvent.click(third);
    expect(onValueChange).toHaveBeenLastCalledWith(2.5);
    expect(fills()).toEqual(['full', 'full', 'half']);
    expect(screen.getByRole('radio', { name: '2.5 stars' })).toBeChecked();
  });

  it('keeps whole-star radios pressable on touch screens', () => {
    render(<Rating aria-label="Score" max={3} />);
    for (const radio of screen.getAllByRole('radio'))
      expect(radio).not.toHaveClass('pointer-coarse:pointer-events-none');
  });

  it('previews the value under the mouse and goes back when it leaves', async () => {
    render(<Rating aria-label="Score" defaultValue={1} />);
    await userEvent.hover(screen.getByRole('radio', { name: '4 stars' }));
    expect(fills()).toEqual(['full', 'full', 'full', 'full', 'empty']);
    await userEvent.unhover(screen.getByRole('radiogroup'));
    expect(fills()).toEqual(['full', 'empty', 'empty', 'empty', 'empty']);
  });

  it('cannot be changed when read only or disabled', async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Rating aria-label="Score" defaultValue={2} readOnly onValueChange={onValueChange} />,
    );
    await userEvent.click(screen.getByRole('radio', { name: '5 stars' }));
    rerender(<Rating aria-label="Score" defaultValue={2} disabled onValueChange={onValueChange} />);
    await userEvent.click(screen.getByRole('radio', { name: '5 stars' }));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('names the options in the app language', () => {
    render(
      <Rating
        aria-label="Bewertung"
        max={2}
        getItemLabel={(value) => `${String(value)} von 2 Sternen`}
      />,
    );
    expect(screen.getByRole('radio', { name: '2 von 2 Sternen' })).toBeInTheDocument();
  });
});

describe('RatingDisplay', () => {
  it('is one image named by its reading, rounded to half stars', () => {
    render(<RatingDisplay value={4.3} showValue />);
    expect(screen.getByRole('img', { name: '4.3 out of 5 stars' })).toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    const shown = [...document.querySelectorAll('[data-slot="rating-display"] > [data-fill]')].map(
      (star) => star.getAttribute('data-fill'),
    );
    expect(shown).toEqual(['full', 'full', 'full', 'full', 'half']);
  });

  it('takes a label of its own', () => {
    render(<RatingDisplay value={3} max={4} label="Rated 3 of 4 by finance" />);
    expect(screen.getByRole('img', { name: 'Rated 3 of 4 by finance' })).toBeInTheDocument();
  });

  it('formats the figure in a fixed locale unless given one', () => {
    const { rerender } = render(<RatingDisplay value={4.5} showValue />);
    expect(screen.getByText('4.5')).toBeInTheDocument();
    rerender(<RatingDisplay value={4.5} showValue locale="de-DE" />);
    expect(screen.getByText('4,5')).toBeInTheDocument();
  });
});
