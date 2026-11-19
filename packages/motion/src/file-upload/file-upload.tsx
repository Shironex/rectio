import {
  FileDropzone as PlainFileDropzone,
  FileItem as PlainFileItem,
  FileList as PlainFileList,
  type FileDropzoneProps,
  type FileItemProps,
  type FileListProps,
} from '@rectio/ui';
import { AnimatePresence, PresenceContext, usePresence } from 'motion/react';
import { use, useCallback, useLayoutEffect, useRef } from 'react';

import { springTo, tweenTo, type Controls } from '../lib/animate';
import { usePlainMotion } from '../lib/mode';
import { assignRef } from '../lib/ref';
import { readMotionTokens } from '../lib/tokens';

export type { FileDropzoneProps, FileItemProps, FileListProps };

/** The vertical offset an element is drawn at by its transform, in pixels. */
function transformY(element: HTMLElement): number {
  const transform = getComputedStyle(element).transform;
  if (transform === 'none' || typeof DOMMatrixReadOnly === 'undefined') return 0;
  return new DOMMatrixReadOnly(transform).m42;
}

/**
 * When a row arrives in the middle, leaves, or grows a line (an error message), the rows below
 * glide to their new place instead of jumping: a FLIP on transform only, never height. Each glide
 * starts from where the row is drawn now, so a second removal mid glide carries on smoothly.
 */
function useRowReflow(on: boolean) {
  return useCallback(
    (list: HTMLUListElement | null) => {
      if (!on || list === null) return;
      const resting = new Map<HTMLElement, number>();
      const running = new Map<HTMLElement, Controls>();
      const rows = () =>
        [...list.children].filter(
          (row): row is HTMLElement => row instanceof HTMLElement && !row.inert,
        );
      const record = () => {
        resting.clear();
        for (const row of rows()) resting.set(row, row.offsetTop);
      };
      record();

      // Runs after the DOM changed and before the frame is painted, so no jump is ever drawn.
      const observer = new MutationObserver(() => {
        const tokens = readMotionTokens(list);
        if (tokens !== null) {
          for (const row of rows()) {
            const before = resting.get(row);
            const now = row.offsetTop;
            if (before === undefined || before === now) continue;
            const from = before + transformY(row) - now;
            running.get(row)?.stop();
            running.set(
              row,
              tweenTo(
                row,
                { transform: [`translateY(${String(from)}px)`, 'translateY(0px)'] },
                tokens.duration.base,
                tokens.easing.standard,
              ),
            );
          }
        }
        record();
      });
      observer.observe(list, {
        childList: true,
        subtree: true,
        characterData: true,
        attributeFilter: ['data-status'],
      });
      return () => {
        observer.disconnect();
        for (const controls of running.values()) controls.stop();
      };
    },
    [on],
  );
}

/**
 * FileList whose rows arrive with a short fade and lift, leave faster, and let the rows below
 * glide into the gap. Use it with the motioned FileItem. Same props as the plain one.
 */
export function FileList({ ref, children, ...props }: FileListProps) {
  const plain = usePlainMotion();
  const reflow = useRowReflow(!plain);
  const outer = useRef(ref);
  useLayoutEffect(() => {
    outer.current = ref;
  }, [ref]);
  const attach = useCallback(
    (node: HTMLUListElement | null) => {
      const cleanup = reflow(node);
      assignRef(outer.current, node);
      return () => {
        cleanup?.();
        assignRef(outer.current, null);
      };
    },
    [reflow],
  );
  if (plain)
    return (
      <PlainFileList ref={ref} {...props}>
        {children}
      </PlainFileList>
    );
  return (
    <PlainFileList ref={attach} data-motion="" {...props}>
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </PlainFileList>
  );
}

/**
 * Same as the plain FileItem. Inside the motioned FileList it fades up into place when added and
 * fades out, quicker, when removed (out of the tab order at once). When its upload finishes, the
 * check settles in from slightly smaller. Rows present on the first render never animate.
 */
export function FileItem({ ref, file, ...props }: FileItemProps) {
  const plain = usePlainMotion();
  const [isPresent, safeToRemove] = usePresence();
  const presence = use(PresenceContext);
  const node = useRef<HTMLLIElement | null>(null);
  const settled = useRef(presence === null || presence.initial === false);
  const status = useRef(file.status);

  useLayoutEffect(() => {
    const row = node.current;
    const tokens = row === null || plain ? null : readMotionTokens(row);
    if (row === null || tokens === null) {
      settled.current = true;
      // After the commit, not in this layout effect: AnimatePresence registers the leaving row in
      // its own layout effect, which runs after this child's, and ignores an earlier completion.
      if (!isPresent) queueMicrotask(safeToRemove);
      return;
    }
    const { duration, easing, distance } = tokens;
    if (isPresent) {
      if (settled.current) return;
      settled.current = true;
      tweenTo(
        row,
        { opacity: [0, 1], transform: [`translateY(${distance.shift})`, 'translateY(0px)'] },
        duration.base,
        easing.enter,
      );
      return;
    }
    row.inert = true;
    // The end state under the animation, so no full-opacity frame shows before removal.
    row.style.opacity = '0';
    // The exit token is an ease-in curve; leaving takes the enter curve so it starts at once.
    void tweenTo(
      row,
      { opacity: [1, 0], transform: ['translateY(0px)', `translateY(-${distance.shift})`] },
      duration.fast,
      easing.enter,
    ).then(() => {
      safeToRemove();
    });
  }, [isPresent, plain, safeToRemove]);

  useLayoutEffect(() => {
    const before = status.current;
    status.current = file.status;
    if (plain || before === file.status || file.status !== 'done') return;
    const icon = node.current?.querySelector('[data-part="status-icon"]');
    const tokens = icon == null ? null : readMotionTokens(icon);
    if (icon == null || tokens === null) return;
    springTo(
      icon,
      { transform: [`scale(${String(tokens.scale.origin)})`, 'scale(1)'] },
      tokens.spring.press,
    );
    tweenTo(icon, { opacity: [0, 1] }, tokens.duration.fast, tokens.easing.enter);
  }, [file.status, plain]);

  return (
    <PlainFileItem
      ref={(value: HTMLLIElement | null) => {
        node.current = value;
        assignRef(ref, value);
      }}
      data-motion={plain ? undefined : ''}
      file={file}
      {...props}
    />
  );
}

/**
 * FileDropzone whose icon lifts a little on the press spring while files are held over it, and
 * settles back when they leave or drop: the zone answers before the user lets go. Same props as
 * the plain one.
 */
export function FileDropzone({ ref, ...props }: FileDropzoneProps) {
  const plain = usePlainMotion();
  const node = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    const zone = node.current;
    if (plain || zone === null) return;
    let lift: Controls | null = null;
    let raised = zone.hasAttribute('data-dragging');
    const observer = new MutationObserver(() => {
      const dragging = zone.hasAttribute('data-dragging');
      if (dragging === raised) return;
      raised = dragging;
      const icon = zone.querySelector<HTMLElement>('[data-part="dropzone-icon"]');
      const tokens = readMotionTokens(zone);
      if (icon === null || tokens === null) return;
      // Read where the icon is drawn now, mid spring if the files left quickly, before stopping.
      const from = getComputedStyle(icon).transform;
      const to = dragging ? `translateY(-${tokens.distance.shift})` : 'translateY(0px)';
      lift?.stop();
      icon.style.transform = to;
      lift = springTo(
        icon,
        { transform: [from === 'none' ? 'translateY(0px)' : from, to] },
        tokens.spring.press,
      );
    });
    observer.observe(zone, { attributes: true, attributeFilter: ['data-dragging'] });
    return () => {
      observer.disconnect();
      lift?.stop();
    };
  }, [plain]);

  if (plain) return <PlainFileDropzone ref={ref} {...props} />;
  return (
    <PlainFileDropzone
      ref={(value: HTMLButtonElement | null) => {
        node.current = value;
        assignRef(ref, value);
      }}
      data-motion=""
      {...props}
    />
  );
}
