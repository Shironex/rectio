import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import {
  TabsList as PlainTabsList,
  TabsPanel as PlainTabsPanel,
  cn,
  tabsIndicator,
  type TabsListProps,
  type TabsPanelProps,
} from '@rectio/ui';
import { useLayoutEffect, useRef, type ComponentProps, type CSSProperties } from 'react';

import { springTo, tweenTo, type Controls } from '../lib/animate';
import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { readMotionTokens } from '../lib/tokens';

export type { TabsListProps, TabsPanelProps };

const px = (style: CSSProperties | undefined, name: string) => {
  const value = (style as Record<string, unknown> | undefined)?.[name];
  const n =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number.parseFloat(value)
        : Number.NaN;
  return Number.isFinite(n) ? n : null;
};

/**
 * The indicator, gliding to the active tab on the press spring. Base UI moves it by setting
 * `--active-tab-left` and `--active-tab-width`; here the jump between the old and new place is
 * animated (position and a horizontal scale, never the width), picking up mid glide if the user
 * switches again.
 */
function GlidingIndicator({ ref, style, ...props }: ComponentProps<'span'>) {
  const node = useRef<HTMLSpanElement | null>(null);
  const last = useRef<{ left: number; width: number } | null>(null);
  const running = useRef<Controls | null>(null);
  const left = px(style, '--active-tab-left');
  const width = px(style, '--active-tab-width');

  useLayoutEffect(() => {
    const element = node.current;
    if (element === null || left === null || width === null || width === 0) return;
    const previous = last.current;
    last.current = { left, width };
    if (previous === null || (previous.left === left && previous.width === width)) return;
    const tokens = readMotionTokens(element);
    if (tokens === null) return;
    // Where it is drawn now (mid glide if interrupted), then where it lands once nothing moves it.
    const from = element.getBoundingClientRect();
    running.current?.stop();
    for (const animation of element.getAnimations()) animation.cancel();
    element.style.removeProperty('transform');
    const to = element.getBoundingClientRect();
    if (to.width === 0) return;
    running.current = springTo(
      element,
      {
        transform: [
          `translateX(${String(from.left - to.left)}px) scaleX(${String(from.width / to.width)})`,
          'translateX(0px) scaleX(1)',
        ],
      },
      tokens.spring.press,
    );
  }, [left, width]);

  return (
    <span
      ref={(value) => {
        node.current = value;
        assignRef(ref, value);
      }}
      style={style}
      {...props}
    />
  );
}

/**
 * TabsList whose indicator glides between tabs instead of jumping. Same props as the plain one;
 * under reduced motion it is the plain one.
 */
export function TabsList({ variant = 'line', children, ...props }: TabsListProps) {
  const plain = usePlainMotion();
  if (plain)
    return (
      <PlainTabsList variant={variant} {...props}>
        {children}
      </PlainTabsList>
    );
  return (
    <PlainTabsList variant={variant} indicator={false} data-motion="" {...props}>
      {children}
      <BaseTabs.Indicator
        data-slot="tabs-indicator"
        className={cn(tabsIndicator[variant], 'origin-left')}
        render={(indicatorProps) => <GlidingIndicator {...indicatorProps} />}
      />
    </PlainTabsList>
  );
}

function MotionPanel({ ref, ...props }: ComponentProps<'div'>) {
  const node = useRef<HTMLDivElement | null>(null);
  const hidden = props.hidden === true;

  useLayoutEffect(() => {
    const element = node.current;
    if (element === null || hidden) return;
    const direction = element.getAttribute('data-activation-direction');
    // The first panel of a page appears in place; only a switch moves.
    if (direction !== 'left' && direction !== 'right') return;
    const tokens = readMotionTokens(element);
    if (tokens === null) return;
    const sign = direction === 'right' ? '' : '-';
    tweenTo(
      element,
      {
        transform: [`translateX(${sign}${tokens.distance.tick})`, 'none'],
        opacity: [0, 1],
      },
      tokens.duration.fast,
      tokens.easing.enter,
    );
  }, [hidden]);

  return (
    <div
      ref={(value) => {
        node.current = value;
        assignRef(ref, value);
      }}
      {...props}
    />
  );
}

/**
 * TabsPanel that slides in a few pixels from the side of the newly active tab, so the switch reads
 * as a direction. Under reduced motion it is the plain one.
 */
export function TabsPanel(props: TabsPanelProps) {
  const plain = usePlainMotion();
  if (plain) return <PlainTabsPanel {...props} />;
  return (
    <PlainTabsPanel
      {...props}
      data-motion=""
      render={(panelProps) => <MotionPanel {...panelProps} />}
    />
  );
}
