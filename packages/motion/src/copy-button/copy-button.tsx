import { CheckIcon, CopyIcon } from '@phosphor-icons/react';
import { CopyButton as PlainCopyButton, cn, type CopyButtonProps } from '@rectio/ui';
import { useLayoutEffect, useRef } from 'react';

import { springTo, type Controls } from '../lib/animate';
import { usePlainMotion } from '../lib/mode';
import { readMotionTokens } from '../lib/tokens';

export type { CopyButtonProps };

/** Opacity and blur stay CSS transitions; the spring owns the scale. */
const ICON = cn(
  'col-start-1 row-start-1 size-4',
  'transition-[opacity,filter] duration-fast ease-standard',
);

/**
 * The check settles into place on the press spring, so the copy reads as done rather than as an
 * icon swap; the copy icon fades out under it. Going back after the copied state is a quiet
 * crossfade. A second copy mid spring turns it around from where it is.
 */
function MotionCopyIcons({ copied }: { copied: boolean }) {
  const check = useRef<SVGSVGElement | null>(null);
  const running = useRef<Controls | null>(null);

  useLayoutEffect(() => {
    const element = check.current;
    if (element === null || !copied) return;
    const tokens = readMotionTokens(element);
    if (tokens === null) return;
    const from =
      running.current === null ? String(tokens.scale.from) : getComputedStyle(element).scale;
    running.current?.stop();
    running.current = springTo(element, { scale: [from, '1'] }, tokens.spring.press);
    return () => {
      running.current?.stop();
      running.current = null;
    };
  }, [copied]);

  return (
    <span aria-hidden data-part="icons" className="grid place-items-center">
      <CopyIcon weight="bold" className={cn(ICON, copied && 'opacity-0 blur-xs')} />
      <CheckIcon
        ref={check}
        weight="bold"
        className={cn(ICON, 'text-positive-strong', !copied && 'opacity-0 blur-xs')}
      />
    </span>
  );
}

const renderIcon = (copied: boolean) => <MotionCopyIcons copied={copied} />;

/**
 * CopyButton whose check settles in on a spring. Same props as the plain one; under reduced motion
 * it is the plain one, whose icons swap with a crossfade.
 */
export function CopyButton(props: CopyButtonProps) {
  const plain = usePlainMotion();
  return plain ? (
    <PlainCopyButton {...props} />
  ) : (
    <PlainCopyButton data-motion="" renderIcon={renderIcon} {...props} />
  );
}
