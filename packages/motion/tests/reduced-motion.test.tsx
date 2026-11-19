import { Money as PlainMoney } from '@rectio/ui';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AmountInput,
  Button,
  Dialog,
  DialogContent,
  DialogTrigger,
  Money,
  MotionPreferenceProvider,
  TableCell,
  TableRow,
  TableRows,
  ToastProvider,
  useToast,
} from '../src/index';

/** Pretends to be a browser that can animate, with the system's reduced motion set or not. */
function browser({ reduce }: { reduce: boolean }) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion: reduce'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  Object.defineProperty(Element.prototype, 'animate', {
    configurable: true,
    value: vi.fn(),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(Element.prototype, 'animate');
});

function Specimens() {
  return (
    <>
      <Button>Save expense</Button>
      <AmountInput aria-label="Amount" currency="EUR" locale="en-IE" value={129.4} />
      <Money amount={1082.32} currency="EUR" locale="en-IE" />
      <table>
        <tbody>
          <TableRows>
            <TableRow>
              <TableCell>Lufthansa</TableCell>
            </TableRow>
          </TableRows>
        </tbody>
      </table>
    </>
  );
}

const moving = (container: HTMLElement) => container.querySelectorAll('[data-motion]').length;

describe('motioned components', () => {
  it('render their motion markup in a browser that may animate', () => {
    browser({ reduce: false });
    const { container } = render(<Specimens />);
    // Button, amount input, money and the row each mark themselves.
    expect(moving(container)).toBe(4);
  });

  describe('collapse to the plain components', () => {
    beforeEach(() => {
      browser({ reduce: false });
    });

    it('when the system asks for reduced motion', () => {
      browser({ reduce: true });
      const { container } = render(<Specimens />);
      expect(moving(container)).toBe(0);
    });

    it('when the app turns motion off', () => {
      const { container } = render(
        <MotionPreferenceProvider value="off">
          <Specimens />
        </MotionPreferenceProvider>,
      );
      expect(moving(container)).toBe(0);
    });

    it('when the browser cannot animate', () => {
      Reflect.deleteProperty(Element.prototype, 'animate');
      const { container } = render(<Specimens />);
      expect(moving(container)).toBe(0);
    });

    it('with exactly the plain markup', () => {
      browser({ reduce: true });
      const motioned = render(<Money amount={-54.12} currency="EUR" locale="en-IE" />);
      const html = motioned.container.innerHTML;
      motioned.unmount();
      const plain = render(<PlainMoney amount={-54.12} currency="EUR" locale="en-IE" />);
      expect(html).toBe(plain.container.innerHTML);
    });
  });

  it('open the dialog as the plain one does under reduced motion', async () => {
    browser({ reduce: true });
    const dialog = (children: ReactNode) => (
      <Dialog>
        <DialogTrigger>Submit for approval</DialogTrigger>
        <DialogContent>{children}</DialogContent>
      </Dialog>
    );
    render(dialog(<p>Report 2041 goes to Piotr Nowak.</p>));
    await userEvent.click(screen.getByRole('button', { name: 'Submit for approval' }));
    const popup = screen.getByRole('dialog');
    expect(popup).not.toHaveAttribute('data-motion');
    expect(popup).toHaveTextContent('Report 2041 goes to Piotr Nowak.');
  });

  describe('toast', () => {
    function AddButton() {
      const toast = useToast();
      return (
        <button
          type="button"
          onClick={() => {
            toast.add({ type: 'success', title: 'Expense added' });
          }}
        >
          Add
        </button>
      );
    }
    const showToast = async (preference: 'user' | 'off' = 'user') => {
      render(
        <MotionPreferenceProvider value={preference}>
          <ToastProvider>
            <AddButton />
          </ToastProvider>
        </MotionPreferenceProvider>,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Add' }));
      await screen.findByText('Expense added');
      const toast = document.querySelector('[data-slot="toast"]');
      if (toast === null) throw new Error('no toast');
      return toast;
    };

    it('arrives on the slow duration with motion, from the same useToast', async () => {
      browser({ reduce: false });
      const toast = await showToast();
      expect(toast).toHaveClass('duration-slow');
      expect(toast.className).toContain(
        'data-starting-style:translate-y-(--rx-motion-distance-origin)',
      );
    });

    it('is the plain toast under reduced motion', async () => {
      browser({ reduce: true });
      expect(await showToast()).not.toHaveClass('duration-slow');
    });

    it('is the plain toast when the app turns motion off', async () => {
      browser({ reduce: false });
      expect(await showToast('off')).not.toHaveClass('duration-slow');
    });
  });
});
