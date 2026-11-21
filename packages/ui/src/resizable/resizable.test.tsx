import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './resizable';

/** jsdom has no layout: each panel measures as wide as its flex-grow, the group as their sum. */
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'setPointerCapture', {
    configurable: true,
    value: vi.fn(),
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement,
  ) {
    const grow = Number.parseFloat(this.style.flexGrow || this.style.flex || '0');
    const width = this.dataset.slot === 'resizable-group' ? 1000 : grow * 10;
    return {
      width,
      height: width,
      top: 0,
      left: 0,
      right: width,
      bottom: width,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    };
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLElement.prototype, 'setPointerCapture');
  localStorage.clear();
});

function Layout(props: { onLayout?: (sizes: number[]) => void; storageKey?: string }) {
  return (
    <ResizablePanelGroup {...props}>
      <ResizablePanel id="list" defaultSize={30} minSize={20} maxSize={50}>
        Invoices
      </ResizablePanel>
      <ResizableHandle label="Resize the invoice list" />
      <ResizablePanel id="detail" defaultSize={70} minSize={40}>
        Invoice 2041
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

const handle = () => screen.getByRole('separator', { name: 'Resize the invoice list' });
const flex = (id: string) => Number.parseFloat(document.getElementById(id)?.style.flexGrow ?? '');

describe('Resizable', () => {
  it('starts at the default sizes and describes the handle as a separator', () => {
    render(<Layout />);
    expect(flex('list')).toBe(30);
    expect(flex('detail')).toBe(70);
    expect(handle()).toHaveAttribute('aria-orientation', 'vertical');
    expect(handle()).toHaveAttribute('aria-controls', 'list');
    expect(handle()).toHaveAttribute('aria-valuenow', '30');
    expect(handle()).toHaveAttribute('aria-valuemin', '20');
    expect(handle()).toHaveAttribute('aria-valuemax', '50');
  });

  it('moves with the arrow keys and stops at the limits', async () => {
    const onLayout = vi.fn();
    render(<Layout onLayout={onLayout} />);
    handle().focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(flex('list')).toBeCloseTo(35);
    expect(flex('detail')).toBeCloseTo(65);
    expect(onLayout).toHaveBeenLastCalledWith([expect.closeTo(35), expect.closeTo(65)]);
    await userEvent.keyboard('{End}');
    expect(flex('list')).toBeCloseTo(50);
    expect(handle()).toHaveAttribute('aria-valuenow', '50');
    await userEvent.keyboard('{ArrowRight}');
    expect(flex('list')).toBeCloseTo(50);
    await userEvent.keyboard('{Home}');
    expect(flex('list')).toBeCloseTo(20);
    await userEvent.keyboard('{ArrowLeft}');
    expect(flex('list')).toBeCloseTo(20);
  });

  it('respects the other panel limits too', async () => {
    render(
      <ResizablePanelGroup>
        <ResizablePanel id="a" defaultSize={50} maxSize={90}>
          A
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel id="b" defaultSize={50} minSize={40}>
          B
        </ResizablePanel>
      </ResizablePanelGroup>,
    );
    screen.getByRole('separator').focus();
    await userEvent.keyboard('{End}');
    expect(flex('a')).toBeCloseTo(60);
    expect(flex('b')).toBeCloseTo(40);
  });

  it('resizes with a drag', async () => {
    render(<Layout />);
    const user = userEvent.setup();
    await user.pointer([
      { keys: '[MouseLeft>]', target: handle(), coords: { clientX: 300 } },
      { target: handle(), coords: { clientX: 400 } },
      { keys: '[/MouseLeft]', target: handle(), coords: { clientX: 400 } },
    ]);
    expect(flex('list')).toBeCloseTo(40);
    expect(handle()).toHaveFocus();
  });

  it('remembers the layout under its storage key', async () => {
    const { unmount } = render(<Layout storageKey="invoices" />);
    handle().focus();
    await userEvent.keyboard('{ArrowLeft}');
    unmount();
    render(<Layout storageKey="invoices" />);
    expect(flex('list')).toBeCloseTo(25);
  });

  it('goes back to the defaults on a double click', async () => {
    render(<Layout />);
    handle().focus();
    await userEvent.keyboard('{End}');
    await userEvent.dblClick(handle());
    expect(flex('list')).toBeCloseTo(30);
  });

  it('stacks panels with a vertical group and the up and down keys', async () => {
    render(
      <ResizablePanelGroup direction="vertical">
        <ResizablePanel id="top" defaultSize={50}>
          Chart
        </ResizablePanel>
        <ResizableHandle label="Resize the chart" />
        <ResizablePanel id="bottom" defaultSize={50}>
          Table
        </ResizablePanel>
      </ResizablePanelGroup>,
    );
    const separator = screen.getByRole('separator', { name: 'Resize the chart' });
    expect(separator).toHaveAttribute('aria-orientation', 'horizontal');
    separator.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(flex('top')).toBeCloseTo(55);
  });
});
