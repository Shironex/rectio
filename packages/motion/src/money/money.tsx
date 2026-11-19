import { Money as PlainMoney, cn, formatMoneyParts, type MoneyProps } from '@rectio/ui';
import { useLayoutEffect, useRef } from 'react';

import { usePlainMotion } from '../lib/mode';
import { readMotionTokens } from '../lib/tokens';

export type { MoneyProps };

/** The figures of one frame, with the currency dimmed like the plain Money draws it. */
interface FrameOptions {
  currency: string;
  locale: string | undefined;
  signDisplay: MoneyProps['signDisplay'];
  accounting: boolean | undefined;
  quietCurrency: boolean | undefined;
  tone: MoneyProps['tone'];
}

function frameNodes(value: number, options: FrameOptions): Node[] {
  const { currency, locale, signDisplay, accounting, quietCurrency, tone } = options;
  return formatMoneyParts(value, currency, {
    locale,
    signDisplay: signDisplay ?? 'auto',
    accounting: accounting ?? false,
  }).map((part) => {
    if (part.type !== 'currency' || quietCurrency !== true || tone === 'auto') {
      return document.createTextNode(part.value);
    }
    const span = document.createElement('span');
    span.className = 'text-fg-muted';
    span.textContent = part.value;
    return span;
  });
}

/**
 * Counts from the shown figure to the new one when the amount changes, on the `count` duration
 * with the `settle` easing: even at first, then a soft landing on the exact figure. It waits the
 * `base` duration first, so the change that caused it (a row opening or leaving) has landed before
 * the total answers it. This is the add-on's one signature moment, meant for totals. It never runs
 * on the first render.
 *
 * Legibility and accessibility:
 * - The real amount stays rendered, transparent, in the same grid cell; screen readers read only
 *   the final figure, and the cell is as wide as the wider of the two, so nothing beside it moves.
 * - Tabular figures, so each digit keeps its column while it counts.
 * - The count is monotonic (an easing, never a spring), so a total never overshoots.
 */
function MotionMoney(props: MoneyProps) {
  const { amount, tone = 'neutral', className, ...rest } = props;
  const { currency, locale, signDisplay, accounting, quietCurrency } = props;
  const wrap = useRef<HTMLSpanElement>(null);
  const ticker = useRef<HTMLSpanElement>(null);
  const shown = useRef(amount);

  useLayoutEffect(() => {
    const from = shown.current;
    const to = amount;
    const host = wrap.current;
    const face = ticker.current;
    if (from === to || host === null || face === null) return;
    const tokens = readMotionTokens(face);
    if (tokens === null) {
      shown.current = to;
      return;
    }

    // A timing-only animation is the clock: its computed progress already has the easing applied.
    const clock = new Animation(
      new KeyframeEffect(null, null, {
        duration: tokens.duration.count * 1000,
        delay: tokens.duration.base * 1000,
        // The token as CSS text: WAAPI takes the easing as the stylesheet writes it.
        easing: getComputedStyle(face).getPropertyValue('--rx-motion-easing-settle'),
        // Both: the old figure holds through the delay instead of reading as no progress.
        fill: 'both',
      }),
      document.timeline,
    );
    let frame = 0;
    const draw = () => {
      const progress = clock.effect?.getComputedTiming().progress ?? 1;
      const done = clock.playState === 'finished';
      shown.current = done ? to : from + (to - from) * progress;
      face.replaceChildren(
        ...frameNodes(shown.current, {
          currency,
          locale,
          signDisplay,
          accounting,
          quietCurrency,
          tone,
        }),
      );
      if (done) {
        delete host.dataset.counting;
        return;
      }
      frame = requestAnimationFrame(draw);
    };
    host.dataset.counting = '';
    clock.play();
    draw();
    return () => {
      cancelAnimationFrame(frame);
      clock.cancel();
      delete host.dataset.counting;
    };
  }, [amount, currency, locale, signDisplay, accounting, quietCurrency, tone]);

  return (
    <span
      ref={wrap}
      data-slot="money-motion"
      data-motion=""
      className={cn(
        'inline-grid justify-items-end',
        tone === 'auto' && amount > 0 && 'text-positive-strong',
        tone === 'auto' && amount < 0 && 'text-negative-strong',
        className,
      )}
    >
      <PlainMoney
        amount={amount}
        tone={tone}
        className="col-start-1 row-start-1 in-data-counting:opacity-0"
        {...rest}
      />
      <span
        ref={ticker}
        aria-hidden
        className={cn(
          'col-start-1 row-start-1 hidden whitespace-nowrap',
          'font-(family-name:--rx-money-family) tabular-nums lining-nums',
          'in-data-counting:inline',
        )}
      />
    </span>
  );
}

/** Money that counts to a new amount. Same props as the plain one; plain under reduced motion. */
export function Money(props: MoneyProps) {
  const plain = usePlainMotion();
  return plain ? <PlainMoney {...props} /> : <MotionMoney {...props} />;
}
